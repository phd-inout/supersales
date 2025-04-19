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
  id?: number;
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

  // 图标对应文本颜色
  const goalTypeTextColors = {
    leads: "text-blue-500",
    visits: "text-green-500",
    prospects: "text-purple-500",
    contracts: "text-yellow-500",
    profit: "text-red-500",
    payment: "text-indigo-500"
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
      
      // 检查是否已存在相同季度和类型的目标
      const existingGoals = await dbService.getAll("goals");
      const existingGoal: { id: number; quarter: string; type: string } | undefined = existingGoals.find(
        (goal: { quarter: string; type: string }) => goal.quarter === newGoal.quarter && goal.type === newGoal.type
      );
      
      if (existingGoal) {
        // 更新现有目标
        await dbService.put("goals", {
    id: existingGoal.id,
          name: newGoal.name,
          quarter: newGoal.quarter,
          type: newGoal.type,
          target: newGoal.target,
          actual: newGoal.actual
        });
      } else {
        // 添加新目标
        await dbService.add("goals", newGoal);
      }
      
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

      {/* 全年目标总览 - 现代化卡片设计 */}
      <motion.div
        className="flex flex-col mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="rounded-xl overflow-hidden border-0 shadow-md">
          <CardHeader className="p-3 border-b bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
            <CardTitle className="text-base font-medium text-gray-800 dark:text-gray-200 flex items-center">
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-brand-teal"></span>
              全年目标概览
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-6 gap-3">
              {Object.keys(goalTypeNames).map((type) => {
                // 计算进度百分比
                const progress = calculateProgress(
                  goalStats[type]?.actual || 0, 
                  goalStats[type]?.target || 0
                );
                
                // 是否为金额类型
                const isMonetary = type === 'contracts' || type === 'profit' || type === 'payment';
                
                // 设置图标
                const goalIcons = {
                  leads: "👥",
                  visits: "🤝",
                  prospects: "🎯",
                  contracts: "📝",
                  profit: "💰",
                  payment: "💸"
                };
                
                // 背景样式
                const bgStyles = {
                  leads: "bg-gradient-to-br from-blue-50 to-white",
                  visits: "bg-gradient-to-br from-green-50 to-white",
                  prospects: "bg-gradient-to-br from-purple-50 to-white",
                  contracts: "bg-gradient-to-br from-yellow-50 to-white",
                  profit: "bg-gradient-to-br from-red-50 to-white",
                  payment: "bg-gradient-to-br from-indigo-50 to-white"
                };
                
                // 设定装饰元素颜色
                const decorationColors = {
                  leads: "border-blue-500",
                  visits: "border-green-500",
                  prospects: "border-purple-500",
                  contracts: "border-yellow-500",
                  profit: "border-red-500",
                  payment: "border-indigo-500"
                };
                
                return (
                  <div
                    key={type}
                    className={`relative group p-3.5 rounded-xl border shadow-sm ${bgStyles[type as keyof typeof bgStyles]} hover:shadow-md transition-all duration-300 overflow-hidden`}
                  >
                    {/* 装饰元素 */}
                    <div className={`absolute -right-2 -top-2 w-12 h-12 rounded-full border-4 ${decorationColors[type as keyof typeof decorationColors]} opacity-10`}></div>
                    <div className={`absolute -left-3 -bottom-3 w-8 h-8 rounded-full border-4 ${decorationColors[type as keyof typeof decorationColors]} opacity-10`}></div>
                    
                    {/* 标题与图标 */}
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center">
                        <span className="mr-2 text-lg">{goalIcons[type as keyof typeof goalIcons]}</span>
                        <span className={`text-xs font-medium ${goalTypeTextColors[type as keyof typeof goalTypeTextColors]}`}>
                          {goalTypeNames[type as keyof typeof goalTypeNames]}
                        </span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        progress >= 75 ? "bg-green-100 text-green-700" : 
                        progress >= 50 ? "bg-yellow-100 text-yellow-700" : 
                        "bg-red-100 text-red-700"
                      }`}>
                        {progress}%
                      </span>
                    </div>
                    
                    {/* 数值显示 */}
                    <div className="mt-2">
                      <div className="text-xl font-bold text-gray-800 dark:text-white">
                        {isMonetary ? `¥${formatCurrency(goalStats[type]?.actual || 0)}` : goalStats[type]?.actual || 0}
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <div className="text-xs text-gray-500">
                          <span className="opacity-70">目标:</span> {isMonetary ? `¥${formatCurrency(goalStats[type]?.target || 0)}` : goalStats[type]?.target || 0}
                        </div>
                      </div>
                    </div>
                    
                    {/* 进度条 */}
                    <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          progress >= 75 ? "bg-green-500" : 
                          progress >= 50 ? "bg-yellow-500" : 
                          "bg-red-500"
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    
                    {/* 进度指示器 - 只在悬停时显示 */}
                    <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <svg className="w-6 h-6" viewBox="0 0 36 36">
                        <circle 
                          cx="18" 
                          cy="18" 
                          r="16" 
                          fill="none" 
                          stroke="#e5e7eb" 
                          strokeWidth="3" 
                        />
                        <circle 
                          cx="18" 
                          cy="18" 
                          r="16" 
                          fill="none" 
                          stroke={
                            progress >= 75 ? "#10b981" : 
                            progress >= 50 ? "#f59e0b" : 
                            "#ef4444"
                          }
                          strokeWidth="3" 
                          strokeDasharray="100" 
                          strokeDashoffset={100 - progress} 
                          strokeLinecap="round"
                          transform="rotate(-90 18 18)"
                        />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 四季度并列显示 - 优化空间和文字大小 */}
      <motion.div
        className="flex-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="rounded-xl overflow-hidden border-0 shadow-md">
          <CardHeader className="py-2 px-3 border-b bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
            <CardTitle className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center">
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-brand-teal"></span>
              季度目标详情
            </CardTitle>
          </CardHeader>
          <div className="grid grid-cols-4 divide-x">
            {["Q1", "Q2", "Q3", "Q4"].map((quarter, quarterIndex) => {
              const quarterData = goalsByQuarters[quarter] || {};
              const hasQuarterData = Object.keys(quarterData).length > 0;
              
              // 季度颜色
              const quarterColors = [
                "after:bg-blue-500",
                "after:bg-green-500", 
                "after:bg-orange-500",
                "after:bg-purple-500"
              ];
              
              // 季度名称
              const quarterNames = ["第一季度", "第二季度", "第三季度", "第四季度"];
              
              return (
                <div key={quarter} className="flex flex-col">
                  <div className={`py-1.5 px-3 bg-gray-50 dark:bg-gray-800 border-b flex items-center justify-center relative after:absolute after:left-0 after:top-0 after:h-full after:w-1 ${quarterColors[quarterIndex]}`}>
                    <h3 className="text-sm font-medium text-center">{quarterNames[quarterIndex]}</h3>
                  </div>
                  
                  {hasQuarterData ? (
                    <div className="divide-y">
                      {Object.keys(goalTypeNames).map((type) => {
                        const progress = calculateProgress(
                          quarterData[type]?.actual || 0,
                          quarterData[type]?.target || 0
                        );
                        
                        const isMonetary = type === 'contracts' || type === 'profit' || type === 'payment';
                        
                        // 获取图标
                        const goalIcons = {
                          leads: "👥",
                          visits: "🤝",
                          prospects: "🎯",
                          contracts: "📝",
                          profit: "💰",
                          payment: "💸"
                        };
                        
                        return (
                          <div 
                            key={`${quarter}-${type}`} 
                            className="py-2 px-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center">
                                <span className="mr-1 text-sm">{goalIcons[type as keyof typeof goalIcons]}</span>
                                <span className={`text-sm font-medium ${goalTypeTextColors[type as keyof typeof goalTypeTextColors]}`}>
                                  {goalTypeNames[type as keyof typeof goalTypeNames]}
                                </span>
                              </div>
                              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                                progress >= 75 ? "bg-green-100 text-green-700" : 
                                progress >= 50 ? "bg-amber-100 text-amber-700" : 
                                "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                              }`}>
                                {progress}%
                              </span>
                            </div>
                            
                            <div className="flex items-baseline justify-between">
                              <div className={`text-base font-bold ${
                                progress >= 75 ? "text-green-600" : 
                                progress >= 50 ? "text-amber-600" : 
                                "text-gray-700 dark:text-gray-300"
                              }`}>
                                {isMonetary ? `¥${formatCurrency(quarterData[type]?.actual || 0)}` : quarterData[type]?.actual || 0}
                              </div>
                              <div className="text-xs text-gray-500">
                                /{isMonetary ? `¥${formatCurrency(quarterData[type]?.target || 0)}` : quarterData[type]?.target || 0}
                              </div>
                            </div>
                            
                            {/* 极简进度条 */}
                            <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className={`h-full ${
                                  progress >= 75 ? "bg-green-500" : 
                                  progress >= 50 ? "bg-yellow-500" : 
                                  "bg-gray-400"
                                }`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-3 px-2">
                      <div className="text-center">
                        <p className="text-gray-400 text-xs mb-1.5">暂无目标数据</p>
                        <Button size="sm" variant="outline" className="text-xs px-2 py-0.5 h-auto">
                          <Plus className="mr-1 h-3 w-3" />
                          添加
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
