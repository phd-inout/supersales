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
import { Plus, Search, Trash2 } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

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

  const filterTargetsByPeriod = (data: Target[], period: string) => {
    const now = new Date()
    const filtered = data.filter(target => {
      const targetDate = new Date(target.date)
      switch (period) {
        case "weekly":
          return getWeekNumber(targetDate) === getWeekNumber(now) && 
                 targetDate.getFullYear() === now.getFullYear()
        case "monthly":
          return targetDate.getMonth() === now.getMonth() && 
                 targetDate.getFullYear() === now.getFullYear()
        case "quarterly":
          return getQuarter(targetDate) === getQuarter(now) && 
                 targetDate.getFullYear() === now.getFullYear()
        case "yearly":
          return targetDate.getFullYear() === now.getFullYear()
        default:
          return true
      }
    })
    setFilteredTargets(filtered)
  }

  // 辅助函数
  const getWeekNumber = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), 0, 1)
    const pastDays = (date.getTime() - firstDay.getTime()) / 86400000
    return Math.ceil((pastDays + firstDay.getDay() + 1) / 7)
  }

  const getQuarter = (date: Date) => {
    return Math.floor(date.getMonth() / 3) + 1
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewTarget((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numValue = Number.parseFloat(value) || 0
    setNewTarget((prev) => ({ ...prev, [name]: numValue }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setNewTarget((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddTarget = async () => {
    try {
      // 添加到数据库
      const { add } = await import("@/lib/db-service")
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
    } catch (error) {
      console.error("Error adding target:", error)
    }
  }

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
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="text-xs h-8 flex gap-1 px-2">
                <Plus className="h-3.5 w-3.5" />
                添加客户
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-lg">添加客户</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    客户名称
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={newTarget.name}
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
                    value={newTarget.need}
                    onChange={handleInputChange}
                    className="col-span-3 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stage" className="text-right">
                    项目阶段
                  </Label>
                  <Select value={newTarget.stage} onValueChange={(value) => handleSelectChange("stage", value)}>
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
                    value={newTarget.advantage}
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
                    value={newTarget.disadvantage}
                    onChange={handleInputChange}
                    className="col-span-3 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="possibility" className="text-right">
                    可能性
                  </Label>
                  <Select
                    value={newTarget.possibility}
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
                {/* 添加金额输入框 */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    金额
                  </Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    value={newTarget.amount}
                    onChange={handleNumberInputChange}
                    className="col-span-3 rounded-lg"
                    placeholder="请输入金额"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" className="rounded-lg">
                    取消
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    onClick={handleAddTarget}
                    className="rounded-lg bg-gradient-to-r from-brand-purple to-brand-pink"
                  >
                    保存
                  </Button>
                </DialogClose>
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
              <TableHead className="w-[80px] py-3 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTargets.filter(target => 
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
                <TableCell className="font-medium">{target.id}</TableCell>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => target.id && handleDeleteTarget(target.id)}
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">删除</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  )
}
