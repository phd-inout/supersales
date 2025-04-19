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
import { Phone, Users, UserPlus, DollarSign, Briefcase, PercentSquare, Award, RefreshCw, DatabaseIcon, WrenchIcon } from "lucide-react"
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
  resetDatabase,
  fixPlansData,
} from "@/lib/db-service"
import { PerformanceWeightsDialog } from "./performance-weights-dialog"
import { Button } from "@/components/ui/button"

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
// 添加图表固定尺寸常量
const CHART_WIDTH = 450; // 图表固定宽度
const CHART_HEIGHT = 240; // 图表固定高度
const PIE_CHART_SIZE = 180; // 饼图最大直径尺寸

// 自定义柱状图颜色
const BAR_COLORS = {
  线索: "#2563eb", // 蓝色
  潜在客户: "#4f46e5", // 靛蓝色
  电话: "#7c3aed", // 紫色
  拜访: "#db2777", // 粉红色
};

// 自定义饼图颜色和样式
const PIE_COLORS = ["#2563eb", "#4f46e5", "#7c3aed", "#db2777", "#06b6d4", "#059669", "#ca8a04", "#dc2626"];

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
    fetchData()
  }, [period])

  // 提取获取数据的逻辑到单独的函数
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

      console.log('刷新数据:', {
        phoneCallsCount,
        visitsCount
      })

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

      // 计算转化率 - 新公式：合同客户数量/(潜在客户数量+线索商机数量)
      const contractsCount = await getContractsAmount(); // 获取合同数量，代表已转化的客户
      const totalLeadsAndProspects = summary.newLeads + summary.newProspects;
      
      if (totalLeadsAndProspects > 0) {
        summary.conversionRate = Math.round((contractsCount / totalLeadsAndProspects) * 100);
      }
    } catch (err: any) {
      console.error("Error fetching report data:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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

  // 计算柱状图显示量
  const getDataForBarChart = () => {
    // 限制最多显示6条数据
    const limitedData = [...currentData];
    if (limitedData.length > 6) {
      limitedData.splice(0, limitedData.length - 6);
    }
    return limitedData;
  }

  const performanceResult = calculatePerformanceScore()
  const barChartData = getDataForBarChart()

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
            Sales Report
          </motion.h1>
          <PerformanceWeightsDialog weights={weights} onWeightsChange={setWeights} />
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2 rounded-full h-8 w-8 p-0" 
            onClick={() => fetchData()}
            title="刷新数据"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2 rounded-full h-8 w-8 p-0" 
            onClick={async () => {
              if (confirm("确定要重置数据库吗？这将重置数据库结构，但会尝试保留您的数据。")) {
                setLoading(true);
                try {
                  const result = await resetDatabase();
                  alert(result.message);
                  await fetchData();
                } catch (error) {
                  alert("重置数据库失败，请查看控制台获取详细信息");
                  console.error(error);
                } finally {
                  setLoading(false);
                }
              }
            }}
            title="重置数据库"
          >
            <DatabaseIcon className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2 rounded-full h-8 w-8 p-0" 
            onClick={async () => {
              setLoading(true);
              try {
                const result = await fixPlansData();
                alert(result.message);
                await fetchData();
              } catch (error) {
                alert("修复计划数据失败，请查看控制台获取详细信息");
                console.error(error);
              } finally {
                setLoading(false);
              }
            }}
            title="修复计划数据"
          >
            <WrenchIcon className="h-4 w-4" />
          </Button>
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
              <CardTitle className="text-xs font-medium">客户转化率</CardTitle>
              <div className="stat-icon">
                <PercentSquare className="h-3 w-3" />
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <div className="text-xl font-bold">{summaryData.conversionRate}%</div>
              <p className="text-xs text-muted-foreground mt-0.5">客户数量/(线索+潜在客户数量)</p>
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
              <p className="text-xs text-muted-foreground mt-0.5">线索和潜在客户的商机总金额</p>
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
              <p className="text-xs text-muted-foreground mt-0.5">客户和已签约合同的总金额</p>
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
            <CardContent className="p-3 flex-1 flex items-center justify-center">
              {currentData.length > 0 ? (
                <div style={{ width: CHART_WIDTH, height: CHART_HEIGHT }} className="mx-auto">
                  <BarChart 
                    width={CHART_WIDTH} 
                    height={CHART_HEIGHT} 
                    data={barChartData}
                    margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
                    barGap={4}
                    barCategoryGap={8}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 9 }} 
                      height={20}
                      tickLine={false}
                      axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 9 }} 
                      domain={[0, 'auto']} 
                      width={30}
                      tickLine={false}
                      axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        borderRadius: "6px",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                        border: "none",
                        fontSize: "9px",
                        padding: "6px"
                      }}
                      cursor={{ fill: 'rgba(240, 240, 240, 0.3)' }}
                    />
                    <Legend 
                      iconSize={6} 
                      wrapperStyle={{ fontSize: 9 }}
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      height={20}
                    />
                    <Bar 
                      dataKey="新增线索" 
                      fill={BAR_COLORS.线索}
                      radius={[2, 2, 0, 0]} 
                      name="新增线索"
                      maxBarSize={18}
                    />
                    <Bar 
                      dataKey="新增潜在客户" 
                      fill={BAR_COLORS.潜在客户}
                      radius={[2, 2, 0, 0]} 
                      name="新增潜在客户"
                      maxBarSize={18}
                    />
                    {/* 添加额外的数据指标，使用堆叠方式展示 */}
                    <Bar 
                      dataKey="电话联系" 
                      fill={BAR_COLORS.电话}
                      radius={[2, 2, 0, 0]} 
                      name="电话联系"
                      maxBarSize={18}
                      stackId="a"
                    />
                    <Bar 
                      dataKey="拜访数量" 
                      fill={BAR_COLORS.拜访}
                      radius={[2, 2, 0, 0]} 
                      name="拜访数量"
                      maxBarSize={18}
                      stackId="a"
                    />
                  </BarChart>
                </div>
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
            <CardContent className="p-3 flex-1 flex items-center justify-center">
              {pieData.length > 0 ? (
                <div style={{ width: CHART_WIDTH, height: CHART_HEIGHT }} className="mx-auto">
                  <PieChart
                    width={CHART_WIDTH}
                    height={CHART_HEIGHT}
                  >
                    <Pie
                      data={pieData}
                      cx={CHART_WIDTH / 2}
                      cy={CHART_HEIGHT / 2 - 15}
                      labelLine={false}
                      innerRadius={PIE_CHART_SIZE * 0.3}
                      outerRadius={PIE_CHART_SIZE * 0.5}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => {
                        return percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : '';
                      }}
                    >
                      {pieData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={PIE_COLORS[index % PIE_COLORS.length]} 
                          stroke="rgba(255,255,255,0.5)"
                          strokeWidth={1}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        borderRadius: "6px",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                        border: "none",
                        fontSize: "9px",
                        padding: "6px"
                      }}
                      formatter={(value: any, name) => {
                        const total = pieData.reduce((sum, item) => sum + item.value, 0);
                        const percentage = ((value as number) / total * 100).toFixed(1);
                        return [`${value} (${percentage}%)`, name];
                      }}
                    />
                    <Legend 
                      iconSize={6} 
                      wrapperStyle={{ fontSize: 9 }}
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      height={20}
                    />
                  </PieChart>
                </div>
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
