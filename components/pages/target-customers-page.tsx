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

export function TargetCustomersPage() {
  const [targets, setTargets] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
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
      } catch (error) {
        console.error("Error fetching targets data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const filteredTargets = targets.filter(
    (target) =>
      target.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      target.need.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewTarget((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberInputChange = (e) => {
    const { name, value } = e.target
    const numValue = Number.parseFloat(value) || 0
    setNewTarget((prev) => ({ ...prev, [name]: numValue }))
  }

  const handleSelectChange = (name, value) => {
    setNewTarget((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddTarget = async () => {
    try {
      // 添加到数据库
      const { add } = await import("@/lib/db-service")
      const id = await add("targets", newTarget)

      // 更新状态
      setTargets([...targets, { id, ...newTarget }])

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
  const handleDeleteTarget = async (id) => {
    try {
      if (window.confirm("确定要删除此目标客户吗？此操作不可恢复。")) {
        // 从数据库删除
        const { remove } = await import("@/lib/db-service")
        await remove("targets", id)

        // 更新状态
        setTargets(targets.filter((target) => target.id !== id))
      }
    } catch (error) {
      console.error("Error deleting target:", error)
    }
  }

  const getStageColor = (stage) => {
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

  const getPossibilityColor = (possibility) => {
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
  const formatAmount = (amount) => {
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
          Target Customers
        </h1>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="搜索目标客户..."
              className="pl-8 w-[250px] rounded-lg border-gray-200 focus:border-primary"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="rounded-lg bg-gradient-to-r from-brand-purple to-brand-pink hover:from-brand-purple/90 hover:to-brand-pink/90 transition-all duration-300">
                <Plus className="mr-2 h-4 w-4" />
                添加目标客户
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-lg">添加目标客户</DialogTitle>
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
              <TableHead className="py-3">客户名称</TableHead>
              <TableHead className="py-3">客户需求</TableHead>
              <TableHead className="py-3">项目阶段</TableHead>
              <TableHead className="py-3">优势</TableHead>
              <TableHead className="py-3">劣势</TableHead>
              <TableHead className="py-3">可能性</TableHead>
              <TableHead className="py-3">金额</TableHead>
              <TableHead className="w-[80px] py-3 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTargets.map((target, index) => (
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
                  <Badge variant="outline" className={getStageColor(target.stage)}>
                    {target.stage}
                  </Badge>
                </TableCell>
                <TableCell>{target.advantage}</TableCell>
                <TableCell>{target.disadvantage}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getPossibilityColor(target.possibility)}>
                    {target.possibility}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium text-right">{formatAmount(target.amount || 0)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteTarget(target.id)}
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
