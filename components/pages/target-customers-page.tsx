"use client"

import { useState, useEffect } from "react"
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
// 在 import 部分添加更多图标
import { Plus, Search, Trash2, Pencil } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { getAll, add, remove, put, convertToCustomer } from "@/lib/db-service"
import { getWeekNumber } from "@/lib/date-utils"

interface Target {
  id?: string | number;
  name: string;
  need: string;
  stage: string;
  advantage: string;
  disadvantage: string;
  possibility: string;
  amount: number;
  date: Date;
}

export function TargetCustomersPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [filteredTargets, setFilteredTargets] = useState<Target[]>([]);
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<"weekly" | "monthly" | "quarterly" | "yearly">("weekly");
  // 添加选中的客户状态，用于编辑
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  // 添加对话框显示状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTarget, setNewTarget] = useState({
    name: "",
    need: "",
    stage: "商务谈判",
    advantage: "",
    disadvantage: "",
    possibility: "高",
    amount: 0, // 添加金额字段
    date: new Date(),
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 从数据库获取目标客户数据
        const { getAll } = await import("@/lib/db-service")
        const targetsData = await getAll("targets")
        setTargets(targetsData)
        filterTargetsByPeriod(targetsData, period)
      } catch (error) {
        console.error("Error fetching targets data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    filterTargetsByPeriod(targets, period)
  }, [period, targets])

  // 根据时间段筛选客户
  const filterTargetsByPeriod = (targets: Target[], period: string) => {
    const now = new Date()
    const currentWeek = getWeekNumber(now)
    const currentMonth = now.getMonth()
    const currentQuarter = Math.floor(currentMonth / 3)
    const currentYear = now.getFullYear()

    const filtered = targets.filter((target) => {
      if (!target.date) return false
      const targetDate = new Date(target.date)
      const targetWeek = getWeekNumber(targetDate)
      const targetMonth = targetDate.getMonth()
      const targetQuarter = Math.floor(targetMonth / 3)
      const targetYear = targetDate.getFullYear()

      switch (period) {
        case "weekly":
          return targetWeek === currentWeek && targetYear === currentYear
        case "monthly":
          return targetMonth === currentMonth && targetYear === currentYear
        case "quarterly":
          return targetQuarter === currentQuarter && targetYear === currentYear
        case "yearly":
          return targetYear === currentYear
        default:
          return true
      }
    })

    setFilteredTargets(filtered)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    const searchFiltered = filteredTargets.filter(
      (target) =>
        target.name.toLowerCase().includes(e.target.value.toLowerCase()) ||
        target.need.toLowerCase().includes(e.target.value.toLowerCase()),
    )
    setFilteredTargets(searchFiltered.length > 0 || e.target.value ? searchFiltered : targets)
  }

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (selectedTarget) {
      setSelectedTarget(prev => ({ ...prev!, [name]: value }))
    } else {
      setNewTarget((prev) => ({ ...prev, [name]: value }))
    }
  }

  // 处理下拉选择变化
  const handleSelectChange = (name: string, value: string) => {
    if (selectedTarget) {
      setSelectedTarget(prev => ({ ...prev!, [name]: value }))
    } else {
      setNewTarget((prev) => ({ ...prev, [name]: value }))
    }
  }

  // 打开编辑对话框
  const handleEditTarget = (target: Target) => {
    setSelectedTarget(target);
    setDialogOpen(true);
  };

  // 提交表单（添加或更新）
  const handleSubmit = async () => {
    try {
      if (selectedTarget) {
        // 更新现有客户
        await put("targets", selectedTarget);
        setTargets(prev => prev.map(item => item.id === selectedTarget.id ? selectedTarget : item));
        
        // 如果目标客户可能性为高，自动转换为客户
        if (selectedTarget.possibility === "高" && selectedTarget.id) {
          try {
            const result = await convertToCustomer("targets", typeof selectedTarget.id === 'string' 
              ? parseInt(selectedTarget.id) 
              : selectedTarget.id);
            if (result.success) {
              alert(`目标客户已自动转换为正式客户: ${result.message}`);
            }
          } catch (convError) {
            console.error("转换客户时出错:", convError);
          }
        }
        
        setSelectedTarget(null);
      } else {
        // 添加新客户
        const id = await add("targets", newTarget)

        // 更新状态
        setTargets([...targets, { ...newTarget, id: id as string | number }])

        // 重置表单
        setNewTarget({
          name: "",
          need: "",
          stage: "商务谈判",
          advantage: "",
          disadvantage: "",
          possibility: "高",
          amount: 0, // 重置金额
          date: new Date(),
        })
      }
      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving target:", error)
    }
  }

  // 关闭对话框并重置状态
  const handleCloseDialog = () => {
    setSelectedTarget(null);
    setDialogOpen(false);
  };

  // 添加删除功能
  const handleDeleteTarget = async (id: string | number) => {
    try {
      if (window.confirm("确定要删除此客户吗？此操作不可恢复。")) {
        // 从数据库删除
        const { remove } = await import("@/lib/db-service")
        // 确保 id 为数字类型
        await remove("targets", typeof id === 'string' ? parseInt(id) : id)

        // 更新状态
        setTargets(targets.filter((target) => target.id !== id))
      }
    } catch (error) {
      console.error("Error deleting target:", error)
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

  // 格式化金额
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
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
       Customers
        </h1>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="搜索客户..."
              className="pl-8 w-[200px] rounded-lg border-gray-200 focus:border-primary"
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
              <Button size="sm" className="text-xs h-8 flex gap-1 px-2" onClick={() => setSelectedTarget(null)}>
                <Plus className="h-3.5 w-3.5" />
                添加客户
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-lg">{selectedTarget ? "编辑客户" : "添加客户"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    客户名称
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={selectedTarget ? selectedTarget.name : newTarget.name}
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
                    value={selectedTarget ? selectedTarget.need : newTarget.need}
                    onChange={handleInputChange}
                    className="col-span-3 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stage" className="text-right">
                    项目阶段
                  </Label>
                  <Select value={selectedTarget ? selectedTarget.stage : newTarget.stage} onValueChange={(value) => handleSelectChange("stage", value)}>
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
                    value={selectedTarget ? selectedTarget.advantage : newTarget.advantage}
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
                    value={selectedTarget ? selectedTarget.disadvantage : newTarget.disadvantage}
                    onChange={handleInputChange}
                    className="col-span-3 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="possibility" className="text-right">
                    可能性
                  </Label>
                  <Select value={selectedTarget ? selectedTarget.possibility : newTarget.possibility} onValueChange={(value) => handleSelectChange("possibility", value)}>
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
                    value={selectedTarget ? String(selectedTarget.amount || 0) : String(newTarget.amount || 0)}
                    onChange={handleInputChange}
                    className="col-span-3 rounded-lg"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" onClick={handleCloseDialog}>取消</Button>
                </DialogClose>
                <Button type="submit" onClick={handleSubmit}>
                  {selectedTarget ? "更新" : "添加"}
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
            {filteredTargets.length > 0 ? (
              filteredTargets.filter(target => 
                target.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                target.need.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((target, index) => (
                <TableRow
                  key={target.id}
                  className={cn(
                    "group",
                    index % 2 === 0 ? "bg-white" : "bg-gray-50",
                    "hover:bg-muted/20 dark:hover:bg-muted/20 dark:bg-gray-800 dark:even:bg-gray-900",
                  )}
                >
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">{target.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{target.need}</TableCell>
                  <TableCell>
                    <Badge className={getStageColor(target.stage)}>
                      {target.stage}
                    </Badge>
                  </TableCell>
                  <TableCell>{target.advantage}</TableCell>
                  <TableCell>{target.disadvantage}</TableCell>
                  <TableCell>
                    <Badge className={getPossibilityColor(target.possibility)}>
                      {target.possibility}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-right">{formatAmount(target.amount || 0)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditTarget(target)}
                        className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity mr-1"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">编辑</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => target.id && handleDeleteTarget(target.id)}
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
