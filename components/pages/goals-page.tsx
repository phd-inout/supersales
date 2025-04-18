"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Button, type ButtonProps } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { motion } from "framer-motion"
import { getGoalsByQuarters, getGoalStats, getContractsByQuarter } from "@/lib/db-service"

// 定义类型接口
interface Goal {
  actual: number;
  target: number;
}

interface GoalData {
  [type: string]: Goal;
}

interface QuarterData {
  [quarter: string]: GoalData;
}

interface Contract {
  id: number;
  customer: string;
  amount: number;
  date: string;
}

// 定义详细表单数据结构
interface GoalFormData {
  name: string;
  quarter: string;
  type: string;
  target: number;
  actual: number;
}

export function GoalsPage() {
  const [activeQuarter, setActiveQuarter] = useState("Q1")
  const [goalsByQuarters, setGoalsByQuarters] = useState<QuarterData>({})
  const [goalStats, setGoalStats] = useState<GoalData>({})
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [newGoal, setNewGoal] = useState<GoalFormData>({
    name: "",
    quarter: "Q1",
    type: "leads",
    target: 0,
    actual: 0,
  })

  // 不同目标类型的颜色配置
  const goalTypeColors = {
    leads: "bg-blue-500",
    visits: "bg-green-500",
    prospects: "bg-purple-500",
    contracts: "bg-yellow-500",
    profit: "bg-red-500",
    payment: "bg-indigo-500"
  };

  // 目标类型的中文名称
  const goalTypeNames = {
    leads: "线索",
    visits: "拜访",
    prospects: "潜在客户",
    contracts: "合同金额",
    profit: "利润",
    payment: "回款"
  };

  // 计算所有季度的合计值
  const calculateTotalGoals = (quartersData: QuarterData): GoalData => {
    const totals: GoalData = {};
    
    // 定义需要计算的目标类型
    const goalTypes = ["leads", "visits", "prospects", "contracts", "profit", "payment"];
    
    // 初始化所有类型的合计值
    goalTypes.forEach(type => {
      totals[type] = { actual: 0, target: 0 };
    });
    
    // 调试每个季度的数据
    console.log("Q1数据:", quartersData.Q1);
    console.log("Q2数据:", quartersData.Q2);
    console.log("Q3数据:", quartersData.Q3);
    console.log("Q4数据:", quartersData.Q4);
    
    // 累加四个季度的值
    ["Q1", "Q2", "Q3", "Q4"].forEach(quarter => {
      if (quartersData[quarter]) {
        goalTypes.forEach(type => {
          if (quartersData[quarter][type]) {
            // 详细记录每个值的累加过程
            console.log(`累加数据: ${quarter} - ${type}:`, 
              `当前值=${totals[type].actual}, 待加值=${quartersData[quarter][type].actual}, 类型=${typeof quartersData[quarter][type].actual}`);
            
            // 确保值是数字并正确累加
            const actualToAdd = Number(quartersData[quarter][type].actual || 0);
            const targetToAdd = Number(quartersData[quarter][type].target || 0);
            
            totals[type].actual += actualToAdd;
            totals[type].target += targetToAdd;
          }
        });
      }
    });
    
    console.log("计算后的总计值:", totals);
    return totals;
  };

  // 获取最新目标数据
  const fetchGoalsData = async () => {
    try {
      const quarters = await getGoalsByQuarters();
      
      // 打印原始数据结构
      console.log("原始季度数据结构:", JSON.stringify(quarters));
      
      // 直接从四个季度数据计算全年目标
      const totalGoals = calculateTotalGoals(quarters);
      
      console.log("计算后的全年目标:", JSON.stringify(totalGoals));
      
      setGoalsByQuarters(quarters);
      setGoalStats(totalGoals);
      
      return { quarters, totalGoals };
    } catch (error) {
      console.error("获取目标数据失败:", error);
      return null;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // 获取目标数据
        await fetchGoalsData();
        
        // 获取合同数据
        const contractsData = await getContractsByQuarter(activeQuarter);
        setContracts(contractsData as Contract[]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [activeQuarter]);

  const getProgressColor = (progress: number): string => {
    if (progress >= 100) return "bg-green-500"
    if (progress >= 75) return "bg-green-400"
    if (progress >= 50) return "bg-yellow-400"
    if (progress >= 25) return "bg-orange-400"
    return "bg-red-400"
  }

  const calculateProgress = (actual: number, target: number): number => {
    if (!target) return 0
    const progress = Math.round((actual / target) * 100)
    return progress > 100 ? 100 : progress
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("zh-CN", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewGoal((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numValue = Number.parseFloat(value) || 0
    setNewGoal((prev) => ({ ...prev, [name]: numValue }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setNewGoal((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddGoal = async () => {
    try {
      // 添加到数据库
      const dbService = await import("@/lib/db-service");
      await dbService.add("goals", newGoal);
      
      // 立即重新获取数据并更新状态
      await fetchGoalsData();
      
      // 重置表单
      setNewGoal({
        name: "",
        quarter: "Q1",
        type: "leads",
        target: 0,
        actual: 0,
      });
    } catch (error) {
      console.error("添加目标失败:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  const currentQuarterData = goalsByQuarters[activeQuarter] || {}
  const hasData = Object.keys(currentQuarterData).length > 0

  return (
    <div className="p-4 h-full flex flex-col">
      <motion.div
        className="flex justify-between items-center mb-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-brand-teal to-brand-green bg-clip-text text-transparent">
          Goals
        </h1>
        <div className="flex items-center space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="rounded-lg bg-gradient-to-r from-brand-teal to-brand-green hover:from-brand-teal/90 hover:to-brand-green/90 transition-all duration-300">
                <Plus className="mr-2 h-4 w-4" />
                添加目标
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-xl">添加新目标</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
               
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quarter" className="text-right">
                    季度
                  </Label>
                  <Select value={newGoal.quarter} onValueChange={(value) => handleSelectChange("quarter", value)}>
                    <SelectTrigger className="col-span-3 rounded-lg">
                      <SelectValue placeholder="选择季度" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Q1">第一季度</SelectItem>
                      <SelectItem value="Q2">第二季度</SelectItem>
                      <SelectItem value="Q3">第三季度</SelectItem>
                      <SelectItem value="Q4">第四季度</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    目标类型
                  </Label>
                  <Select value={newGoal.type} onValueChange={(value) => handleSelectChange("type", value)}>
                    <SelectTrigger className="col-span-3 rounded-lg">
                      <SelectValue placeholder="选择目标类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leads">线索</SelectItem>
                      <SelectItem value="visits">拜访</SelectItem>
                      <SelectItem value="prospects">潜在客户</SelectItem>
                      <SelectItem value="contracts">合同金额</SelectItem>
                      <SelectItem value="profit">利润</SelectItem>
                      <SelectItem value="payment">回款</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="target" className="text-right">
                    目标值
                  </Label>
                  <Input
                    id="target"
                    name="target"
                    type="number"
                    value={newGoal.target}
                    onChange={handleNumberInputChange}
                    className="col-span-3 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="actual" className="text-right">
                    当前值
                  </Label>
                  <Input
                    id="actual"
                    name="actual"
                    type="number"
                    value={newGoal.actual}
                    onChange={handleNumberInputChange}
                    className="col-span-3 rounded-lg"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button className="rounded-lg">
                    取消
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    onClick={handleAddGoal}
                    className="rounded-lg bg-gradient-to-r from-brand-teal to-brand-green"
                  >
                    保存
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* 全年目标总览 - 使用色块区分目标类型 */}
      <motion.div
        className="flex flex-col mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-3 border">
          <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">全年目标进度</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.keys(goalTypeNames).map((type) => (
              <div
                key={type}
                className="flex flex-col p-3 rounded-lg shadow-sm border"
                style={{ borderLeftWidth: '4px', borderLeftColor: `var(--${type}-color, #4f46e5)` }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-sm">{goalTypeNames[type as keyof typeof goalTypeNames]}</span>
                  <span className="text-xs font-bold">
                    {calculateProgress(
                      goalStats[type]?.actual || 0,
                      goalStats[type]?.target || 0
                    )}%
                  </span>
                </div>
                
                <div className="flex justify-between text-sm mb-1">
                  <span>
                    {type === 'contracts' || type === 'profit' || type === 'payment' 
                      ? `¥${formatCurrency(goalStats[type]?.actual || 0)}` 
                      : goalStats[type]?.actual || 0}
                  </span>
                  <span className="text-gray-500">
                    目标: {type === 'contracts' || type === 'profit' || type === 'payment' 
                      ? `¥${formatCurrency(goalStats[type]?.target || 0)}` 
                      : goalStats[type]?.target || 0}
                  </span>
                </div>
                
                <Progress
                  value={calculateProgress(
                    goalStats[type]?.actual || 0,
                    goalStats[type]?.target || 0
                  )}
                  className={`h-2 ${goalTypeColors[type as keyof typeof goalTypeColors]}`}
                />
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 季度选项卡 */}
      <Tabs value={activeQuarter} onValueChange={setActiveQuarter} className="w-full flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 mb-3">
          <TabsTrigger value="Q1">Q1</TabsTrigger>
          <TabsTrigger value="Q2">Q2</TabsTrigger>
          <TabsTrigger value="Q3">Q3</TabsTrigger>
          <TabsTrigger value="Q4">Q4</TabsTrigger>
        </TabsList>

        {/* 季度内容 - 使用flex-1确保内容区域填充剩余空间 */}
        {["Q1", "Q2", "Q3", "Q4"].map((quarter) => (
          <TabsContent key={quarter} value={quarter} className="flex-1 flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-full">
              {/* 左侧季度详情 - 更紧凑的卡片设计 */}
              <div className="md:col-span-1 grid grid-cols-2 gap-3 auto-rows-min h-fit">
                {hasData ? (
                  <>
                    <Card className="overflow-hidden col-span-1">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-2">
                        <CardTitle className="text-sm">线索</CardTitle>
                      </CardHeader>
                      <CardContent className="p-2">
                        <div className="text-xl font-bold">{currentQuarterData.leads?.actual || 0}</div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs text-gray-500">目标: {currentQuarterData.leads?.target || 0}</span>
                          <span className="text-xs font-medium">
                            {calculateProgress(
                              currentQuarterData.leads?.actual || 0,
                              currentQuarterData.leads?.target || 0,
                            )}
                            %
                          </span>
                        </div>
                        <Progress
                          value={calculateProgress(
                            currentQuarterData.leads?.actual || 0,
                            currentQuarterData.leads?.target || 0,
                          )}
                          className="h-1 mt-1"
                        />
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden col-span-1">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-2">
                        <CardTitle className="text-sm">拜访</CardTitle>
                      </CardHeader>
                      <CardContent className="p-2">
                        <div className="text-xl font-bold">{currentQuarterData.visits?.actual || 0}</div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs text-gray-500">目标: {currentQuarterData.visits?.target || 0}</span>
                          <span className="text-xs font-medium">
                            {calculateProgress(
                              currentQuarterData.visits?.actual || 0,
                              currentQuarterData.visits?.target || 0,
                            )}
                            %
                          </span>
                        </div>
                        <Progress
                          value={calculateProgress(
                            currentQuarterData.visits?.actual || 0,
                            currentQuarterData.visits?.target || 0,
                          )}
                          className="h-1 mt-1"
                        />
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden col-span-1">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-2">
                        <CardTitle className="text-sm">潜在客户</CardTitle>
                      </CardHeader>
                      <CardContent className="p-2">
                        <div className="text-xl font-bold">{currentQuarterData.prospects?.actual || 0}</div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            目标: {currentQuarterData.prospects?.target || 0}
                          </span>
                          <span className="text-xs font-medium">
                            {calculateProgress(
                              currentQuarterData.prospects?.actual || 0,
                              currentQuarterData.prospects?.target || 0,
                            )}
                            %
                          </span>
                        </div>
                        <Progress
                          value={calculateProgress(
                            currentQuarterData.prospects?.actual || 0,
                            currentQuarterData.prospects?.target || 0,
                          )}
                          className="h-1 mt-1"
                        />
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden col-span-1">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-2">
                        <CardTitle className="text-sm">合同</CardTitle>
                      </CardHeader>
                      <CardContent className="p-2">
                        <div className="text-xl font-bold">
                          ¥{formatCurrency(currentQuarterData.contracts?.actual || 0)}
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            目标: ¥{formatCurrency(currentQuarterData.contracts?.target || 0)}
                          </span>
                          <span className="text-xs font-medium">
                            {calculateProgress(
                              currentQuarterData.contracts?.actual || 0,
                              currentQuarterData.contracts?.target || 0,
                            )}
                            %
                          </span>
                        </div>
                        <Progress
                          value={calculateProgress(
                            currentQuarterData.contracts?.actual || 0,
                            currentQuarterData.contracts?.target || 0,
                          )}
                          className="h-1 mt-1"
                        />
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden col-span-1">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-2">
                        <div className="flex justify-between">
                          <CardTitle className="text-sm">利润</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-2">
                        <div className="text-xl font-bold">
                          ¥{formatCurrency(currentQuarterData.profit?.actual || 0)}
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            目标: ¥{formatCurrency(currentQuarterData.profit?.target || 0)}
                          </span>
                          <span className="text-xs font-medium">
                            {calculateProgress(
                              currentQuarterData.profit?.actual || 0,
                              currentQuarterData.profit?.target || 0,
                            )}
                            %
                          </span>
                        </div>
                        <Progress
                          value={calculateProgress(
                            currentQuarterData.profit?.actual || 0,
                            currentQuarterData.profit?.target || 0,
                          )}
                          className="h-1 mt-1"
                        />
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden col-span-1">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-2">
                        <CardTitle className="text-sm">回款</CardTitle>
                      </CardHeader>
                      <CardContent className="p-2">
                        <div className="text-xl font-bold">
                          ¥{formatCurrency(currentQuarterData.payment?.actual || 0)}
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            目标: ¥{formatCurrency(currentQuarterData.payment?.target || 0)}
                          </span>
                          <span className="text-xs font-medium">
                            {calculateProgress(
                              currentQuarterData.payment?.actual || 0,
                              currentQuarterData.payment?.target || 0,
                            )}
                            %
                          </span>
                        </div>
                        <Progress
                          value={calculateProgress(
                            currentQuarterData.payment?.actual || 0,
                            currentQuarterData.payment?.target || 0,
                          )}
                          className="h-1 mt-1"
                        />
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 bg-white dark:bg-gray-800 rounded-xl border p-4 col-span-2">
                    <p className="text-gray-500 dark:text-gray-400 mb-2 text-sm">该季度暂无目标数据</p>
                    <Button className="bg-gradient-to-r from-brand-teal to-brand-green">
                      <Plus className="mr-1 h-3 w-3" />
                      添加目标
                    </Button>
                  </div>
                )}
              </div>

              {/* 右侧季度详情 */}
              <div className="md:col-span-2 space-y-3 h-full flex flex-col">
                {hasData ? (
                  <>
                    {/* 季度进度概览 */}
                    <Card className="overflow-hidden flex-1">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-3">
                        <CardTitle className="text-sm">{quarter} 进度概览</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-xs font-medium">线索</span>
                              <span className="text-xs font-medium">
                                {calculateProgress(
                                  currentQuarterData.leads?.actual || 0,
                                  currentQuarterData.leads?.target || 0,
                                )}
                                %
                              </span>
                            </div>
                            <Progress
                              value={calculateProgress(
                                currentQuarterData.leads?.actual || 0,
                                currentQuarterData.leads?.target || 0,
                              )}
                              className="h-1.5"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>当前: {currentQuarterData.leads?.actual || 0}</span>
                              <span>目标: {currentQuarterData.leads?.target || 0}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-xs font-medium">拜访</span>
                              <span className="text-xs font-medium">
                                {calculateProgress(
                                  currentQuarterData.visits?.actual || 0,
                                  currentQuarterData.visits?.target || 0,
                                )}
                                %
                              </span>
                            </div>
                            <Progress
                              value={calculateProgress(
                                currentQuarterData.visits?.actual || 0,
                                currentQuarterData.visits?.target || 0,
                              )}
                              className="h-1.5"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>当前: {currentQuarterData.visits?.actual || 0}</span>
                              <span>目标: {currentQuarterData.visits?.target || 0}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-xs font-medium">潜在客户</span>
                              <span className="text-xs font-medium">
                                {calculateProgress(
                                  currentQuarterData.prospects?.actual || 0,
                                  currentQuarterData.prospects?.target || 0,
                                )}
                                %
                              </span>
                            </div>
                            <Progress
                              value={calculateProgress(
                                currentQuarterData.prospects?.actual || 0,
                                currentQuarterData.prospects?.target || 0,
                              )}
                              className="h-1.5"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>当前: {currentQuarterData.prospects?.actual || 0}</span>
                              <span>目标: {currentQuarterData.prospects?.target || 0}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-xs font-medium">合同金额</span>
                              <span className="text-xs font-medium">
                                {calculateProgress(
                                  currentQuarterData.contracts?.actual || 0,
                                  currentQuarterData.contracts?.target || 0,
                                )}
                                %
                              </span>
                            </div>
                            <Progress
                              value={calculateProgress(
                                currentQuarterData.contracts?.actual || 0,
                                currentQuarterData.contracts?.target || 0,
                              )}
                              className="h-1.5"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>当前: ¥{formatCurrency(currentQuarterData.contracts?.actual || 0)}</span>
                              <span>目标: ¥{formatCurrency(currentQuarterData.contracts?.target || 0)}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-xs font-medium">利润</span>
                              <span className="text-xs font-medium">
                                {calculateProgress(
                                  currentQuarterData.profit?.actual || 0,
                                  currentQuarterData.profit?.target || 0,
                                )}
                                %
                              </span>
                            </div>
                            <Progress
                              value={calculateProgress(
                                currentQuarterData.profit?.actual || 0,
                                currentQuarterData.profit?.target || 0,
                              )}
                              className="h-1.5"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>当前: ¥{formatCurrency(currentQuarterData.profit?.actual || 0)}</span>
                              <span>目标: ¥{formatCurrency(currentQuarterData.profit?.target || 0)}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-xs font-medium">回款</span>
                              <span className="text-xs font-medium">
                                {calculateProgress(
                                  currentQuarterData.payment?.actual || 0,
                                  currentQuarterData.payment?.target || 0,
                                )}
                                %
                              </span>
                            </div>
                            <Progress
                              value={calculateProgress(
                                currentQuarterData.payment?.actual || 0,
                                currentQuarterData.payment?.target || 0,
                              )}
                              className="h-1.5"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>当前: ¥{formatCurrency(currentQuarterData.payment?.actual || 0)}</span>
                              <span>目标: ¥{formatCurrency(currentQuarterData.payment?.target || 0)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 合同进度 - 从数据库获取数据 */}
                    <Card className="overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-3">
                        <CardTitle className="text-sm">{quarter} 合同进度</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        {contracts.length > 0 ? (
                          <div className="grid grid-cols-2 gap-0">
                            {contracts.map((contract, index) => (
                              <div
                                key={contract.id}
                                className={`p-2 ${index % 2 === 0 && index < contracts.length - 1 ? "border-r" : ""} ${index < contracts.length - 2 ? "border-b" : ""}`}
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <div className="text-xs font-medium">¥{formatCurrency(contract.amount)}</div>
                                    <div className="text-xs text-gray-500">{Math.round(Math.random() * 100)}% 完成</div>
                                  </div>
                                  <div className="text-xs">{contract.customer}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-center">
                            <p className="text-sm text-gray-500">该季度暂无合同数据</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-gray-800 rounded-xl border p-4">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">该季度暂无匹配的商机</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
