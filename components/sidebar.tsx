"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion } from "framer-motion"
import {
  BarChart3,
  Users,
  UserCheck,
  UserPlus,
  Calendar,
  Target,
  Briefcase,
  FileText,
  ChevronLeft,
  ChevronRight,
  Database,
  FileOutput,
  Download,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'



interface SidebarProps {
  activePage: string
  setActivePage: (page: string) => void
}

export function Sidebar({ activePage, setActivePage }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  // 使用固定的头像种子，避免每次刷新都变化
  const [avatarSeed] = useState("sales" + Math.floor(Math.random() * 1000))

  const navItems = [
    { id: "leads", label: "商机线索", icon: UserPlus, color: "text-brand-blue" },
    { id: "prospects", label: "潜在客户", icon: Users, color: "text-brand-indigo" },
    { id: "targets", label: "目标客户", icon: UserCheck, color: "text-brand-purple" },
    { id: "plans", label: "计划", icon: Calendar, color: "text-brand-pink" },
    { id: "goals", label: "目标", icon: Target, color: "text-brand-teal" },
    { id: "projects", label: "项目事务", icon: Briefcase, color: "text-brand-green" },
    { id: "reports", label: "数据报告", icon: BarChart3, color: "text-brand-amber" },
    { id: "database", label: "数据库管理", icon: Database, color: "text-brand-red" },
  ]

  // 添加自定义颜色变量
  const accentColors = {
    bg: "bg-brand-purple/10",
    text: "text-brand-purple",
    border: "bg-brand-purple"
  }

  // 处理导出PDF的函数
  const handleExportPDF = (type: 'current' | 'all') => {
    // 定义PPT规格的宽高参数
    const pptWidth = 1280; // 16:9 PPT宽度
    const pptHeight = 720; // 16:9 PPT高度
    
    // 显示导出进度提示
    const exportType = type === 'current' ? '当前页面' : '所有页面';
    const pageSize = 'PPT格式(16:9)';
    
    console.log(`正在导出${exportType}为PDF，页面尺寸为${pageSize}。`);
    
    if (type === 'current') {
      // 导出当前页面
      // 查找页面内容元素 - 由于没有明确的page-content类，我们需要查找主要内容区域
      const pageContent = document.querySelector('.flex-1.h-screen.overflow-hidden');
      if (!pageContent) {
        alert('找不到页面内容，请确保页面已正确加载。');
        return;
      }

      // 查找当前活动页面的子元素
      const activePageContent = pageContent.firstChild;
      if (!activePageContent) {
        alert('找不到当前页面内容，请确保页面已正确渲染。');
        return;
      }

      html2canvas(activePageContent as HTMLElement, { 
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [pptWidth, pptHeight]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, pptWidth, pptHeight);
        pdf.save(`销售管理系统_${activePage}_${new Date().toISOString().slice(0, 10)}.pdf`);
      }).catch(err => {
        console.error('导出PDF时发生错误:', err);
        alert('导出PDF失败，请查看控制台获取详细错误信息。');
      });
    } else {
      // 导出所有页面 - 重写的版本
      const router = useRouter();
      const allPages = [...navItems.map(item => item.id), "customers"];
      let currentPageIndex = 0;
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [pptWidth, pptHeight]
      });
      
      // 创建加载提示
      const loadingDiv = document.createElement('div');
      loadingDiv.style.position = 'fixed';
      loadingDiv.style.top = '50%';
      loadingDiv.style.left = '50%';
      loadingDiv.style.transform = 'translate(-50%, -50%)';
      loadingDiv.style.padding = '20px';
      loadingDiv.style.background = 'rgba(0, 0, 0, 0.7)';
      loadingDiv.style.color = 'white';
      loadingDiv.style.borderRadius = '10px';
      loadingDiv.style.zIndex = '9999';
      loadingDiv.style.fontWeight = 'bold';
      document.body.appendChild(loadingDiv);
      
      // 需要保存原始页面以便稍后恢复
      const originalPage = activePage;
      
      // 递归处理每个页面
      const processPage = async (index: number) => {
        if (index >= allPages.length) {
          // 所有页面处理完毕
          document.body.removeChild(loadingDiv);
          pdf.save(`销售管理系统_所有页面_${new Date().toISOString().slice(0, 10)}.pdf`);
          
          // 恢复到原始页面
          setTimeout(() => {
            setActivePage(originalPage);
          }, 500);
          return;
        }
        
        // 更新加载提示
        loadingDiv.textContent = `正在导出页面 ${index + 1}/${allPages.length}`;
        
        // 设置当前页面
        setActivePage(allPages[index]);
        
        // 等待页面渲染完成
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 查找页面内容
        const mainContainer = document.querySelector('.flex-1.h-screen.overflow-hidden');
        if (!mainContainer || !mainContainer.firstChild) {
          console.error(`找不到页面 ${allPages[index]} 的内容`);
          processPage(index + 1);
          return;
        }
        
        try {
          // 转换页面为图像
          const canvas = await html2canvas(mainContainer.firstChild as HTMLElement, {
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
          });
          
          // 添加新页面(除了第一页)
          if (index > 0) {
            pdf.addPage([pptWidth, pptHeight], 'landscape');
          }
          
          // 添加图像到PDF
          const imgData = canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 0, 0, pptWidth, pptHeight);
          
          // 添加页面标题
          const pageName = navItems.find(item => item.id === allPages[index])?.label || 
                          (allPages[index] === "customers" ? "客户信息" : allPages[index]);
          pdf.setFontSize(10);
          pdf.text(pageName, pptWidth / 2, pptHeight - 10, { align: 'center' });
          
          // 处理下一个页面
          processPage(index + 1);
        } catch (err) {
          console.error(`导出页面 ${allPages[index]} 时发生错误:`, err);
          processPage(index + 1);
        }
      };
      
      // 开始处理第一个页面
      processPage(0);
    }
  };

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-10 shadow-sm",
        collapsed ? "w-14" : "w-56",
      )}
    >
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-brand-purple/5 to-brand-pink/5">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <Avatar className="h-9 w-9 ring-2 ring-brand-purple/20 shadow-sm">
              <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`} alt="用户头像" />
              <AvatarFallback className="bg-gradient-to-br from-brand-purple to-brand-pink text-white text-xs">
                用户
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-brand-purple">个人信息</p>
              <p className="text-xs text-muted-foreground">销售管理系统</p>
            </div>
          </div>
        )}
        <Button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-muted-foreground hover:text-brand-purple h-7 w-7 rounded-full hover:bg-brand-purple/10 p-0"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <div className="flex-1 overflow-auto py-3 px-2">
        <nav className="grid gap-1.5">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "justify-start rounded-lg transition-all duration-200 relative overflow-hidden",
                activePage === item.id 
                  ? "bg-brand-purple/10 text-brand-purple font-medium shadow-sm" 
                  : "text-muted-foreground hover:bg-brand-purple/5 hover:text-brand-purple",
                collapsed ? "h-10 px-2" : "h-9 px-3",
              )}
              onClick={() => setActivePage(item.id)}
            >
              <item.icon className={cn("h-4 w-4", activePage === item.id ? item.color : "text-muted-foreground")} />
              {!collapsed && <span className="ml-2 text-sm">{item.label}</span>}
              {activePage === item.id && (
                <motion.div
                  className="absolute inset-y-0 left-0 w-1 bg-brand-purple rounded-r-full"
                  layoutId={`indicator-${item.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </Button>
          ))}
        </nav>
      </div>
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-1.5 bg-gradient-to-b from-transparent to-brand-purple/5">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start rounded-lg transition-all duration-200 relative overflow-hidden",
            activePage === "customers" 
              ? "bg-brand-purple/10 text-brand-purple font-medium shadow-sm" 
              : "text-muted-foreground hover:bg-brand-purple/5 hover:text-brand-purple",
            collapsed ? "h-10 px-2" : "h-9 px-3",
          )}
          onClick={() => setActivePage("customers")}
        >
          <FileText
            className={cn("h-4 w-4", activePage === "customers" ? "text-brand-red" : "text-muted-foreground")}
          />
          {!collapsed && <span className="ml-2 text-sm">客户信息</span>}
          {activePage === "customers" && (
            <motion.div
              className="absolute inset-y-0 left-0 w-1 bg-brand-purple rounded-r-full"
              layoutId="indicator-customers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </Button>

        {/* 导出PDF功能 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start rounded-lg transition-all duration-200",
                "text-muted-foreground hover:bg-brand-purple/5 hover:text-brand-purple !hover:bg-brand-purple/5 !hover:text-brand-purple",
                collapsed ? "h-10 px-2" : "h-9 px-3",
              )}
            >
              <FileOutput className="h-4 w-4 text-brand-pink" />
              {!collapsed && <span className="ml-2 text-sm">导出PDF</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-52 rounded-lg shadow-md">
            <DropdownMenuItem onClick={() => handleExportPDF('current')} className="cursor-pointer hover:bg-brand-purple/5 rounded-md my-0.5 focus:bg-brand-purple/10">
              <Download className="h-4 w-4 mr-2 text-brand-purple" />
              <span>导出当前页面(PPT格式)</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleExportPDF('all')} className="cursor-pointer hover:bg-brand-purple/5 rounded-md my-0.5 focus:bg-brand-purple/10">
              <Download className="h-4 w-4 mr-2 text-brand-indigo" />
              <span>导出全部页面(PPT格式)</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  )
}
