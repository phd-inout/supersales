"use client"

import { useState, useEffect, ChangeEvent } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Filter, ArrowUpDown, Trash2, Pencil } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { FormEvent } from "react"
import { buttonVariants } from "@/components/ui/button"
import { badgeVariants } from "@/components/ui/badge"
import { getAll, add, remove, put, convertToCustomer } from "@/lib/db-service"
import { getWeekNumber, getQuarter } from "@/lib/date-utils"

// 定义Prospect接口
interface Prospect {
  id?: string | number;
  name: string;
  need: string;
  stage: string;
  advantage: string;
  disadvantage: string;
  possibility: string;
  date: Date;
  amount: number | null;
}

export function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [filteredProspects, setFilteredProspects] = useState<Prospect[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<"weekly" | "monthly" | "quarterly" | "yearly">("weekly");
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProspect, setNewProspect] = useState<Omit<Prospect, 'id'>>({
    name: "",
    need: "",
    stage: "初步接触",
    advantage: "",
    disadvantage: "",
    possibility: "中",
    date: new Date(),
    amount: null,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 从数据库获取潜在客户数据
        const { getAll } = await import("@/lib/db-service")
        const prospectsData = await getAll("prospects")
        setProspects(prospectsData as Prospect[])
        filterProspectsByPeriod(prospectsData as Prospect[], period)
      } catch (error) {
        console.error("Error fetching prospects data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    filterProspectsByPeriod(prospects, period)
  }, [period, prospects])

  const filterProspectsByPeriod = (data: Prospect[], period: string) => {
    const now = new Date()
    const filtered = data.filter(prospect => {
      const prospectDate = new Date(prospect.date)
      switch (period) {
        case "weekly":
          return getWeekNumber(prospectDate) === getWeekNumber(now) && 
                 prospectDate.getFullYear() === now.getFullYear()
        case "monthly":
          return prospectDate.getMonth() === now.getMonth() && 
                 prospectDate.getFullYear() === now.getFullYear()
        case "quarterly":
          return getQuarter(prospectDate) === getQuarter(now) && 
                 prospectDate.getFullYear() === now.getFullYear()
        case "yearly":
          return prospectDate.getFullYear() === now.getFullYear()
        default:
          return true
      }
    })
    
    // 应用搜索过滤
    const searchFiltered = filtered.filter(
      (prospect) =>
        prospect.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prospect.need.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    setFilteredProspects(searchFiltered)
  }

  // 辅助函数：获取周数
  const getWeekNumber = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), 0, 1)
    const pastDays = (date.getTime() - firstDay.getTime()) / 86400000
    return Math.ceil((pastDays + firstDay.getDay() + 1) / 7)
  }

  // 辅助函数：获取季度
  const getQuarter = (date: Date) => {
    return Math.floor(date.getMonth() / 3) + 1
  }

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    // 当搜索条件改变时重新过滤数据
    filterProspectsByPeriod(prospects, period)
  }

  // 格式化金额
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // 特殊处理金额字段
    if (name === "amount") {
      // 允许空值或数字输入
      const newValue = value === "" ? null : Number(value);
      
      if (selectedProspect) {
        setSelectedProspect(prev => ({ ...prev!, [name]: newValue }));
      } else {
        setNewProspect(prev => ({ ...prev, [name]: newValue }));
      }
      return;
    }
    
    // 常规字段处理
    if (selectedProspect) {
      setSelectedProspect(prev => ({ ...prev!, [name]: value }));
    } else {
      setNewProspect(prev => ({ ...prev, [name]: value }));
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    if (selectedProspect) {
      setSelectedProspect(prev => ({ ...prev!, [name]: value }))
    } else {
      setNewProspect((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleEditProspect = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (selectedProspect) {
        // 更新现有潜在客户
        const { put } = await import("@/lib/db-service")
        await put("prospects", selectedProspect);
        setProspects(prev => prev.map(item => item.id === selectedProspect.id ? selectedProspect : item));
        
        // 如果潜在客户进入商务谈判阶段且可能性为高，自动转换为客户
        if (selectedProspect.stage === "商务谈判" && selectedProspect.possibility === "高" && selectedProspect.id) {
          try {
            const { convertToCustomer } = await import("@/lib/db-service")
            const result = await convertToCustomer("prospects", typeof selectedProspect.id === 'string' 
              ? parseInt(selectedProspect.id) 
              : selectedProspect.id);
            if (result.success) {
              alert(`潜在客户已自动转换为客户: ${result.message}`);
            }
          } catch (convError) {
            console.error("转换客户时出错:", convError);
          }
        }
        
        setSelectedProspect(null);
      } else {
        // 添加新潜在客户
        const { add } = await import("@/lib/db-service")
        const id = await add("prospects", {
          ...newProspect,
          // 确保null金额保存为0
          amount: newProspect.amount === null ? 0 : newProspect.amount
        })

        // 更新状态
        setProspects([...prospects, { ...newProspect, id: id as string | number }])

        // 重置表单
        setNewProspect({
          name: "",
          need: "",
          stage: "初步接触",
          advantage: "",
          disadvantage: "",
          possibility: "中",
          date: new Date(),
          amount: null,
        })
      }
      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving prospect:", error)
    }
  }

  const handleCloseDialog = () => {
    setSelectedProspect(null);
    setDialogOpen(false);
  };

  // 添加删除功能
  const handleDeleteProspect = async (id: string | number) => {
    try {
      if (window.confirm("确定要删除此潜在客户吗？此操作不可恢复。")) {
        // 从数据库删除
        const { remove } = await import("@/lib/db-service")
        await remove("prospects", typeof id === 'string' ? parseInt(id) : id)

        // 更新状态
        setProspects(prospects.filter((prospect) => prospect.id !== id))
      }
    } catch (error) {
      console.error("Error deleting prospect:", error)
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "初步接触":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "需求调研":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300"
      case "方案设计":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "商务谈判":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getPossibilityColor = (possibility: string) => {
    switch (possibility) {
      case "高":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "中":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "低":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-brand-purple to-brand-pink bg-clip-text text-transparent">
          Potential Customers
        </h1>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search prospects..."
              className="pl-8 w-[250px] rounded-lg border-gray-200 focus:border-primary"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <Select value={period} onValueChange={(value) => setPeriod(value as any)}>
            <SelectTrigger className="w-[120px] rounded-lg">
              <SelectValue placeholder="显示周期" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">本周</SelectItem>
              <SelectItem value="monthly">本月</SelectItem>
              <SelectItem value="quarterly">本季度</SelectItem>
              <SelectItem value="yearly">本年</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-lg bg-gradient-to-r from-brand-indigo to-brand-purple hover:from-brand-indigo/90 hover:to-brand-purple/90 transition-all duration-300" onClick={() => setSelectedProspect(null)}>
                <Plus className="mr-2 h-4 w-4" />
                添加潜在客户
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-lg">{selectedProspect ? "编辑潜在客户" : "添加潜在客户"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    客户名称
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={selectedProspect ? selectedProspect.name : newProspect.name}
                    onChange={handleInputChange}
                    className="col-span-3 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="need" className="text-right">
                    客户需求
                  </Label>
                  <Textarea
                    id="need"
                    name="need"
                    value={selectedProspect ? selectedProspect.need : newProspect.need}
                    onChange={handleInputChange}
                    className="col-span-3 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stage" className="text-right">
                    项目阶段
                  </Label>
                  <Select value={selectedProspect ? selectedProspect.stage : newProspect.stage} onValueChange={(value) => handleSelectChange("stage", value)}>
                    <SelectTrigger className="col-span-3 rounded-lg">
                      <SelectValue placeholder="选择项目阶段" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="初步接触">初步接触</SelectItem>
                      <SelectItem value="需求调研">需求调研</SelectItem>
                      <SelectItem value="方案设计">方案设计</SelectItem>
                      <SelectItem value="商务谈判">商务谈判</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="advantage" className="text-right">
                    优势
                  </Label>
                  <Input
                    id="advantage"
                    name="advantage"
                    value={selectedProspect ? selectedProspect.advantage : newProspect.advantage}
                    onChange={handleInputChange}
                    className="col-span-3 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="disadvantage" className="text-right">
                    劣势
                  </Label>
                  <Input
                    id="disadvantage"
                    name="disadvantage"
                    value={selectedProspect ? selectedProspect.disadvantage : newProspect.disadvantage}
                    onChange={handleInputChange}
                    className="col-span-3 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="possibility" className="text-right">
                    可能性
                  </Label>
                  <Select
                    value={selectedProspect ? selectedProspect.possibility : newProspect.possibility}
                    onValueChange={(value) => handleSelectChange("possibility", value)}
                  >
                    <SelectTrigger className="col-span-3 rounded-lg">
                      <SelectValue placeholder="选择可能性" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="高">高</SelectItem>
                      <SelectItem value="中">中</SelectItem>
                      <SelectItem value="低">低</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    金额 (元)
                  </Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    value={selectedProspect ? (selectedProspect.amount === null ? "" : String(selectedProspect.amount)) : (newProspect.amount === null ? "" : String(newProspect.amount))}
                    onChange={handleInputChange}
                    className="col-span-3 rounded-lg"
                    placeholder="可选，留空表示0元"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" onClick={handleCloseDialog}>取消</Button>
                </DialogClose>
                <Button type="submit" onClick={handleSubmit}>
                  {selectedProspect ? "更新" : "添加"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <motion.div
        className="border rounded-xl overflow-hidden shadow-sm bg-white dark:bg-gray-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/40">
              <TableHead className="w-[60px] py-3">序号</TableHead>
              <TableHead className="py-3 w-[140px]">客户名称</TableHead>
              <TableHead className="py-3 w-[160px]">客户需求</TableHead>
              <TableHead className="py-3 w-[100px]">项目阶段</TableHead>
              <TableHead className="py-3 w-[120px]">优势</TableHead>
              <TableHead className="py-3 w-[120px]">劣势</TableHead>
              <TableHead className="py-3 w-[80px]">可能性</TableHead>
              <TableHead className="py-3 text-right w-[100px]">金额</TableHead>
              <TableHead className="w-[100px] py-3 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProspects.length > 0 ? (
              filteredProspects.map((prospect, index) => (
                <TableRow key={prospect.id} className="group">
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">{prospect.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{prospect.need}</TableCell>
                  <TableCell>
                    <Badge className={getStageColor(prospect.stage)}>{prospect.stage}</Badge>
                  </TableCell>
                  <TableCell>{prospect.advantage}</TableCell>
                  <TableCell>{prospect.disadvantage}</TableCell>
                  <TableCell>
                    <Badge className={getPossibilityColor(prospect.possibility)}>
                      {prospect.possibility}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatAmount(prospect.amount || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditProspect(prospect)}
                        className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity mr-1"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">编辑</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteProspect(prospect.id!)}
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">删除</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  )
}
