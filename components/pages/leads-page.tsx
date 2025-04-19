"use client"

import { useState, useEffect, useMemo } from "react"
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
import { Plus, Search, Filter, ArrowUpDown, MoreHorizontal, Trash2, Pencil } from "lucide-react"
import { motion } from "framer-motion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getAll, add, remove, put, initSampleData, convertToCustomer } from "@/lib/db-service"

interface Lead {
  id?: string | number;
  name: string;
  need: string;
  stage: string;
  advantage: string;
  disadvantage: string;
  possibility: string;
  date: Date;
  quarter: string;
  amount: number;
}

export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"weekly" | "monthly" | "quarterly" | "yearly">("weekly");
  // 添加选中的商机状态，用于编辑
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  // 在newLead初始值中添加amount
  const [newLead, setNewLead] = useState<Omit<Lead, 'id'>>({
    name: "",
    need: "",
    stage: "初步接触",
    advantage: "",
    disadvantage: "",
    possibility: "中",
    date: new Date(),
    quarter: getQuarter(new Date()),
    amount: 0,
  });
  // 添加对话框显示状态
  const [dialogOpen, setDialogOpen] = useState(false);
  
 

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await initSampleData();
        const leadsData = await getAll("leads");
        setLeads(leadsData);
      } catch (error) {
        console.error("Error fetching leads data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getWeekNumber = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), 0, 1)
    const pastDays = (date.getTime() - firstDay.getTime()) / 86400000
    return Math.ceil((pastDays + firstDay.getDay() + 1) / 7)
  }

  function getQuarter(date: Date) {
    const month = date.getMonth()
    if (month < 3) return "Q1"
    if (month < 6) return "Q2"
    if (month < 9) return "Q3"
    return "Q4"
  }

  // 根据时间段筛选商机
  const filterLeadsByPeriod = (leads: Lead[], period: string) => {
    const now = new Date()
    const currentWeek = getWeekNumber(now)
    const currentMonth = now.getMonth()
    const currentQuarter = Math.floor(currentMonth / 3)
    const currentYear = now.getFullYear()

    return leads.filter((lead) => {
      if (!lead.date) return false
      const leadDate = new Date(lead.date)
      const leadWeek = getWeekNumber(leadDate)
      const leadMonth = leadDate.getMonth()
      const leadQuarter = Math.floor(leadMonth / 3)
      const leadYear = leadDate.getFullYear()

      switch (period) {
        case "weekly":
          return leadWeek === currentWeek && leadYear === currentYear
        case "monthly":
          return leadMonth === currentMonth && leadYear === currentYear
        case "quarterly":
          return leadQuarter === currentQuarter && leadYear === currentYear
        case "yearly":
          return leadYear === currentYear
        default:
          return true
      }
    })
  }

  const filteredLeads = useMemo(() => {
    return filterLeadsByPeriod(leads, period).filter(
      (lead) =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.need.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [leads, period, searchTerm])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (selectedLead) {
      setSelectedLead(prev => ({ ...prev!, [name]: value }))
    } else {
      setNewLead(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    if (selectedLead) {
      setSelectedLead(prev => ({ ...prev!, [name]: value }))
    } else {
      setNewLead(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleDeleteLead = async (id: string | number) => {
    try {
      if (window.confirm("确定要删除此线索吗？此操作不可恢复。")) {
        await remove("leads", typeof id === 'string' ? parseInt(id) : id);
        setLeads(prev => prev.filter(lead => lead.id !== id));
      }
    } catch (error) {
      console.error("Error deleting lead:", error);
    }
  };

  const getPossibilityColor = (possibility: "高" | "中" | "低"): string => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // 打开编辑对话框
  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setDialogOpen(true);
  };

  // 提交表单（添加或更新）
  const handleSubmit = async () => {
    try {
      if (selectedLead) {
        // 更新现有商机
        await put("leads", selectedLead);
        setLeads(prev => prev.map(item => item.id === selectedLead.id ? selectedLead : item));
        
        // 如果商机进入商务谈判阶段且可能性为高，自动转换为客户
        if (selectedLead.stage === "商务谈判" && selectedLead.possibility === "高" && selectedLead.id) {
          try {
            const result = await convertToCustomer("leads", typeof selectedLead.id === 'string' 
              ? parseInt(selectedLead.id) 
              : selectedLead.id);
            if (result.success) {
              alert(`线索已自动转换为客户: ${result.message}`);
            }
          } catch (convError) {
            console.error("转换客户时出错:", convError);
          }
        }
        
        setSelectedLead(null);
      } else {
        // 添加新商机
        const addedLead = await add("leads", newLead);
        setLeads(prev => [...prev, { ...newLead, id: addedLead as number }]);
        
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
          amount: 0,
        });
      }
      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving lead:", error);
    }
  };

  // 关闭对话框并重置状态
  const handleCloseDialog = () => {
    setSelectedLead(null);
    setDialogOpen(false);
  };

  // 格式化金额
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
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
          Sales Leads
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
          <Button variant="outline" size="icon" className="rounded-lg">
            <Filter className="h-4 w-4" />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-lg bg-gradient-to-r from-brand-blue to-brand-indigo hover:from-brand-blue/90 hover:to-brand-indigo/90 transition-all duration-300" onClick={() => setSelectedLead(null)}>
                <Plus className="mr-2 h-4 w-4" />
                添加线索
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedLead ? "编辑商机" : "添加新线索"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    客户名称
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={selectedLead ? selectedLead.name : newLead.name}
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
                    value={selectedLead ? selectedLead.need : newLead.need}
                    onChange={handleInputChange}
                    className="col-span-3 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stage" className="text-right">
                    项目阶段
                  </Label>
                  <Select value={selectedLead ? selectedLead.stage : newLead.stage} onValueChange={(value) => handleSelectChange("stage", value)}>
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
                    value={selectedLead ? selectedLead.advantage : newLead.advantage}
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
                    value={selectedLead ? selectedLead.disadvantage : newLead.disadvantage}
                    onChange={handleInputChange}
                    className="col-span-3 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="possibility" className="text-right">
                    可能性
                  </Label>
                  <Select value={selectedLead ? selectedLead.possibility : newLead.possibility} onValueChange={(value) => handleSelectChange("possibility", value)}>
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
                    value={selectedLead ? String(selectedLead.amount || 0) : String(newLead.amount || 0)}
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
                  {selectedLead ? "更新" : "添加"}
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
              <TableHead className="py-3 w-[140px]">
                <div className="flex items-center space-x-1">
                  <span>客户名称</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
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
            {filteredLeads.length > 0 ? (
              filteredLeads.map((lead: Lead, index: number) => (
                <TableRow key={lead.id} className="group">
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{lead.need}</TableCell>
                  <TableCell>
                    <Badge className={getStageColor(lead.stage)}>{lead.stage}</Badge>
                  </TableCell>
                  <TableCell>{lead.advantage}</TableCell>
                  <TableCell>{lead.disadvantage}</TableCell>
                  <TableCell>
                    <Badge className={getPossibilityColor(lead.possibility as "高" | "中" | "低")}>
                      {lead.possibility}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatAmount(lead.amount || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditLead(lead)}
                        className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity mr-1"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">编辑</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteLead(lead.id!)}
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
