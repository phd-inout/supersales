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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Plus, Search, Pencil, Trash2, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import type { ChangeEvent } from "react"

export function CustomerInfoPage() {
  // 添加正确的Customer接口类型
  interface Customer {
    id?: string | number;
    name: string;
    contact: string;
    type: string;
    industry: string;
    rating: string;
    tags: string[];
    joinDate: Date;
  }

  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [newCustomer, setNewCustomer] = useState<Customer>({
    name: "",
    contact: "",
    type: "民企",
    industry: "",
    rating: "B",
    tags: [],
    joinDate: new Date(),
  })
  const [newTag, setNewTag] = useState("")
  const [refreshFlag, setRefreshFlag] = useState(0)
  const [viewMode, setViewMode] = useState<"customers" | "prospects" | "leads">("customers")
  const [prospects, setProspects] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])

  // 加载客户数据
  useEffect(() => {
    const fetchCustomersData = async () => {
      try {
        setLoading(true)
        // 从数据库获取客户数据
        const { getAll } = await import("@/lib/db-service")
        const customersData = await getAll("customers")
        setCustomers(customersData as Customer[])
        console.log("已加载客户数据:", customersData.length, "条记录")
      } catch (error) {
        console.error("Error fetching customers data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomersData()
  }, [refreshFlag])

  // 加载潜在客户和线索数据
  useEffect(() => {
    const fetchProspectsAndLeadsData = async () => {
      try {
        const { getAll } = await import("@/lib/db-service")
        
        // 加载潜在客户数据
        if (viewMode === "prospects") {
          const prospectsData = await getAll("prospects")
          setProspects(prospectsData)
          console.log("已加载潜在客户数据:", prospectsData.length, "条记录")
        }
        
        // 加载线索数据
        if (viewMode === "leads") {
          const leadsData = await getAll("leads")
          setLeads(leadsData)
          console.log("已加载线索数据:", leadsData.length, "条记录")
        }
      } catch (error) {
        console.error("Error fetching prospects/leads data:", error)
      }
    }

    fetchProspectsAndLeadsData()
  }, [viewMode])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (editingCustomer) {
      setEditingCustomer((prev) => {
        if (!prev) return prev;
        return { ...prev, [name]: value };
      })
    } else {
      setNewCustomer((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    if (editingCustomer) {
      setEditingCustomer((prev) => {
        if (!prev) return prev;
        return { ...prev, [name]: value };
      })
    } else {
      setNewCustomer((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleDateChange = (date: Date) => {
    if (editingCustomer) {
      setEditingCustomer((prev) => {
        if (!prev) return prev;
        return { ...prev, joinDate: date };
      })
    } else {
      setNewCustomer((prev) => ({ ...prev, joinDate: date }))
    }
  }

  const handleTagInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewTag(e.target.value)
  }

  const handleAddTag = () => {
    if (newTag.trim()) {
      if (editingCustomer) {
        if (!editingCustomer.tags.includes(newTag.trim())) {
          setEditingCustomer((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              tags: [...prev.tags, newTag.trim()],
            };
          })
        }
      } else {
        if (!newCustomer.tags.includes(newTag.trim())) {
          setNewCustomer((prev) => ({
            ...prev,
            tags: [...prev.tags, newTag.trim()],
          }))
        }
      }
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    if (editingCustomer) {
      setEditingCustomer((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tags: prev.tags.filter((tag) => tag !== tagToRemove),
        };
      })
    } else {
      setNewCustomer((prev) => ({
        ...prev,
        tags: prev.tags.filter((tag) => tag !== tagToRemove),
      }))
    }
  }

  const handleAddCustomer = async () => {
    try {
      // 检查是否有重复客户名称
      const duplicateCustomer = customers.find(
        customer => customer.name.toLowerCase() === newCustomer.name.toLowerCase()
      )
      
      if (duplicateCustomer) {
        alert(`客户名称 "${newCustomer.name}" 已存在，请使用其他名称！`)
        return
      }
      
      // 添加到数据库
      const { add } = await import("@/lib/db-service")
      const id = await add("customers", newCustomer)

      // 更新状态
      setCustomers([...customers, { ...newCustomer, id: id as string | number }])

      // 重置表单
      setNewCustomer({
        name: "",
        contact: "",
        type: "民企",
        industry: "",
        rating: "B",
        tags: [],
        joinDate: new Date(),
      })
    } catch (error) {
      console.error("Error adding customer:", error)
    }
  }

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer({ ...customer })
  }

  const handleUpdateCustomer = async () => {
    try {
      if (!editingCustomer) return;
      
      // 更新数据库
      const { put } = await import("@/lib/db-service")
      await put("customers", editingCustomer)

      // 更新状态
      setCustomers(customers.map((c) => (c.id === editingCustomer.id ? editingCustomer : c)))

      // 重置编辑状态
      setEditingCustomer(null)
    } catch (error) {
      console.error("Error updating customer:", error)
    }
  }

  const handleDeleteCustomer = async (id: string | number) => {
    try {
      if (window.confirm("确定要删除此客户吗？此操作不可恢复。")) {
        // 从数据库删除
        const { remove } = await import("@/lib/db-service")
        await remove("customers", typeof id === 'string' ? parseInt(id) : id)

        // 更新状态
        setCustomers(customers.filter((customer) => customer.id !== id))
      }
    } catch (error) {
      console.error("Error deleting customer:", error)
    }
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "A":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "B":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "C":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "D":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "国企":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "民企":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "外企":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "事业单位":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const handleRefresh = () => {
    setRefreshFlag(prev => prev + 1)
  }

  // 当点击刷新按钮时，同步潜在客户数据
  const handleSyncCustomers = async () => {
    try {
      setLoading(true);
      // 先重新加载客户数据
      const { getAll, convertToCustomer } = await import("@/lib/db-service");
      
      // 获取现有客户名称列表，用于检查重复
      const existingCustomerNames = customers.map(customer => 
        customer.name.toLowerCase()
      );
      
      // 获取潜在客户数据
      const prospectsData = await getAll("prospects");
      const potentialCustomers = prospectsData.filter(
        (prospect: any) => prospect.stage === "商务谈判" && prospect.possibility === "高"
      );
      
      // 获取线索数据
      const leadsData = await getAll("leads");
      const potentialLeads = leadsData.filter(
        (lead: any) => lead.stage === "商务谈判" && lead.possibility === "高"
      );
      
      // 获取目标客户数据
      const targetsData = await getAll("targets");
      const potentialTargets = targetsData.filter(
        (target: any) => target.possibility === "高"
      );
      
      // 同步潜在客户到客户列表
      let syncCount = 0;
      for (const prospect of potentialCustomers) {
        if (prospect.id && !existingCustomerNames.includes(prospect.name.toLowerCase())) {
          try {
            await convertToCustomer("prospects", typeof prospect.id === 'string' 
              ? parseInt(prospect.id) 
              : prospect.id);
            syncCount++;
          } catch (error) {
            console.error("同步潜在客户时出错:", error);
          }
        }
      }
      
      // 同步线索到客户列表
      for (const lead of potentialLeads) {
        if (lead.id && !existingCustomerNames.includes(lead.name.toLowerCase())) {
          try {
            await convertToCustomer("leads", typeof lead.id === 'string' 
              ? parseInt(lead.id) 
              : lead.id);
            syncCount++;
          } catch (error) {
            console.error("同步线索时出错:", error);
          }
        }
      }
      
      // 同步目标客户到客户列表
      for (const target of potentialTargets) {
        if (target.id && !existingCustomerNames.includes(target.name.toLowerCase())) {
          try {
            await convertToCustomer("targets", typeof target.id === 'string' 
              ? parseInt(target.id) 
              : target.id);
            syncCount++;
          } catch (error) {
            console.error("同步目标客户时出错:", error);
          }
        }
      }
      
      // 刷新客户列表
      handleRefresh();
      
      if (syncCount > 0) {
        alert(`成功同步了 ${syncCount} 个潜在客户/线索/目标客户到客户列表`);
      } else {
        alert("没有新的可同步客户，或者客户名称已存在");
      }
    } catch (error) {
      console.error("同步客户数据时出错:", error);
    } finally {
      setLoading(false);
    }
  };
  
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
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-brand-red to-brand-amber bg-clip-text text-transparent">
          客户信息
        </h1>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="搜索客户..."
              className="pl-8 w-[250px] rounded-lg border-gray-200 focus:border-primary"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <Select value={viewMode} onValueChange={(value: "customers" | "prospects" | "leads") => setViewMode(value)}>
            <SelectTrigger className="w-[120px] rounded-lg">
              <SelectValue placeholder="数据视图" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customers">正式客户</SelectItem>
              <SelectItem value="prospects">潜在客户</SelectItem>
              <SelectItem value="leads">线索客户</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="rounded-lg" onClick={handleRefresh} title="刷新客户列表">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleSyncCustomers} className="rounded-lg" title="同步所有高可能性的潜在客户/线索/目标客户">
            <RefreshCw className="mr-2 h-4 w-4" />
            同步客户数据
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="rounded-lg bg-gradient-to-r from-brand-red to-brand-amber hover:from-brand-red/90 hover:to-brand-amber/90 transition-all duration-300">
                <Plus className="mr-2 h-4 w-4" />
                添加客户
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-lg">添加新客户</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    客户名称
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={newCustomer.name}
                    onChange={handleInputChange}
                    className="col-span-3 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="contact" className="text-right">
                    联系人
                  </Label>
                  <Input
                    id="contact"
                    name="contact"
                    value={newCustomer.contact}
                    onChange={handleInputChange}
                    className="col-span-3 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    客户性质
                  </Label>
                  <Select value={newCustomer.type} onValueChange={(value) => handleSelectChange("type", value)}>
                    <SelectTrigger className="col-span-3 rounded-lg">
                      <SelectValue placeholder="选择客户性质" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="国企">国企</SelectItem>
                      <SelectItem value="民企">民企</SelectItem>
                      <SelectItem value="外企">外企</SelectItem>
                      <SelectItem value="事业单位">事业单位</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="industry" className="text-right">
                    客户行业
                  </Label>
                  <Input
                    id="industry"
                    name="industry"
                    value={newCustomer.industry}
                    onChange={handleInputChange}
                    className="col-span-3 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rating" className="text-right">
                    客户评级
                  </Label>
                  <Select value={newCustomer.rating} onValueChange={(value) => handleSelectChange("rating", value)}>
                    <SelectTrigger className="col-span-3 rounded-lg">
                      <SelectValue placeholder="选择客户评级" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tags" className="text-right">
                    客户标签
                  </Label>
                  <div className="col-span-3 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {newCustomer.tags.map((tag, index) => (
                        <Badge key={index} className="flex items-center gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 rounded-full text-xs"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        id="newTag"
                        value={newTag}
                        onChange={handleTagInputChange}
                        placeholder="输入标签"
                        className="rounded-lg"
                      />
                      <Button type="button" onClick={handleAddTag} size="sm" className="rounded-lg">
                        添加
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="joinDate" className="text-right">
                    加入时间
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="joinDate"
                        variant={"outline"}
                        className={cn(
                          "col-span-3 justify-start text-left font-normal rounded-lg",
                          !newCustomer.joinDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newCustomer.joinDate ? (
                          format(newCustomer.joinDate, "PPP", { locale: zhCN })
                        ) : (
                          <span>选择日期</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newCustomer.joinDate}
                        onSelect={(date) => date && handleDateChange(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                    onClick={handleAddCustomer}
                    className="rounded-lg bg-gradient-to-r from-brand-red to-brand-amber"
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
        {viewMode === "customers" && (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/40">
                <TableHead className="w-[60px] py-3">序号</TableHead>
                <TableHead className="py-3">客户名称</TableHead>
                <TableHead className="py-3">联系人</TableHead>
                <TableHead className="py-3">客户性质</TableHead>
                <TableHead className="py-3">客户行业</TableHead>
                <TableHead className="py-3">客户评级</TableHead>
                <TableHead className="py-3">客户标签</TableHead>
                <TableHead className="py-3">加入时间</TableHead>
                <TableHead className="w-[100px] py-3 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer, index) => (
                <TableRow
                  key={customer.id}
                  className={cn(
                    "group",
                    index % 2 === 0 ? "bg-white" : "bg-gray-50",
                    "hover:bg-muted/20 dark:hover:bg-muted/20 dark:bg-gray-800 dark:even:bg-gray-900",
                  )}
                >
                  <TableCell className="font-medium">{customer.id}</TableCell>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.contact}</TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(customer.type)}>
                      {customer.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{customer.industry}</TableCell>
                  <TableCell>
                    <Badge className={getRatingColor(customer.rating)}>
                      {customer.rating}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {customer.tags.map((tag, index) => (
                        <Badge key={index} className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(customer.joinDate), "yyyy-MM-dd")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleEditCustomer(customer)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">编辑</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-xl">
                          <DialogHeader>
                            <DialogTitle className="text-lg">编辑客户</DialogTitle>
                          </DialogHeader>
                          {editingCustomer && (
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-name" className="text-right">
                                  客户名称
                                </Label>
                                <Input
                                  id="edit-name"
                                  name="name"
                                  value={editingCustomer.name}
                                  onChange={handleInputChange}
                                  className="col-span-3 rounded-lg"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-contact" className="text-right">
                                  联系人
                                </Label>
                                <Input
                                  id="edit-contact"
                                  name="contact"
                                  value={editingCustomer.contact}
                                  onChange={handleInputChange}
                                  className="col-span-3 rounded-lg"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-type" className="text-right">
                                  客户性质
                                </Label>
                                <Select
                                  value={editingCustomer.type}
                                  onValueChange={(value) => handleSelectChange("type", value)}
                                >
                                  <SelectTrigger className="col-span-3 rounded-lg">
                                    <SelectValue placeholder="选择客户性质" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="国企">国企</SelectItem>
                                    <SelectItem value="民企">民企</SelectItem>
                                    <SelectItem value="外企">外企</SelectItem>
                                    <SelectItem value="事业单位">事业单位</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-industry" className="text-right">
                                  客户行业
                                </Label>
                                <Input
                                  id="edit-industry"
                                  name="industry"
                                  value={editingCustomer.industry}
                                  onChange={handleInputChange}
                                  className="col-span-3 rounded-lg"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-rating" className="text-right">
                                  客户评级
                                </Label>
                                <Select
                                  value={editingCustomer.rating}
                                  onValueChange={(value) => handleSelectChange("rating", value)}
                                >
                                  <SelectTrigger className="col-span-3 rounded-lg">
                                    <SelectValue placeholder="选择客户评级" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="A">A</SelectItem>
                                    <SelectItem value="B">B</SelectItem>
                                    <SelectItem value="C">C</SelectItem>
                                    <SelectItem value="D">D</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-tags" className="text-right">
                                  客户标签
                                </Label>
                                <div className="col-span-3 space-y-2">
                                  <div className="flex flex-wrap gap-2">
                                    {editingCustomer.tags.map((tag, index) => (
                                      <Badge key={index} className="flex items-center gap-1">
                                        {tag}
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveTag(tag)}
                                          className="ml-1 rounded-full text-xs"
                                        >
                                          ×
                                        </button>
                                      </Badge>
                                    ))}
                                  </div>
                                  <div className="flex gap-2">
                                    <Input
                                      id="edit-newTag"
                                      value={newTag}
                                      onChange={handleTagInputChange}
                                      placeholder="输入标签"
                                      className="rounded-lg"
                                    />
                                    <Button type="button" onClick={handleAddTag} size="sm" className="rounded-lg">
                                      添加
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-joinDate" className="text-right">
                                  加入时间
                                </Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      id="edit-joinDate"
                                      variant={"outline"}
                                      className={cn(
                                        "col-span-3 justify-start text-left font-normal rounded-lg",
                                        !editingCustomer.joinDate && "text-muted-foreground",
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {editingCustomer.joinDate ? (
                                        format(new Date(editingCustomer.joinDate), "PPP", { locale: zhCN })
                                      ) : (
                                        <span>选择日期</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <Calendar
                                      mode="single"
                                      selected={editingCustomer.joinDate ? new Date(editingCustomer.joinDate) : undefined}
                                      onSelect={(date) => date && handleDateChange(date)}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline" className="rounded-lg">
                                取消
                              </Button>
                            </DialogClose>
                            <DialogClose asChild>
                              <Button
                                onClick={handleUpdateCustomer}
                                className="rounded-lg bg-gradient-to-r from-brand-blue to-brand-indigo"
                              >
                                更新
                              </Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteCustomer(customer.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">删除</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {viewMode === "prospects" && (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/40">
                <TableHead className="w-[60px] py-3">序号</TableHead>
                <TableHead className="py-3">潜在客户名称</TableHead>
                <TableHead className="py-3">客户需求</TableHead>
                <TableHead className="py-3">项目阶段</TableHead>
                <TableHead className="py-3">可能性</TableHead>
                <TableHead className="py-3">预估金额</TableHead>
                <TableHead className="w-[100px] py-3 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prospects.map((prospect, index) => (
                <TableRow key={prospect.id} className="group">
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">{prospect.name}</TableCell>
                  <TableCell>{prospect.need}</TableCell>
                  <TableCell>
                    <Badge className={
                      prospect.stage === "商务谈判" ? "bg-pink-100 text-pink-800" :
                      prospect.stage === "方案设计" ? "bg-purple-100 text-purple-800" :
                      prospect.stage === "需求调研" ? "bg-indigo-100 text-indigo-800" :
                      "bg-blue-100 text-blue-800"
                    }>
                      {prospect.stage}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      prospect.possibility === "高" ? "bg-green-100 text-green-800" :
                      prospect.possibility === "中" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }>
                      {prospect.possibility}
                    </Badge>
                  </TableCell>
                  <TableCell>{prospect.amount ? new Intl.NumberFormat("zh-CN", {
                    style: "currency",
                    currency: "CNY",
                    minimumFractionDigits: 0,
                  }).format(prospect.amount) : "¥0"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => window.location.href = "/prospects"}
                    >
                      查看详情
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {prospects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    暂无潜在客户数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {viewMode === "leads" && (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/40">
                <TableHead className="w-[60px] py-3">序号</TableHead>
                <TableHead className="py-3">线索客户名称</TableHead>
                <TableHead className="py-3">客户需求</TableHead>
                <TableHead className="py-3">项目阶段</TableHead>
                <TableHead className="py-3">可能性</TableHead>
                <TableHead className="py-3">预估金额</TableHead>
                <TableHead className="w-[100px] py-3 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead, index) => (
                <TableRow key={lead.id} className="group">
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>{lead.need}</TableCell>
                  <TableCell>
                    <Badge className={
                      lead.stage === "商务谈判" ? "bg-pink-100 text-pink-800" :
                      lead.stage === "方案设计" ? "bg-purple-100 text-purple-800" :
                      lead.stage === "需求调研" ? "bg-indigo-100 text-indigo-800" :
                      "bg-blue-100 text-blue-800"
                    }>
                      {lead.stage}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      lead.possibility === "高" ? "bg-green-100 text-green-800" :
                      lead.possibility === "中" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }>
                      {lead.possibility}
                    </Badge>
                  </TableCell>
                  <TableCell>{lead.amount ? new Intl.NumberFormat("zh-CN", {
                    style: "currency",
                    currency: "CNY",
                    minimumFractionDigits: 0,
                  }).format(lead.amount) : "¥0"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => window.location.href = "/leads"}
                    >
                      查看详情
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {leads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    暂无线索客户数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </motion.div>
    </div>
  )
}
