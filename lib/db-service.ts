import { openDB } from "idb"
import { getWeekNumber, getWeekRange } from "./date-utils"

// 初始化数据库
export async function initDB() {
  const db = await openDB("salesManagementDB", 1, {
    upgrade(db) {
      // 创建客户表
      if (!db.objectStoreNames.contains("customers")) {
        const customerStore = db.createObjectStore("customers", { keyPath: "id", autoIncrement: true })
        customerStore.createIndex("name", "name", { unique: false })
        customerStore.createIndex("industry", "industry", { unique: false })
        customerStore.createIndex("date", "joinDate", { unique: false })
      }

      // 创建线索表
      if (!db.objectStoreNames.contains("leads")) {
        const leadsStore = db.createObjectStore("leads", { keyPath: "id", autoIncrement: true })
        leadsStore.createIndex("name", "name", { unique: false })
        leadsStore.createIndex("stage", "stage", { unique: false })
        leadsStore.createIndex("date", "date", { unique: false })
      }

      // 创建潜在客户表
      if (!db.objectStoreNames.contains("prospects")) {
        const prospectsStore = db.createObjectStore("prospects", { keyPath: "id", autoIncrement: true })
        prospectsStore.createIndex("name", "name", { unique: false })
        prospectsStore.createIndex("stage", "stage", { unique: false })
        prospectsStore.createIndex("date", "date", { unique: false })
      }

      // 创建目标客户表
      if (!db.objectStoreNames.contains("targets")) {
        const targetsStore = db.createObjectStore("targets", { keyPath: "id", autoIncrement: true })
        targetsStore.createIndex("name", "name", { unique: false })
        targetsStore.createIndex("stage", "stage", { unique: false })
        targetsStore.createIndex("date", "date", { unique: false })
      }

      // 创建计划表
      if (!db.objectStoreNames.contains("plans")) {
        const plansStore = db.createObjectStore("plans", { keyPath: "id", autoIncrement: true })
        plansStore.createIndex("task", "task", { unique: false })
        plansStore.createIndex("date", "date", { unique: false })
        plansStore.createIndex("week", "week", { unique: false })
        plansStore.createIndex("year", "year", { unique: false })
      }

      // 创建目标表
      if (!db.objectStoreNames.contains("goals")) {
        const goalsStore = db.createObjectStore("goals", { keyPath: "id", autoIncrement: true })
        goalsStore.createIndex("name", "name", { unique: false })
        goalsStore.createIndex("progress", "progress", { unique: false })
        goalsStore.createIndex("quarter", "quarter", { unique: false })
      }

      // 创建项目事务表
      if (!db.objectStoreNames.contains("projects")) {
        const projectsStore = db.createObjectStore("projects", { keyPath: "id", autoIncrement: true })
        projectsStore.createIndex("name", "name", { unique: false })
        projectsStore.createIndex("type", "type", { unique: false })
        projectsStore.createIndex("date", "date", { unique: false })
      }

      // 创建拜访记录表
      if (!db.objectStoreNames.contains("visits")) {
        const visitsStore = db.createObjectStore("visits", { keyPath: "id", autoIncrement: true })
        visitsStore.createIndex("customer", "customer", { unique: false })
        visitsStore.createIndex("date", "date", { unique: false })
      }

      // 创建合同表
      if (!db.objectStoreNames.contains("contracts")) {
        const contractsStore = db.createObjectStore("contracts", { keyPath: "id", autoIncrement: true })
        contractsStore.createIndex("customer", "customer", { unique: false })
        contractsStore.createIndex("amount", "amount", { unique: false })
        contractsStore.createIndex("date", "date", { unique: false })
      }
    },
  })

  return db
}

// 通用的CRUD操作
export async function getAll(storeName: string) {
  const db = await initDB()
  return db.getAll(storeName)
}

export async function get(storeName: string, id: number) {
  const db = await initDB()
  return db.get(storeName, id)
}

export async function add(storeName: string, item: any) {
  const db = await initDB()
  return db.add(storeName, item)
}

export async function put(storeName: string, item: any) {
  const db = await initDB()
  return db.put(storeName, item)
}

export async function remove(storeName: string, id: number) {
  const db = await initDB()
  return db.delete(storeName, id)
}

// 查询操作
export async function getByIndex(storeName: string, indexName: string, value: any) {
  const db = await initDB()
  const tx = db.transaction(storeName, "readonly")
  const index = tx.store.index(indexName)
  return index.getAll(value)
}

// 清空所有数据
export async function clearAllData() {
  try {
    const db = await initDB()
    // 获取所有对象存储的名称
    const storeNames = Array.from(db.objectStoreNames)
    
    console.log("准备清空的表:", storeNames)
    
    // 逐个清空每个表
    for (const storeName of storeNames) {
      try {
        console.log(`正在清空表: ${storeName}`)
        const tx = db.transaction(storeName, "readwrite")
        const store = tx.objectStore(storeName)
        await store.clear()
        await tx.done
        console.log(`表 ${storeName} 清空成功`)
      } catch (storeError) {
        console.error(`清空表 ${storeName} 时出错:`, storeError)
        // 继续处理下一个表，不中断整个过程
      }
    }
    
    console.log("所有表清空完成")
    return { success: true, message: "所有数据已清空" }
  } catch (error) {
    console.error("清空数据时出错:", error)
    throw new Error(`清空数据失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// 获取按周查询的计划
export async function getByWeek(storeName: string, year: number, week: number) {
  const db = await initDB()
  const tx = db.transaction(storeName, "readonly")
  const store = tx.objectStore(storeName)
  const items = await store.getAll()

  return items.filter((item) => item.year === year && item.week === week)
}

// 获取所有可用的周
export async function getAllWeeks(storeName: string) {
  const db = await initDB()
  const items = await db.getAll(storeName)

  // 提取所有唯一的年份和周组合
  const weeksSet = new Set()
  const result: Array<{year: number, week: number}> = []

  items.forEach((item) => {
    if (item.year && item.week) {
      const key = `${item.year}-${item.week}`
      if (!weeksSet.has(key)) {
        weeksSet.add(key)
        result.push({ year: item.year, week: item.week })
      }
    }
  })

  // 按年份和周排序
  return result.sort((a, b) => {
    if (a.year !== b.year) {
      return a.year - b.year
    }
    return a.week - b.week
  })
}

// 格式化周显示
export function formatWeekDisplay(year: number, week: number) {
  const { startDate, endDate } = getWeekRange(year, week)
  const startMonth = startDate.getMonth() + 1
  const endMonth = endDate.getMonth() + 1
  const startDay = startDate.getDate()
  const endDay = endDate.getDate()

  return `${year}年第${week}周 (${startMonth}.${startDay}-${endMonth}.${endDay})`
}

// 获取按季度分组的目标数据
export async function getGoalsByQuarters() {
  const db = await initDB()
  const goals = await db.getAll("goals")

  // 按季度分组
  const result: {
    Q1: Record<string, {actual: number, target: number}>,
    Q2: Record<string, {actual: number, target: number}>,
    Q3: Record<string, {actual: number, target: number}>,
    Q4: Record<string, {actual: number, target: number}>
  } = {
    Q1: {},
    Q2: {},
    Q3: {},
    Q4: {},
  }

  goals.forEach((goal: any) => {
    if (goal.quarter && goal.type) {
      if (!result[goal.quarter as keyof typeof result][goal.type]) {
        result[goal.quarter as keyof typeof result][goal.type] = {
          actual: goal.actual || 0,
          target: goal.target || 0,
        }
      }
    }
  })

  return result
}

// 获取目标统计数据
export async function getGoalStats() {
  const db = await initDB()
  const goals = await db.getAll("goals")

  // 按类型分组
  const result: Record<string, {actual: number, target: number}> = {}

  goals.forEach((goal: any) => {
    if (goal.type) {
      if (!result[goal.type]) {
        result[goal.type] = {
          actual: 0,
          target: 0,
        }
      }

      result[goal.type].actual += goal.actual || 0
      result[goal.type].target += goal.target || 0
    }
  })

  return result
}

// 获取按周统计的数据
export async function getWeeklyStats() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentWeek = getWeekNumber(now)

  // 获取本周的开始和结束日期
  const { startDate, endDate } = getWeekRange(currentYear, currentWeek)

  // 获取一周内每天的数据
  const weekDays = []
  const dayNames = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]

  // 创建一周的日期范围
  for (let i = 0; i < 7; i++) {
    const day = new Date(startDate)
    day.setDate(startDate.getDate() + i)
    if (day <= endDate) {
      weekDays.push({
        date: day,
        name: dayNames[i],
      })
    }
  }

  // 获取各类数据
  const db = await initDB()

  // 准备结果数据
  const result = []

  for (const { date, name } of weekDays) {
    // 设置日期范围为当天的0点到23:59:59
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)

    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    // 查询当天创建的线索
    const leadsRange = IDBKeyRange.bound(dayStart, dayEnd)
    const leadsCount = await db.getAllFromIndex("leads", "date", leadsRange).then((items) => items.length)

    // 查询当天创建的潜在客户
    const prospectsCount = await db.getAllFromIndex("prospects", "date", leadsRange).then((items) => items.length)

    // 查询当天的拜访记录
    const visitsCount = await db.getAllFromIndex("visits", "date", leadsRange).then((items) => items.length)

    // 查询当天的电话联系（假设每个线索和潜在客户都有一次电话联系）
    const phoneCallsCount = leadsCount + prospectsCount

    result.push({
      name,
      新增线索: leadsCount,
      新增潜在客户: prospectsCount,
      电话联系: phoneCallsCount,
      拜访数量: visitsCount,
    })
  }

  return result
}

// 获取按月统计的数据
export async function getMonthlyStats() {
  const currentYear = new Date().getFullYear()
  const db = await initDB()

  // 准备结果数据
  const result = []
  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]

  for (let month = 0; month < 12; month++) {
    // 设置月份的开始和结束日期
    const monthStart = new Date(currentYear, month, 1)
    const monthEnd = new Date(currentYear, month + 1, 0, 23, 59, 59, 999)

    // 查询当月创建的线索
    const monthRange = IDBKeyRange.bound(monthStart, monthEnd)
    const leadsCount = await db.getAllFromIndex("leads", "date", monthRange).then((items) => items.length)

    // 查询当月创建的潜在客户
    const prospectsCount = await db.getAllFromIndex("prospects", "date", monthRange).then((items) => items.length)

    // 查询当月的拜访记录
    const visitsCount = await db.getAllFromIndex("visits", "date", monthRange).then((items) => items.length)

    // 查询当月的电话联系（假设每个线索和潜在客户都有一次电话联系）
    const phoneCallsCount = Math.round((leadsCount + prospectsCount) * 1.5) // 假设每个客户平均有1.5次电话联系

    result.push({
      name: monthNames[month],
      新增线索: leadsCount,
      新增潜在客户: prospectsCount,
      电话联系: phoneCallsCount,
      拜访数量: visitsCount,
    })
  }

  return result
}

// 获取按季度统计的数据
export async function getQuarterlyStats() {
  const currentYear = new Date().getFullYear()
  const db = await initDB()

  // 准备结果数据
  const result = []
  const quarters = [
    { name: "Q1", startMonth: 0, endMonth: 2 },
    { name: "Q2", startMonth: 3, endMonth: 5 },
    { name: "Q3", startMonth: 6, endMonth: 8 },
    { name: "Q4", startMonth: 9, endMonth: 11 },
  ]

  for (const quarter of quarters) {
    // 设置季度的开始和结束日期
    const quarterStart = new Date(currentYear, quarter.startMonth, 1)
    const quarterEnd = new Date(currentYear, quarter.endMonth + 1, 0, 23, 59, 59, 999)

    // 查询当季度创建的线索
    const quarterRange = IDBKeyRange.bound(quarterStart, quarterEnd)
    const leadsCount = await db.getAllFromIndex("leads", "date", quarterRange).then((items) => items.length)

    // 查询当季度创建的潜在客户
    const prospectsCount = await db.getAllFromIndex("prospects", "date", quarterRange).then((items) => items.length)

    // 查询当季度的拜访记录
    const visitsCount = await db.getAllFromIndex("visits", "date", quarterRange).then((items) => items.length)

    // 查询当季度的电话联系（假设每个线索和潜在客户都有一次电话联系）
    const phoneCallsCount = Math.round((leadsCount + prospectsCount) * 2) // 假设每个客户平均有2次电话联系

    result.push({
      name: quarter.name,
      新增线索: leadsCount,
      新增潜在客户: prospectsCount,
      电话联系: phoneCallsCount,
      拜访数量: visitsCount,
    })
  }

  return result
}

// 获取按年统计的数据
export async function getYearlyStats() {
  const currentYear = new Date().getFullYear()
  const db = await initDB()

  // 准备结果数据
  const result = []

  // 获取最近4年的数据
  for (let yearOffset = -3; yearOffset <= 0; yearOffset++) {
    const year = currentYear + yearOffset

    // 设置年份的开始和结束日期
    const yearStart = new Date(year, 0, 1)
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999)

    // 查询当年创建的线索
    const yearRange = IDBKeyRange.bound(yearStart, yearEnd)
    const leadsCount = await db.getAllFromIndex("leads", "date", yearRange).then((items) => items.length)

    // 查询当年创建的潜在客户
    const prospectsCount = await db.getAllFromIndex("prospects", "date", yearRange).then((items) => items.length)

    // 查询当年的拜访记录
    const visitsCount = await db.getAllFromIndex("visits", "date", yearRange).then((items) => items.length)

    // 查询当年的电话联系（假设每个线索和潜在客户都有一次电话联系）
    const phoneCallsCount = Math.round((leadsCount + prospectsCount) * 3) // 假设每个客户平均有3次电话联系

    result.push({
      name: year.toString(),
      新增线索: leadsCount,
      新增潜在客户: prospectsCount,
      电话联系: phoneCallsCount,
      拜访数量: visitsCount,
    })
  }

  return result
}

// 获取客户分布数据
export async function getCustomerDistribution() {
  const db = await initDB()

  // 获取各类客户数量
  const leadsCount = await db.count("leads")
  const prospectsCount = await db.count("prospects")
  const targetsCount = await db.count("targets")

  // 获取合同数量（假设已签约的客户）
  const contractsCount = await db.count("contracts")

  // 计算总数
  const total = leadsCount + prospectsCount + targetsCount + contractsCount

  // 如果没有数据，返回空数组
  if (total === 0) {
    return []
  }

  // 计算百分比
  return [
    { name: "商机线索", value: Math.round((leadsCount / total) * 100) },
    { name: "潜在客户", value: Math.round((prospectsCount / total) * 100) },
    { name: "目标客户", value: Math.round((targetsCount / total) * 100) },
    { name: "已签约", value: Math.round((contractsCount / total) * 100) },
  ]
}

// 修改 getReportSummary 函数
export async function getReportSummary(period: string) {
  let data

  switch (period) {
    case "weekly":
      data = await getWeeklyStats()
      break
    case "monthly":
      data = await getMonthlyStats()
      break
    case "quarterly":
      data = await getQuarterlyStats()
      break
    case "yearly":
      data = await getYearlyStats()
      break
    default:
      data = await getWeeklyStats()
  }

  // 获取实际数据统计
  const leadsCount = await getLeadsCount()
  const prospectsCount = await getProspectsCount()
  const visitsCount = await getVisitsCount()
  const phoneCallsCount = await getPhoneCallsCount()
  const contractsAmount = await getContractsAmount()

  // 计算汇总数据
  const summaryData = {
    newLeads: data.reduce((sum, item) => sum + (item["新增线索"] || 0), 0) || leadsCount,
    newProspects: data.reduce((sum, item) => sum + (item["新增潜在客户"] || 0), 0) || prospectsCount,
    phoneCalls: data.reduce((sum, item) => sum + (item["电话联系"] || 0), 0) || phoneCallsCount,
    visits: data.reduce((sum, item) => sum + (item["拜访数量"] || 0), 0) || visitsCount,
    conversionRate: 0,
    potentialValue: 0,
    contractValue: contractsAmount,
  }

  // 计算转化率
  if (summaryData.newLeads > 0) {
    summaryData.conversionRate = Math.round((summaryData.newProspects / summaryData.newLeads) * 100)
  }

  // 计算潜在价值（假设每个线索价值10000元）
  summaryData.potentialValue = Math.round(summaryData.newLeads * 10000)

  return summaryData
}

// 获取按季度分组的合同数据
export async function getContractsByQuarter(quarter: string) {
  const db = await initDB()
  const contracts = await db.getAll("contracts")

  // 根据日期确定季度
  const quarterMap: Record<string, number[]> = {
    Q1: [0, 1, 2], // 1-3月
    Q2: [3, 4, 5], // 4-6月
    Q3: [6, 7, 8], // 7-9月
    Q4: [9, 10, 11], // 10-12月
  }

  // 过滤出指定季度的合同
  const filteredContracts = contracts.filter((contract) => {
    const contractDate = new Date(contract.date)
    const month = contractDate.getMonth()
    return quarterMap[quarter].includes(month)
  })

  return filteredContracts
}

export async function initSampleData() {
  const db = await initDB()

  // 检查是否已经有数据
  const leadsCount = await db.count("leads")
  if (leadsCount > 0) {
    return // 如果已经有数据，则不初始化
  }
  
  // 这里可以添加示例数据初始化代码
  console.log("初始化示例数据");
}

// 获取线索数量统计
export async function getLeadsCount() {
  const db = await initDB()
  return db.count("leads")
}

// 获取合同金额统计
export async function getContractsAmount() {
  const db = await initDB()
  const contracts = await db.getAll("contracts")
  return contracts.reduce((total, contract) => total + (contract.amount || 0), 0)
}

// 获取目标客户数量
export async function getTargetsCount() {
  const db = await initDB()
  return db.count("targets")
}

// 获取潜在客户数量
export async function getProspectsCount() {
  const db = await initDB()
  return db.count("prospects")
}

// 获取拜访数量
export async function getVisitsCount() {
  const db = await initDB()
  return db.count("visits")
}

// 获取电话联系数量（这里假设每个线索和潜在客户都有一次电话联系）
export async function getPhoneCallsCount() {
  const db = await initDB()
  const leadsCount = await db.count("leads")
  const prospectsCount = await db.count("prospects")
  return leadsCount + prospectsCount
}

export { getWeekNumber, getWeekRange }

// 完全删除并重建数据库
export async function deleteAndRebuildDatabase() {
  try {
    console.log("开始删除并重建数据库")
    
    // 删除数据库
    await window.indexedDB.deleteDatabase("salesManagementDB")
    console.log("数据库已删除")
    
    // 重新初始化数据库
    await initDB()
    console.log("数据库已重建")
    
    return { success: true, message: "数据库已成功重建" }
  } catch (error) {
    console.error("删除并重建数据库时出错:", error)
    throw new Error(`重建数据库失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}
