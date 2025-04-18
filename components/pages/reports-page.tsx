"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Phone, Users, UserPlus, DollarSign, Briefcase, PercentSquare, Award } from "lucide-react"
import { motion } from "framer-motion"
import {
  getWeeklyStats,
  getMonthlyStats,
  getQuarterlyStats,
  getYearlyStats,
  getCustomerDistribution,
  getReportSummary,
  getLeadsCount,
  getContractsAmount,
  getTargetsCount,
  getProspectsCount,
  getVisitsCount,
  getPhoneCallsCount,
} from "@/lib/db-service"
import { PerformanceWeightsDialog } from "./performance-weights-dialog"

const COLORS = ["#2563eb", "#4f46e5", "#7c3aed", "#db2777"]

// 添加类型定义
interface PeriodData {
  name: string;
  新增线索: number;
  新增潜在客户: number;
  电话联系: number;
  拜访数量: number;
}

interface PieChartData {
  name: string;
  value: number;
}

// 添加PPT相关尺寸常量
const PPT_ASPECT_RATIO = 16 / 9; // PPT 16:9宽高比

export function ReportsPage() {
  const [period, setPeriod] = useState("weekly")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 状态管理
  const [currentData, setCurrentData] = useState<PeriodData[]>([])
  const [summaryData, setSummaryData] = useState({
    newLeads: 0,
    newProspects: 0,
    phoneCalls: 0,
    visits: 0,
    conversionRate: 0,
    potentialValue: 0,
    contractValue: 0,
  })
  const [pieData, setPieData] = useState<PieChartData[]>([])
  const [weights, setWeights] = useState({
    leads: 0.15, // 线索权重
    prospects: 0.15, // 潜在客户权重
    visits: 0.1, // 拜访权重
    phoneCalls: 0.1, // 电话联系权重
    contracts: 0.25, // 合同金额权重
    profit: 0.25, // 利润权重
  })

  // 添加新的状态变量来存储实际数据
  const [actualData, setActualData] = useState({
    leadsCount: 0,
    prospectsCount: 0,
    targetsCount: 0,
    visitsCount: 0,
    phoneCallsCount: 0,
    contractsAmount: 0,
  })

  // 加载数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // 获取当前周期的数据
        let periodData
        switch (period) {
          case "weekly":
            periodData = await getWeeklyStats()
            break
          case "monthly":
            periodData = await getMonthlyStats()
            break
          case "quarterly":
            periodData = await getQuarterlyStats()
            break
          case "yearly":
            periodData = await getYearlyStats()
            break
          default:
            periodData = await getWeeklyStats()
        }

        // 获取汇总数据
        const summary = await getReportSummary(period)

        // 获取饼图数据
        const distribution = await getCustomerDistribution()

        // 获取实际数据统计
        const leadsCount = await getLeadsCount()
        const prospectsCount = await getProspectsCount()
        const targetsCount = await getTargetsCount()
        const visitsCount = await getVisitsCount()
        const phoneCallsCount = await getPhoneCallsCount()
        const contractsAmount = await getContractsAmount()

        // 更新状态
        setCurrentData(periodData)
        setSummaryData(summary)
        setPieData(distribution)
        setActualData({
          leadsCount,
          prospectsCount,
          targetsCount,
          visitsCount,
          phoneCallsCount,
          contractsAmount,
        })
      } catch (err: any) {
        console.error("Error fetching report data:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [period])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  if (loading) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="text-red-500">
          <p>加载数据时出错：{error}</p>
          <button className="mt-4 px-4 py-2 bg-primary text-white rounded-md" onClick={() => window.location.reload()}>
            重试
          </button>
        </div>
      </div>
    )
  }

  // 修改 calculatePerformanceScore 函数，使用实际数据
  const calculatePerformanceScore = () => {
    if (!summaryData) return { score: 0, grade: "N/A" }

    // 设置目标值（这些可以从数据库中获取或设置为固定值）
    const leadsTarget = Math.max(actualData.leadsCount * 1.2, 10) // 目标比当前高20%，至少10
    const prospectsTarget = Math.max(actualData.prospectsCount * 1.2, 5) // 目标比当前高20%，至少5
    const phoneCallsTarget = Math.max(actualData.phoneCallsCount * 1.2, 20) // 目标比当前高20%，至少20
    const visitsTarget = Math.max(actualData.visitsCount * 1.2, 10) // 目标比当前高20%，至少10
    const contractsTarget = Math.max(actualData.contractsAmount * 1.2, 500000) // 目标比当前高20%，至少50万
    const profitTarget = contractsTarget * 0.3 // 假设利润是合同额的30%

    // 计算每个指标的完成率（上限为100%）
    const leadsRate = Math.min(summaryData.newLeads / leadsTarget, 1)
    const prospectsRate = Math.min(summaryData.newProspects / prospectsTarget, 1)
    const phoneCallsRate = Math.min(summaryData.phoneCalls / phoneCallsTarget, 1)
    const visitsRate = Math.min(summaryData.visits / visitsTarget, 1)
    const contractsRate = Math.min(summaryData.contractValue / contractsTarget, 1)
    const profitRate = Math.min(summaryData.potentialValue / profitTarget, 1)

    // 根据权重计算总分（满分100）
    const score = Math.round(
      (leadsRate * weights.leads +
        prospectsRate * weights.prospects +
        phoneCallsRate * weights.phoneCalls +
        visitsRate * weights.visits +
        contractsRate * weights.contracts +
        profitRate * weights.profit) *
        100,
    )

    // 根据分数确定等级
    let grade = "C"
    if (score >= 90) grade = "A+"
    else if (score >= 85) grade = "A"
    else if (score >= 80) grade = "A-"
    else if (score >= 75) grade = "B+"
    else if (score >= 70) grade = "B"
    else if (score >= 65) grade = "B-"
    else if (score >= 60) grade = "C+"
    else if (score >= 50) grade = "C"
    else grade = "D"

    return { score, grade }
  }

  const performanceResult = calculatePerformanceScore()

  return (
    <div className="p-4 h-full flex flex-col" style={{ aspectRatio: PPT_ASPECT_RATIO, maxWidth: '100%', margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <motion.h1
            className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-brand-indigo bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            活动概述
          </motion.h1>
          <PerformanceWeightsDialog weights={weights} onWeightsChange={setWeights} />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Tabs value={period} onValueChange={setPeriod} className="w-[350px]">
            <TabsList className="grid grid-cols-4 p-1">
              <TabsTrigger value="weekly" className="rounded-md text-xs">
                周
              </TabsTrigger>
              <TabsTrigger value="monthly" className="rounded-md text-xs">
                月
              </TabsTrigger>
              <TabsTrigger value="quarterly" className="rounded-md text-xs">
                季度
              </TabsTrigger>
              <TabsTrigger value="yearly" className="rounded-md text-xs">
                年
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>
      </div>

      <motion.div className="grid gap-3 grid-cols-4 mb-3 page-content" variants={container} initial="hidden" animate="show">
        <motion.div variants={item}>
          <Card className="overflow-hidden h-[130px]">
            <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-2">
              <CardTitle className="text-xs font-medium">新增线索数量</CardTitle>
              <div className="stat-icon">
                <UserPlus className="h-3 w-3" />
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="text-xl font-bold">{summaryData.newLeads}</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {period === "weekly"
                  ? "本周"
                  : period === "monthly"
                    ? "本月"
                    : period === "quarterly"
                      ? "本季度"
                      : "本年"}
                新增线索总数
              </p>
              <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-brand-blue rounded-full" style={{ width: "75%" }}></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="overflow-hidden h-[130px]">
            <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-2">
              <CardTitle className="text-xs font-medium">新增潜在客户</CardTitle>
              <div className="stat-icon">
                <Users className="h-3 w-3" />
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="text-xl font-bold">{summaryData.newProspects}</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {period === "weekly"
                  ? "本周"
                  : period === "monthly"
                    ? "本月"
                    : period === "quarterly"
                      ? "本季度"
                      : "本年"}
                新增潜在客户总数
              </p>
              <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-brand-indigo rounded-full" style={{ width: "60%" }}></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="overflow-hidden h-[130px]">
            <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-2">
              <CardTitle className="text-xs font-medium">电话联系</CardTitle>
              <div className="stat-icon">
                <Phone className="h-3 w-3" />
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="text-xl font-bold">{summaryData.phoneCalls}</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {period === "weekly"
                  ? "本周"
                  : period === "monthly"
                    ? "本月"
                    : period === "quarterly"
                      ? "本季度"
                      : "本年"}
                电话联系总数
              </p>
              <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-brand-purple rounded-full" style={{ width: "85%" }}></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="overflow-hidden h-[130px]">
            <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-2">
              <CardTitle className="text-xs font-medium">拜访数量</CardTitle>
              <div className="stat-icon">
                <Briefcase className="h-3 w-3" />
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="text-xl font-bold">{summaryData.visits}</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {period === "weekly"
                  ? "本周"
                  : period === "monthly"
                    ? "本月"
                    : period === "quarterly"
                      ? "本季度"
                      : "本年"}
                拜访总数
              </p>
              <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-brand-pink rounded-full" style={{ width: "45%" }}></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="overflow-hidden h-[130px]">
            <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-2">
              <CardTitle className="text-xs font-medium">潜在客户转化率</CardTitle>
              <div className="stat-icon">
                <PercentSquare className="h-3 w-3" />
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <div className="text-xl font-bold">{summaryData.conversionRate}%</div>
              <p className="text-xs text-muted-foreground mt-0.5">新增潜在客户/新增线索</p>
              <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-teal rounded-full"
                  style={{ width: `${summaryData.conversionRate}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="overflow-hidden h-[130px]">
            <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-2">
              <CardTitle className="text-xs font-medium">线索商机金额</CardTitle>
              <div className="stat-icon">
                <DollarSign className="h-3 w-3" />
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <div className="text-xl font-bold">¥{summaryData.potentialValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-0.5">预估潜在商机总金额</p>
              <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-brand-green rounded-full" style={{ width: "65%" }}></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="overflow-hidden h-[130px]">
            <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-2">
              <CardTitle className="text-xs font-medium">合同金额</CardTitle>
              <div className="stat-icon">
                <DollarSign className="h-3 w-3" />
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <div className="text-xl font-bold">¥{summaryData.contractValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-0.5">预估合同总金额</p>
              <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-brand-amber rounded-full" style={{ width: "70%" }}></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="overflow-hidden h-[130px]">
            <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-2">
              <CardTitle className="text-xs font-medium">业绩自评</CardTitle>
              <div className="stat-icon">
                <Award className="h-3 w-3" />
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <div className="text-xl font-bold">{performanceResult.grade}</div>
              <p className="text-xs text-muted-foreground mt-0.5">得分: {performanceResult.score}分</p>
              <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-red rounded-full"
                  style={{ width: `${performanceResult.score}%` }}
                ></div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">基于目标完成率和权重计算</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex-1 page-content"
      >
        <div className="grid grid-cols-2 gap-3 h-full">
          {/* 转化趋势图 */}
          <Card className="overflow-hidden h-full flex flex-col">
            <CardHeader className="bg-gradient-to-r from-brand-purple/5 to-brand-pink/5 p-2">
              <CardTitle className="text-sm">转化率趋势图</CardTitle>
            </CardHeader>
            <CardContent className="p-3 flex-1">
              {currentData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300} className="pt-2 px-2">
                  <BarChart data={currentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 'auto']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        border: "none",
                        fontSize: "10px",
                      }}
                    />
                    <Legend 
                      iconSize={8} 
                      wrapperStyle={{ fontSize: 10 }}
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                    />
                    <Bar dataKey="新增线索" fill="#2563eb" radius={[4, 4, 0, 0]} name="新增线索" />
                    <Bar dataKey="新增潜在客户" fill="#4f46e5" radius={[4, 4, 0, 0]} name="新增潜在客户" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">暂无数据</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 客户分布图 */}
          <Card className="overflow-hidden h-full flex flex-col">
            <CardHeader className="bg-gradient-to-r from-brand-teal/5 to-brand-green/5 p-2">
              <CardTitle className="text-sm">客户分布</CardTitle>
            </CardHeader>
            <CardContent className="p-3 flex-1">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300} className="pt-2 px-2">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="40%"
                      labelLine={false}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        border: "none",
                        fontSize: "10px",
                      }}
                    />
                    <Legend 
                      iconSize={8} 
                      wrapperStyle={{ fontSize: 10 }}
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">暂无数据</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}
