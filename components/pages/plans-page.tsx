"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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
import { CalendarIcon, Plus, Search, ChevronLeft, ChevronRight, Filter, ArrowUpDown, Trash2 } from "lucide-react"
import { format, addWeeks, subWeeks } from "date-fns"
import { zhCN } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  getAll,
  add,
  put,
  remove,
  getWeekNumber,
  getWeekRange,
  formatWeekDisplay,
  getAllWeeks,
  getByWeek,
  initSampleData,
} from "@/lib/db-service"

// 定义类型
interface Plan {
  id: number
  task: string
  customer: string
  date: Date | string
  quarter: string
  week: number
  year: number
  completed: boolean
  type: string
}

interface WeekData {
  year: number
  week: number
}

// 扩展ButtonProps接口，添加缺失的属性
declare module "@/components/ui/button" {
  interface ButtonProps {
    variant?: string
    size?: string
  }
}

export function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedWeek, setSelectedWeek] = useState(getWeekNumber(new Date()))
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [availableWeeks, setAvailableWeeks] = useState<WeekData[]>([])
  const [showWeekSelector, setShowWeekSelector] = useState(false)
  const [newPlan, setNewPlan] = useState({
    task: "",
    customer: "",
    date: new Date(),
    quarter: "",
    week: getWeekNumber(new Date()),
    year: new Date().getFullYear(),
    completed: false,
    type: "其他",
  })

  // 获取客户列表
  const [customers, setCustomers] = useState<string[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 初始化示例数据
        await initSampleData()

        // 获取所有客户
        const customersData = await getAll("customers")
        const leads = await getAll("leads")
        const prospects = await getAll("prospects")
        const targets = await getAll("targets")

        // 合并所有客户名称
        const allCustomers = new Set<string>()
        customersData.forEach((customer: any) => allCustomers.add(customer.name))
        leads.forEach((lead: any) => allCustomers.add(lead.name))
        prospects.forEach((prospect: any) => allCustomers.add(prospect.name))
        targets.forEach((target: any) => allCustomers.add(target.name))

        setCustomers(Array.from(allCustomers))

        // 获取所有可用的周
        const weeks = await getAllWeeks("plans")
        setAvailableWeeks(weeks)

        // 获取当前周的计划
        await fetchPlansForWeek(selectedYear, selectedWeek)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const fetchPlansForWeek = async (year: number, week: number) => {
    try {
      setLoading(true)
      const plansData = await getByWeek("plans", year, week)
      setPlans(plansData)
    } catch (error) {
      console.error("Error fetching plans for week:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const filteredPlans = plans.filter(
    (plan) =>
      plan.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.customer.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewPlan((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setNewPlan((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return
    const week = getWeekNumber(date)
    const quarter = date.getMonth() < 3 ? "Q1" : date.getMonth() < 6 ? "Q2" : date.getMonth() < 9 ? "Q3" : "Q4"

    setNewPlan((prev) => ({
      ...prev,
      date,
      week,
      year: date.getFullYear(),
      quarter,
    }))
  }

  const handleAddPlan = async () => {
    try {
      // 确保plan有type字段
      const planToAdd = { ...newPlan };
      if (!planToAdd.type || planToAdd.type === "") {
        planToAdd.type = "其他";
      }
      
      // 添加到数据库
      await add("plans", planToAdd)

      // 如果添加的计划是当前选中的周，则刷新计划列表
      if (newPlan.year === selectedYear && newPlan.week === selectedWeek) {
        await fetchPlansForWeek(selectedYear, selectedWeek)
      }

      // 更新可用的周
      const weeks = await getAllWeeks("plans")
      setAvailableWeeks(weeks)

      // 重置表单
      setNewPlan({
        task: "",
        customer: "",
        date: new Date(),
        quarter: "",
        week: getWeekNumber(new Date()),
        year: new Date().getFullYear(),
        completed: false,
        type: "其他", // 保持默认类型
      })
    } catch (error) {
      console.error("Error adding plan:", error)
    }
  }

  const handleDeletePlan = async (id: number) => {
    try {
      if (window.confirm("确定要删除此计划吗？此操作不可恢复。")) {
        // 从数据库删除
        await remove("plans", id)

        // 更新状态
        setPlans(plans.filter((plan) => plan.id !== id))

        // 更新可用的周
        const weeks = await getAllWeeks("plans")
        setAvailableWeeks(weeks)
      }
    } catch (error) {
      console.error("Error deleting plan:", error)
    }
  }

  const handleToggleComplete = async (plan: Plan) => {
    try {
      // 确保plan有type字段
      const updatedPlan = { ...plan, completed: !plan.completed };
      if (!updatedPlan.type || updatedPlan.type === "") {
        updatedPlan.type = "其他";
      }
      
      await put("plans", updatedPlan)

      // 更新状态
      setPlans(plans.map((p) => (p.id === plan.id ? updatedPlan : p)))
    } catch (error) {
      console.error("Error updating plan:", error)
    }
  }

  const handlePreviousWeek = async () => {
    const prevDate = subWeeks(selectedDate, 1)
    const prevWeek = getWeekNumber(prevDate)
    const prevYear = prevDate.getFullYear()

    setSelectedDate(prevDate)
    setSelectedWeek(prevWeek)
    setSelectedYear(prevYear)

    await fetchPlansForWeek(prevYear, prevWeek)
  }

  const handleNextWeek = async () => {
    const nextDate = addWeeks(selectedDate, 1)
    const nextWeek = getWeekNumber(nextDate)
    const nextYear = nextDate.getFullYear()

    setSelectedDate(nextDate)
    setSelectedWeek(nextWeek)
    setSelectedYear(nextYear)

    await fetchPlansForWeek(nextYear, nextWeek)
  }

  const handleSelectWeek = async (year: number, week: number) => {
    setSelectedYear(year)
    setSelectedWeek(week)
    setShowWeekSelector(false)

    const { startDate } = getWeekRange(year, week)
    setSelectedDate(startDate)

    await fetchPlansForWeek(year, week)
  }

  const { startDate, endDate } = getWeekRange(selectedYear, selectedWeek)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <motion.div
        className="flex justify-between items-center mb-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-brand-pink to-brand-purple bg-clip-text text-transparent">
          Plans
        </h1>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="搜索计划..."
              className="pl-8 w-[200px] rounded-lg border-gray-200 focus:border-primary h-9"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <Button variant="outline" size="sm" className="rounded-lg h-9">
            <Filter className="h-4 w-4" />
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="rounded-lg bg-gradient-to-r from-brand-pink to-brand-purple hover:from-brand-pink/90 hover:to-brand-purple/90 transition-all duration-300 h-9"
              >
                <Plus className="mr-2 h-4 w-4" />
                添加计划
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-lg">添加新计划</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="task" className="text-right text-sm">
                    计划事项
                  </Label>
                  <Input
                    id="task"
                    name="task"
                    value={newPlan.task}
                    onChange={handleInputChange}
                    className="col-span-3 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right text-sm">
                    计划类型
                  </Label>
                  <Select value={newPlan.type} onValueChange={(value) => handleSelectChange("type", value)}>
                    <SelectTrigger className="col-span-3 rounded-lg">
                      <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="电话">电话联系</SelectItem>
                      <SelectItem value="拜访">客户拜访</SelectItem>
                      <SelectItem value="会议">内部会议</SelectItem>
                      <SelectItem value="培训">培训活动</SelectItem>
                      <SelectItem value="其他">其他事项</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="customer" className="text-right text-sm">
                    关联客户
                  </Label>
                  <Select value={newPlan.customer} onValueChange={(value) => handleSelectChange("customer", value)}>
                    <SelectTrigger className="col-span-3 rounded-lg">
                      <SelectValue placeholder="选择客户" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer} value={customer}>
                          {customer}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right text-sm">
                    日期
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant="outline"
                        className={cn(
                          "col-span-3 justify-start text-left font-normal rounded-lg",
                          !newPlan.date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newPlan.date ? format(newPlan.date, "PPP", { locale: zhCN }) : <span>选择日期</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={newPlan.date} onSelect={handleDateChange} initialFocus />
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
                    onClick={handleAddPlan}
                    className="rounded-lg bg-gradient-to-r from-brand-pink to-brand-purple"
                  >
                    保存
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* 周选择器 */}
      <motion.div
        className="mb-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="overflow-hidden rounded-xl shadow-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm">周计划</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handlePreviousWeek} className="h-7 px-2 rounded-lg">
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-w-[180px] h-7 rounded-lg"
                  onClick={() => setShowWeekSelector(!showWeekSelector)}
                >
                  {formatWeekDisplay(selectedYear, selectedWeek)}
                </Button>
                <Button variant="outline" size="sm" onClick={handleNextWeek} className="h-7 px-2 rounded-lg">
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {showWeekSelector && (
              <div className="p-3 border-b max-h-[200px] overflow-auto">
                <div className="grid grid-cols-2 gap-2">
                  {availableWeeks.map(({ year, week }) => (
                    <Button
                      key={`${year}-${week}`}
                      variant={year === selectedYear && week === selectedWeek ? "default" : "outline"}
                      size="sm"
                      className="justify-start h-7 text-xs rounded-lg"
                      onClick={() => handleSelectWeek(year, week)}
                    >
                      {formatWeekDisplay(year, week)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="p-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium">
                    {format(startDate, "yyyy年MM月dd日", { locale: zhCN })} 至{" "}
                    {format(endDate, "yyyy年MM月dd日", { locale: zhCN })}
                  </h3>
                  <p className="text-xs text-gray-500">
                    共 {filteredPlans.length} 个计划，
                    {filteredPlans.filter((plan) => plan.completed).length} 个已完成
                  </p>
                </div>
                <div>
                  <Badge className="bg-brand-pink/10 text-brand-pink text-xs">
                    第 {selectedWeek} 周
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        className="border rounded-xl overflow-hidden shadow-sm bg-white dark:bg-gray-800 flex-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/40">
              <TableHead className="w-[50px] py-3">状态</TableHead>
              <TableHead className="w-[60px] py-3">序号</TableHead>
              <TableHead className="py-3">
                <div className="flex items-center space-x-1">
                  <span>计划事项</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="py-3">类型</TableHead>
              <TableHead className="py-3">关联客户</TableHead>
              <TableHead className="py-3">日期</TableHead>
              <TableHead className="w-[80px] py-3 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlans.length > 0 ? (
              filteredPlans.map((plan, index) => (
                <TableRow
                  key={plan.id}
                  className={cn(
                    "group",
                    index % 2 === 0 ? "bg-white" : "bg-gray-50",
                    "hover:bg-muted/20 dark:hover:bg-muted/20 dark:bg-gray-800 dark:even:bg-gray-900",
                    plan.completed && "bg-muted/10",
                  )}
                >
                  <TableCell className="py-1.5">
                    <Checkbox
                      checked={plan.completed}
                      onCheckedChange={() => handleToggleComplete(plan)}
                      className="data-[state=checked]:bg-brand-pink data-[state=checked]:border-brand-pink h-4 w-4"
                    />
                  </TableCell>
                  <TableCell className="font-medium py-1.5 text-sm">{plan.id}</TableCell>
                  <TableCell
                    className={cn("font-medium py-1.5 text-sm", plan.completed && "line-through text-muted-foreground")}
                  >
                    {plan.task}
                  </TableCell>
                  <TableCell className="py-1.5 text-sm">{plan.type || "其他"}</TableCell>
                  <TableCell className="py-1.5 text-sm">{plan.customer}</TableCell>
                  <TableCell className="py-1.5 text-sm">{format(new Date(plan.date), "yyyy-MM-dd")}</TableCell>
                  <TableCell className="py-1.5 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePlan(plan.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">删除</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-muted-foreground mb-2 text-sm">该周暂无计划</p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="rounded-lg">
                          <Plus className="mr-1 h-3 w-3" />
                          添加计划
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px] rounded-xl">
                        <DialogHeader>
                          <DialogTitle>添加新计划</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="task" className="text-right">
                              计划事项
                            </Label>
                            <Input
                              id="task"
                              name="task"
                              value={newPlan.task}
                              onChange={handleInputChange}
                              className="col-span-3 rounded-lg"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">
                              计划类型
                            </Label>
                            <Select value={newPlan.type} onValueChange={(value) => handleSelectChange("type", value)}>
                              <SelectTrigger className="col-span-3 rounded-lg">
                                <SelectValue placeholder="选择类型" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="电话">电话联系</SelectItem>
                                <SelectItem value="拜访">客户拜访</SelectItem>
                                <SelectItem value="会议">内部会议</SelectItem>
                                <SelectItem value="培训">培训活动</SelectItem>
                                <SelectItem value="其他">其他事项</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="customer" className="text-right">
                              关联客户
                            </Label>
                            <Select
                              value={newPlan.customer}
                              onValueChange={(value) => handleSelectChange("customer", value)}
                            >
                              <SelectTrigger className="col-span-3 rounded-lg">
                                <SelectValue placeholder="选择客户" />
                              </SelectTrigger>
                              <SelectContent>
                                {customers.map((customer) => (
                                  <SelectItem key={customer} value={customer}>
                                    {customer}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right">
                              日期
                            </Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  id="date"
                                  variant="outline"
                                  className={cn(
                                    "col-span-3 justify-start text-left font-normal rounded-lg",
                                    !newPlan.date && "text-muted-foreground",
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {newPlan.date ? format(newPlan.date, "PPP", { locale: zhCN }) : <span>选择日期</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={newPlan.date}
                                  onSelect={handleDateChange}
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
                              onClick={handleAddPlan}
                              className="rounded-lg bg-gradient-to-r from-brand-pink to-brand-purple"
                            >
                              保存
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  )
}
