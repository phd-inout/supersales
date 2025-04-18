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
import { Plus, Search, Filter, ArrowUpDown, MoreHorizontal } from "lucide-react"
import { motion } from "framer-motion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getAll, add, remove, initSampleData } from "@/lib/db-service"

export function LeadsPage() {
  const [leads, setLeads] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [newLead, setNewLead] = useState({
    name: "",
    need: "",
    stage: "初步接触",
    advantage: "",
    disadvantage: "",
    possibility: "中",
    date: new Date(),
    quarter: getQuarter(new Date()),
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 初始化示例数据
        await initSampleData()

        // 获取线索数据
        const leadsData = await getAll("leads")
        setLeads(leadsData)
      } catch (error) {
        console.error("Error fetching leads data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  function getQuarter(date) {
    const month = date.getMonth()
    if (month < 3) return "Q1"
    if (month < 6) return "Q2"
    if (month < 9) return "Q3"
    return "Q4"
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.need.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewLead((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setNewLead((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddLead = async () => {
    try {
      // 添加到数据库
      await add("leads", newLead)

      // 重新获取数据
      const leadsData = await getAll("leads")
      setLeads(leadsData)

      // 重置表单
      setNewLead({
        name: "",
        need: "",
        stage: "初步接触",
        advantage: "",
        disadvantage: "",
        possibility: "中",
        date: new Date(),
        quarter: getQuarter(new Date()),
      })
    } catch (error) {
      console.error("Error adding lead:", error)
    }
  }

  const handleDeleteLead = async (id) => {
    try {
      // 从数据库删除
      await remove("leads", id)

      // 更新状态
      setLeads(leads.filter((lead) => lead.id !== id))
    } catch (error) {
      console.error("Error deleting lead:", error)
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
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-brand-blue to-brand-indigo bg-clip-text text-transparent">
          商机线索
        </h1>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="搜索线索..."
              className="pl-8 w-[250px] rounded-lg border-gray-200 focus:border-primary"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <Button variant="outline" size="icon" className="rounded-lg">
            <Filter className="h-4 w-4" />
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="rounded-lg bg-gradient-to-r from-brand-blue to-brand-indigo hover:from-brand-blue/90 hover:to-brand-indigo/90 transition-all duration-300">
                <Plus className="mr-2 h-4 w-4" />
                添加线索
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-xl">添加新线索</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    客户名称
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={newLead.name}
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
                    value={newLead.need}
                    onChange={handleInputChange}
                    className="col-span-3 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stage" className="text-right">
                    项目阶段
                  </Label>
                  <Select value={newLead.stage} onValueChange={(value) => handleSelectChange("stage", value)}>
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
                    value={newLead.advantage}
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
                    value={newLead.disadvantage}
                    onChange={handleInputChange}
                    className="col-span-3 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="possibility" className="text-right">
                    可能性
                  </Label>
                  <Select
                    value={newLead.possibility}
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
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" className="rounded-lg">
                    取消
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    onClick={handleAddLead}
                    className="rounded-lg bg-gradient-to-r from-brand-blue to-brand-indigo"
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
              <TableHead className="w-[80px]">序号</TableHead>
              <TableHead>
                <div className="flex items-center space-x-1">
                  <span>客户名称</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>客户需求</TableHead>
              <TableHead>项目阶段</TableHead>
              <TableHead>优势</TableHead>
              <TableHead>劣势</TableHead>
              <TableHead>可能性</TableHead>
              <TableHead className="w-[80px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => (
              <TableRow key={lead.id} className="hover:bg-muted/20">
                <TableCell className="font-medium">{lead.id}</TableCell>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell className="max-w-[200px] truncate">{lead.need}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`${getStageColor(lead.stage)}`}>
                    {lead.stage}
                  </Badge>
                </TableCell>
                <TableCell>{lead.advantage}</TableCell>
                <TableCell>{lead.disadvantage}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`${getPossibilityColor(lead.possibility)}`}>
                    {lead.possibility}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>操作</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>编辑</DropdownMenuItem>
                      <DropdownMenuItem>详情</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteLead(lead.id)}>
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  )
}
