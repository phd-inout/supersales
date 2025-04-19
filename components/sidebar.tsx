"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
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
  Settings,
} from "lucide-react"
import { UserSettingsDialog } from "@/components/user-settings-dialog"
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
  // 获取router实例，移到组件顶层
  const router = useRouter();
  // 新增 open 状态用于控制 UserSettingsDialog 显示
  const [userDialogOpen, setUserDialogOpen] = useState(false);

  // 创建英文标题映射表
  const pageTitles: {[key: string]: string} = {
    "leads": "Sales Leads",
    "prospects": "Potential Customers",
    "targets": "Clients",
    "plans": "Project Planning",
    "goals": "Business Goals",
    "projects": "Project Management",
    "reports": "Sales Reports",
    "database": "Database Management",
    "customers": "Customer Information"
  };

  const navItems = [
    { id: "leads", label: "商机线索", icon: UserPlus, color: "text-brand-blue" },
    { id: "prospects", label: "潜在客户", icon: Users, color: "text-brand-indigo" },
    { id: "targets", label: "客户", icon: UserCheck, color: "text-brand-purple" },
    { id: "plans", label: "计划", icon: Calendar, color: "text-brand-pink" },
    { id: "goals", label: "目标", icon: Target, color: "text-brand-teal" },
    { id: "projects", label: "事务", icon: Briefcase, color: "text-brand-green" },
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
  const handleExportPDF = (fileName: string, type: 'current' | 'all') => {
    // 定义PPT规格的宽高参数
    const pptWidth = 1280; // 16:9 PPT宽度
    const pptHeight = 720; // 16:9 PPT高度
    
    // 显示导出进度提示
    const exportType = type === 'current' ? '当前页面' : '所有页面';
    const pageSize = 'PPT格式(16:9)';
    
    console.log(`正在导出${exportType}为PDF，页面尺寸为${pageSize}。`);
    
    // html2canvas通用配置
    const canvasOptions = {
      scale: 1.5, // 保持原有分辨率
      logging: false,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      imageTimeout: 0, // 禁用超时
      scrollY: -window.scrollY, // 修复垂直滚动导致的偏移
    };
    
    // 处理DOM克隆的通用函数
    const handleClonedDOM = (document: Document) => {
      // 在克隆的DOM中删除不必要的大图像和背景
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (img.width > 500 || img.height > 500) {
          img.style.display = 'none'; // 隐藏大图像
        }
      });
      
      // 移除复杂的背景和阴影
      const elements = document.querySelectorAll('[style*="box-shadow"], [style*="background-image"]');
      elements.forEach(el => {
        (el as HTMLElement).style.boxShadow = 'none';
        (el as HTMLElement).style.backgroundImage = 'none';
      });
      
      // 修复文字垂直位置
      const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, td, th, li, a, button');
      textElements.forEach(el => {
        if (el && (el as HTMLElement).style) {
          (el as HTMLElement).style.transform = 'translateY(-2px)'; // 略微上移文字
          (el as HTMLElement).style.lineHeight = 'normal'; // 重置行高
        }
      });
      
      // 确保容器垂直居中
      const containers = document.querySelectorAll('.flex, .grid, .block, .inline-block');
      containers.forEach(container => {
        if (container && (container as HTMLElement).style) {
          const computedStyle = window.getComputedStyle(container as HTMLElement);
          if (computedStyle.display.includes('flex') && computedStyle.alignItems === 'flex-end') {
            (container as HTMLElement).style.alignItems = 'center'; // 修改底部对齐为居中对齐
          }
        }
      });
    };
    
    // 创建PDF并添加页眉页脚的函数
    const createPDFWithLayout = (pdf: any, imgData: string, imgWidth: number, imgHeight: number, pageTitle?: string, pageNumber?: string) => {
      // 计算适合PPT页面的缩放比例，保留边距
      const maxWidthRatio = (pptWidth - 100) / imgWidth; // 左右各留50px边距
      const maxHeightRatio = (pptHeight - 120) / imgHeight; // 上下各留60px边距
      const ratio = Math.min(maxWidthRatio, maxHeightRatio);
      const newWidth = imgWidth * ratio;
      const newHeight = imgHeight * ratio;
      
      // 计算居中位置，调整垂直位置稍微上移
      const x = (pptWidth - newWidth) / 2;
      const y = (pptHeight - newHeight) / 2 - 10; // 整体上移10像素
      
      // 统一的背景样式 - 简化背景
      pdf.setFillColor(245, 245, 245); // 使用更浅的背景色减少墨水使用
      pdf.rect(0, 0, pptWidth, pptHeight, 'F');
      
      // 添加页眉 - 简化设计
      pdf.setFillColor(230, 230, 230);
      pdf.rect(0, 0, pptWidth, 40, 'F');
      
      // 添加页眉文字
      pdf.setTextColor(80, 80, 80);
      pdf.setFontSize(16);
      pdf.text("Sales Management System", 50, 25, { baseline: 'middle' });
      pdf.setFontSize(12);
      pdf.text(new Date().toISOString().slice(0, 10), pptWidth - 50, 25, { align: 'right', baseline: 'middle' });
      
      // 简化内容区域，仅保留白色背景
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(x-5, y-5, newWidth+10, newHeight+10, 3, 3, 'F');
      
      // 添加内容
      pdf.addImage(imgData, 'JPEG', x, y, newWidth, newHeight); // 使用JPEG格式
      
      // 添加简化的页脚
      pdf.setDrawColor(200, 200, 200);
      pdf.line(50, pptHeight - 30, pptWidth - 50, pptHeight - 30);
      
      // 页脚文字
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(12);
      
      if (pageTitle) {
        pdf.text(pageTitle, pptWidth / 2, pptHeight - 20, { align: 'center', baseline: 'middle' });
      }
      
      if (pageNumber) {
        pdf.text(pageNumber, pptWidth - 50, pptHeight - 20, { align: 'right', baseline: 'middle' });
      }
      
      return { x, y, newWidth, newHeight };
    };
    
    if (type === 'current') {
      // 导出当前页面
      exportCurrentPage(fileName);
    } else if (type === 'all') {
      // 导出所有页面
      exportAllPages(fileName);
    }
    
    // 导出当前页面的函数
    async function exportCurrentPage(fileName: string) {
      try {
        // 查找页面内容元素
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

        // 创建PDF
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [pptWidth, pptHeight],
          compress: true // 启用PDF压缩
        });

        // 设置为内置的字体
        pdf.setFont('helvetica');
        
        // 转换为图像
        const canvas = await html2canvas(activePageContent as HTMLElement, { 
          ...canvasOptions,
          onclone: handleClonedDOM
        });
        
        // 将画布转换为图像
        const imgData = canvas.toDataURL('image/jpeg', 0.7); // 使用JPEG格式，质量降为0.7
        
        // 添加到PDF
        const pageName = pageTitles[activePage] || activePage;
        createPDFWithLayout(pdf, imgData, canvas.width, canvas.height, pageName, "Page 1");
        
        // 保存PDF
        pdf.save(`${fileName}.pdf`);
      } catch (err) {
        console.error('导出PDF时发生错误:', err);
        alert('导出PDF失败，请查看控制台获取详细错误信息。');
      }
    }
    
    // 导出所有页面的函数
    async function exportAllPages(fileName: string) {
      // 过滤掉不需要导出的页面: database和customers
      let allPages = navItems
        .filter(item => item.id !== "database")
        .map(item => item.id);
        
      // 添加封面页作为第一页
      allPages.unshift("cover");
      
      // 创建PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [pptWidth, pptHeight],
        compress: true // 启用PDF压缩
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
      
      try {
        // 递归处理每个页面
        await processAllPages(pdf, allPages, loadingDiv);
        
        // 所有页面处理完毕
        document.body.removeChild(loadingDiv);
        pdf.save(`${fileName}.pdf`);
      } catch (error) {
        console.error('导出多页PDF时发生错误:', error);
        document.body.removeChild(loadingDiv);
        alert('导出PDF失败，请查看控制台获取详细错误信息。');
      } finally {
        // 确保恢复到原始页面
        setTimeout(() => {
          setActivePage(originalPage);
        }, 500);
      }
    }
    
    // 处理所有页面的递归函数
    async function processAllPages(pdf: any, allPages: string[], loadingDiv: HTMLElement, index = 0) {
      if (index >= allPages.length) {
        return; // 所有页面处理完毕
      }
      
      // 更新加载提示
      loadingDiv.textContent = `正在导出页面 ${index + 1}/${allPages.length}`;
      
      // 处理封面页
      if (allPages[index] === "cover") {
        await processCoverPage(pdf);
        // 处理下一页
        return processAllPages(pdf, allPages, loadingDiv, index + 1);
      }
      
      // 设置当前页面
      setActivePage(allPages[index]);
      
      // 等待页面渲染完成
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 查找页面内容
      const mainContainer = document.querySelector('.flex-1.h-screen.overflow-hidden');
      if (!mainContainer || !mainContainer.firstChild) {
        console.error(`找不到页面 ${allPages[index]} 的内容`);
        return processAllPages(pdf, allPages, loadingDiv, index + 1);
      }
      
      try {
        // 添加新页面(除了第一页)
        if (index > 0) {
          pdf.addPage([pptWidth, pptHeight], 'landscape');
        }
        
        // 转换页面为图像
        const canvas = await html2canvas(mainContainer.firstChild as HTMLElement, {
          ...canvasOptions,
          onclone: handleClonedDOM
        });
        
        // 添加图像到PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.7); // 使用JPEG格式，质量降为0.7
        
        // 添加到PDF，带布局
        const pageName = pageTitles[allPages[index]] || allPages[index];
        createPDFWithLayout(pdf, imgData, canvas.width, canvas.height, pageName, `Page ${index + 1} of ${allPages.length}`);
        
        // 处理下一个页面
        return processAllPages(pdf, allPages, loadingDiv, index + 1);
      } catch (err) {
        console.error(`导出页面 ${allPages[index]} 时发生错误:`, err);
        return processAllPages(pdf, allPages, loadingDiv, index + 1);
      }
    }
    
    // 处理封面页的函数
    async function processCoverPage(pdf: any) {
      // 渲染export-cover组件
      const coverDiv = document.createElement('div');
      coverDiv.style.display = 'flex';
      coverDiv.style.justifyContent = 'center';
      coverDiv.style.alignItems = 'center';
      coverDiv.style.width = '100%';
      coverDiv.style.height = '100%';
      coverDiv.style.position = 'fixed';
      coverDiv.style.top = '0';
      coverDiv.style.left = '0';
      coverDiv.style.background = '#ffffff';
      coverDiv.style.zIndex = '-1'; // 设置为-1，使其在背景层
      coverDiv.style.visibility = 'hidden'; // 初始隐藏，避免在页面上可见
      document.body.appendChild(coverDiv);
      
      try {
        // 动态导入需要的组件
        const { ExportCover } = await import('@/components/export-cover');
        const { createRoot } = await import('react-dom/client');
        const { getWeekNumber } = await import('@/lib/date-utils');
        
        const weekNumber = getWeekNumber(new Date());
        const year = new Date().getFullYear();
        const { formatWeekDisplay } = await import('@/lib/db-service');
        const weekDisplay = formatWeekDisplay(year, weekNumber);
        
        // 渲染封面组件
        const root = createRoot(coverDiv);
        root.render(<ExportCover />);
        
        // 等待渲染完成
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // 转换封面为图像前，临时设置为可见
        coverDiv.style.visibility = 'visible';
        
        // 转换封面为图像
        const canvas = await html2canvas(coverDiv, {
          scale: 1.5,
          logging: false,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });
        
        // 处理完成后立即隐藏并移除
        coverDiv.style.visibility = 'hidden';
        document.body.removeChild(coverDiv);
        
        // 添加封面图片，保持比例并确保精确居中
        const imgData = canvas.toDataURL('image/jpeg', 0.7);
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        
        // 计算适合PPT页面的缩放比例，保持封面比例
        const maxWidthRatio = pptWidth / imgWidth;
        const maxHeightRatio = pptHeight / imgHeight;
        const ratio = Math.min(maxWidthRatio, maxHeightRatio);
        const newWidth = imgWidth * ratio;
        const newHeight = imgHeight * ratio;
        
        // 计算居中位置
        const x = Math.floor((pptWidth - newWidth) / 2);
        const y = Math.floor((pptHeight - newHeight) / 2);
        
        // 添加封面图片，保持比例并确保精确居中
        pdf.addImage(imgData, 'JPEG', x, y, newWidth, newHeight);
      } catch (error) {
        console.error('封面页处理错误:', error);
        // 确保清理DOM元素
        if (document.body.contains(coverDiv)) {
          document.body.removeChild(coverDiv);
        }
      }
    }
  };

  // 显示用户设置对话框
  const showUserSettings = () => {
    console.log("打开用户设置对话框");
    setUserDialogOpen(true);
  };

  return (
    <>
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
              <div 
                className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-brand-purple to-brand-pink cursor-pointer hover:opacity-80 transition-opacity"
                onClick={showUserSettings}
                title="点击设置个人信息"
              >
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white"
                >
                  <path 
                    d="M12 2L3 7L12 12L21 7L12 2Z" 
                    fill="currentColor"
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M3 12L12 17L21 12" 
                    fill="none"
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M3 17L12 22L21 17" 
                    fill="none"
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-purple">销售管理系统</p>
                <p className="text-xs text-muted-foreground">SuperSales</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto group flex items-center justify-center h-7 w-7 rounded-full hover:bg-brand-purple/5 p-0"
            style={{ color: '#db2777' }}
          >
            {collapsed ? (
              <ChevronRight 
                className="h-4 w-4" 
                style={{ color: 'inherit' }}
              />
            ) : (
              <ChevronLeft 
                className="h-4 w-4" 
                style={{ color: 'inherit' }}
              />
            )}
          </button>
        </div>
        <div className="flex-1 overflow-auto py-3 px-2">
          <nav className="grid gap-1.5">
            {navItems.map((item) => (
              <Button
                key={item.id}
                className={cn(
                  "justify-start rounded-lg transition-all duration-200 relative overflow-hidden",
                  "bg-transparent hover:bg-brand-purple/5",
                  activePage === item.id 
                    ? "bg-brand-purple/10 text-brand-purple font-medium shadow-sm" 
                    : "text-muted-foreground hover:text-brand-purple",
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
            className={cn(
              "w-full justify-start rounded-lg transition-all duration-200 relative overflow-hidden",
              "bg-transparent hover:bg-brand-purple/5",
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
                className={cn(
                  "w-full justify-start rounded-lg transition-all duration-200",
                  "bg-transparent",
                  "text-muted-foreground hover:bg-brand-purple/5 hover:text-brand-purple !hover:bg-brand-purple/5 !hover:text-brand-purple",
                  collapsed ? "h-10 px-2" : "h-9 px-3",
                )}
              >
                <FileOutput className="h-4 w-4 text-brand-pink" />
                {!collapsed && <span className="ml-2 text-sm">导出PDF</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-52 rounded-lg shadow-md">
              <DropdownMenuItem onClick={() => handleExportPDF(`销售报告_${new Date().toISOString().slice(0, 10)}`, 'current')} className="cursor-pointer hover:bg-brand-purple/5 rounded-md my-0.5 focus:bg-brand-purple/10">
                <Download className="h-4 w-4 mr-2 text-brand-purple" />
                <span>导出当前页面(PPT格式)</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExportPDF(`销售报告_${new Date().toISOString().slice(0, 10)}`, 'all')} className="cursor-pointer hover:bg-brand-purple/5 rounded-md my-0.5 focus:bg-brand-purple/10">
                <Download className="h-4 w-4 mr-2 text-brand-indigo" />
                <span>导出全部页面(PPT格式)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
      
      {/* 将UserSettingsDialog组件放在最外层 */}
      <UserSettingsDialog 
        open={userDialogOpen} 
        onOpenChange={setUserDialogOpen} 
        onSettingsChange={(settings) => {
          console.log('设置已更新:', settings);
        }} 
      />
    </>
  )
}

