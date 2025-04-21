import { openDB } from "idb"
import { getWeekNumber, getWeekRange } from "./date-utils"

// 初始化数据库
export async function initDB() {
  const db = await openDB("salesManagementDB", 3, {
    upgrade(db, oldVersion, newVersion) {
      console.log(`数据库升级: 从版本 ${oldVersion} 到 ${newVersion}`);
      
      // 创建/升级所有表
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
        plansStore.createIndex("type", "type", { unique: false })
      } else if (oldVersion < 2) {
        // 在版本2中添加type索引
        try {
          // 不再尝试在升级时添加索引，改为使用fixPlansData函数来修复数据
          console.log("数据库版本升级到2，请使用修复工具按钮来修复已有的计划数据");
        } catch (error) {
          console.error("升级plans表时出错:", error);
        }
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
      
      // 创建用户设置表
      if (!db.objectStoreNames.contains("userSettings")) {
        const userSettingsStore = db.createObjectStore("userSettings", { keyPath: "id", autoIncrement: true })
        userSettingsStore.createIndex("companyName", "companyName", { unique: false })
        userSettingsStore.createIndex("userName", "userName", { unique: false })
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
  const currentYear = new Date().getFullYear()

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

  // 预先设置所有季度默认目标类型
  const goalTypes = ["leads", "visits", "prospects", "contracts", "profit", "payment"]
  for (const quarter of ["Q1", "Q2", "Q3", "Q4"]) {
    for (const type of goalTypes) {
      result[quarter as keyof typeof result][type] = {
        actual: 0,
        target: 0
      }
    }
  }

  // 设置目标值
  goals.forEach((goal: any) => {
    if (goal.quarter && goal.type) {
      if (result[goal.quarter as keyof typeof result][goal.type]) {
        result[goal.quarter as keyof typeof result][goal.type].target = goal.target || 0
      }
    }
  })

  // 获取实际完成情况的数据
  // 1. 获取所有需要的数据
  const allLeads = await db.getAll("leads")
  const allProspects = await db.getAll("prospects")
  const allVisits = await db.getAll("visits")
  const allCustomers = await db.getAll("customers") // 正式客户数据
  const allContracts = await db.getAll("contracts") // 合同数据
  const allPlans = await db.getAll("plans")
  const allProjects = await db.getAll("projects")

  // 2. 根据季度范围筛选数据并计算实际值
  // 定义季度日期范围
  const quarterDateRanges = {
    Q1: {
      start: new Date(currentYear, 0, 1),
      end: new Date(currentYear, 2, 31, 23, 59, 59, 999)
    },
    Q2: {
      start: new Date(currentYear, 3, 1),
      end: new Date(currentYear, 5, 30, 23, 59, 59, 999)
    },
    Q3: {
      start: new Date(currentYear, 6, 1),
      end: new Date(currentYear, 8, 30, 23, 59, 59, 999)
    },
    Q4: {
      start: new Date(currentYear, 9, 1),
      end: new Date(currentYear, 11, 31, 23, 59, 59, 999)
    }
  }

  // 为每个季度计算实际数据
  for (const [quarter, dateRange] of Object.entries(quarterDateRanges)) {
    // 按日期筛选
    const quarterLeads = allLeads.filter(lead => {
      const leadDate = new Date(lead.date)
      return leadDate >= dateRange.start && leadDate <= dateRange.end
    })

    const quarterProspects = allProspects.filter(prospect => {
      const prospectDate = new Date(prospect.date)
      return prospectDate >= dateRange.start && prospectDate <= dateRange.end
    })

    const quarterVisits = allVisits.filter(visit => {
      const visitDate = new Date(visit.date)
      return visitDate >= dateRange.start && visitDate <= dateRange.end
    })

    // 还需要计算计划和项目中的拜访
    const quarterVisitPlans = allPlans.filter(plan => {
      const planDate = new Date(plan.date)
      return planDate >= dateRange.start && planDate <= dateRange.end && 
             plan.type === "拜访" && plan.completed
    })

    const quarterVisitProjects = allProjects.filter(project => {
      const projectDate = new Date(project.date)
      return projectDate >= dateRange.start && projectDate <= dateRange.end && 
             project.type === "拜访"
    })

    // 计算客户数据 - 使用客户的加入时间判断季度
    const quarterCustomers = allCustomers.filter(customer => {
      const joinDate = new Date(customer.joinDate)
      return joinDate >= dateRange.start && joinDate <= dateRange.end
    })

    // 计算各类指标的实际值
    const leadsCount = quarterLeads.length
    const prospectsCount = quarterProspects.length
    const visitsCount = quarterVisits.length + quarterVisitPlans.length + quarterVisitProjects.length

    // 从合同表获取所有合同
    const allContracts = await db.getAll("contracts")
    
    // 计算合同金额总计 - 使用所有客户的合同金额总和
    const quarterContractsAmount = allContracts.reduce((sum, contract: any) => {
      // 尝试获取合同日期
      const contractDate = contract.date ? new Date(contract.date) : null
      
      // 如果合同有日期且在当前季度范围内，则计入本季度，否则不计入
      if (contractDate && contractDate >= dateRange.start && contractDate <= dateRange.end) {
        const amount = typeof contract.amount === 'number' ? contract.amount : 
                       (Number.parseFloat(contract.amount) || 0);
        return sum + amount;
      }
      return sum;
    }, 0);

    // 假设利润是合同金额的30%
    const profitAmount = quarterContractsAmount * 0.3;

    // 假设回款是合同金额的70%
    const paymentAmount = quarterContractsAmount * 0.7;

    // 更新实际值
    result[quarter as keyof typeof result]["leads"].actual = leadsCount;
    result[quarter as keyof typeof result]["prospects"].actual = prospectsCount;
    result[quarter as keyof typeof result]["visits"].actual = visitsCount;
    result[quarter as keyof typeof result]["contracts"].actual = quarterContractsAmount;
    result[quarter as keyof typeof result]["profit"].actual = profitAmount;
    result[quarter as keyof typeof result]["payment"].actual = paymentAmount;
  }

  console.log("按季度计算的目标数据:", result)
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

  console.log("生成周数据范围:", {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    daysCount: weekDays.length
  });

  // 预先获取所有可能需要的数据
  const allPlans = await db.getAll("plans")
  const allProjects = await db.getAll("projects")
  const allLeads = await db.getAll("leads")
  const allProspects = await db.getAll("prospects")
  const allVisits = await db.getAll("visits")

  for (const { date, name } of weekDays) {
    // 设置日期范围为当天的0点到23:59:59
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)

    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    // 直接过滤内存中的数据，而不是多次查询数据库
    
    // 当天创建的线索
    const dayLeads = allLeads.filter(lead => {
      const leadDate = new Date(lead.date)
      return leadDate >= dayStart && leadDate <= dayEnd
    })
    const leadsCount = dayLeads.length
    
    // 当天创建的潜在客户
    const dayProspects = allProspects.filter(prospect => {
      const prospectDate = new Date(prospect.date)
      return prospectDate >= dayStart && prospectDate <= dayEnd
    })
    const prospectsCount = dayProspects.length
    
    // 当天的拜访记录
    const dayVisits = allVisits.filter(visit => {
      const visitDate = new Date(visit.date)
      return visitDate >= dayStart && visitDate <= dayEnd
    })
    const visitsCount = dayVisits.length
    
    // 过滤当天的拜访计划（已完成）
    const dayPlansCount = allPlans.filter(plan => {
      const planDate = new Date(plan.date)
      return planDate >= dayStart && planDate <= dayEnd && plan.type === "拜访" && plan.completed
    }).length
    
    // 过滤当天的拜访项目事务
    const dayProjectsCount = allProjects.filter(project => {
      const projectDate = new Date(project.date)
      return projectDate >= dayStart && projectDate <= dayEnd && project.type === "拜访"
    }).length
    
    // 总拜访数
    const totalVisitsCount = visitsCount + dayPlansCount + dayProjectsCount

    // 查询当天类型为电话的计划和项目事务
    const phonePlansCount = allPlans.filter(plan => {
      const planDate = new Date(plan.date)
      return planDate >= dayStart && planDate <= dayEnd && plan.type === "电话" && plan.completed
    }).length
    
    const phoneProjectsCount = allProjects.filter(project => {
      const projectDate = new Date(project.date)
      return projectDate >= dayStart && projectDate <= dayEnd && project.type === "电话"
    }).length
    
    // 总电话联系数
    const totalPhoneCallsCount = phonePlansCount + phoneProjectsCount

    result.push({
      name,
      新增线索: leadsCount,
      新增潜在客户: prospectsCount,
      电话联系: totalPhoneCallsCount,
      拜访数量: totalVisitsCount,
    })
  }

  console.log("周统计数据:", result);
  return result
}

// 获取按月统计的数据
export async function getMonthlyStats() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const db = await initDB()

  // 准备结果数据
  const result = []
  
  // 当前月份的周数
  const currentMonthWeeks = getMonthWeeks(currentYear, currentMonth)
  
  console.log("生成月数据范围:", {
    year: currentYear,
    month: currentMonth + 1,
    weeksCount: currentMonthWeeks.length
  });
  
  // 预先获取所有可能需要的数据
  const allPlans = await db.getAll("plans")
  const allProjects = await db.getAll("projects")
  const allLeads = await db.getAll("leads")
  const allProspects = await db.getAll("prospects")
  const allVisits = await db.getAll("visits")

  // 计算每周的数据
  for (let i = 0; i < currentMonthWeeks.length; i++) {
    const { startDate, endDate } = currentMonthWeeks[i]
    
    // 当周创建的线索
    const weekLeads = allLeads.filter(lead => {
      const leadDate = new Date(lead.date)
      return leadDate >= startDate && leadDate <= endDate
    })
    const leadsCount = weekLeads.length
    
    // 当周创建的潜在客户
    const weekProspects = allProspects.filter(prospect => {
      const prospectDate = new Date(prospect.date)
      return prospectDate >= startDate && prospectDate <= endDate
    })
    const prospectsCount = weekProspects.length
    
    // 当周的拜访记录
    const weekVisits = allVisits.filter(visit => {
      const visitDate = new Date(visit.date)
      return visitDate >= startDate && visitDate <= endDate
    })
    const visitsCount = weekVisits.length
    
    // 过滤当周的拜访计划（已完成）
    const weekPlansCount = allPlans.filter(plan => {
      const planDate = new Date(plan.date)
      return planDate >= startDate && planDate <= endDate && plan.type === "拜访" && plan.completed
    }).length
    
    // 过滤当周的拜访项目事务
    const weekProjectsCount = allProjects.filter(project => {
      const projectDate = new Date(project.date)
      return projectDate >= startDate && projectDate <= endDate && project.type === "拜访"
    }).length
    
    // 总拜访数
    const totalVisitsCount = visitsCount + weekPlansCount + weekProjectsCount

    // 查询当周类型为电话的计划和项目事务
    const phonePlansCount = allPlans.filter(plan => {
      const planDate = new Date(plan.date)
      return planDate >= startDate && planDate <= endDate && plan.type === "电话" && plan.completed
    }).length
    
    const phoneProjectsCount = allProjects.filter(project => {
      const projectDate = new Date(project.date)
      return projectDate >= startDate && projectDate <= endDate && project.type === "电话"
    }).length
    
    // 总电话联系数
    const totalPhoneCallsCount = phonePlansCount + phoneProjectsCount
    
    result.push({
      name: `第${i+1}周`,
      新增线索: leadsCount,
      新增潜在客户: prospectsCount,
      电话联系: totalPhoneCallsCount,
      拜访数量: totalVisitsCount,
    })
  }
  
  console.log("月统计数据:", result);
  return result
}

// 辅助函数：获取指定月份的所有周
function getMonthWeeks(year: number, month: number) {
  const weeks = []
  
  // 获取月份的第一天
  const firstDay = new Date(year, month, 1)
  
  // 获取月份的最后一天
  const lastDay = new Date(year, month + 1, 0)
  
  // 获取第一周的开始（周一）
  const firstWeekStart = new Date(firstDay)
  const firstDayOfWeek = firstDay.getDay() || 7 // 将周日(0)转换为7
  firstWeekStart.setDate(firstDay.getDate() - firstDayOfWeek + 1) // 调整到本周一
  
  // 计算所有周
  let currentWeekStart = new Date(firstWeekStart)
  
  while (currentWeekStart <= lastDay) {
    // 计算本周结束（周日）
    const currentWeekEnd = new Date(currentWeekStart)
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6)
    
    // 添加本周
    weeks.push({
      startDate: new Date(currentWeekStart),
      endDate: new Date(Math.min(currentWeekEnd.getTime(), lastDay.getTime()))
    })
    
    // 移动到下一周
    currentWeekStart.setDate(currentWeekStart.getDate() + 7)
  }
  
  return weeks
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

    // 查询当季度类型为拜访的计划和项目事务
    const plans = await db.getAll("plans")
    const projects = await db.getAll("projects")
    
    // 过滤当季度的拜访计划（已完成）
    const quarterPlans = plans.filter(plan => {
      const planDate = new Date(plan.date)
      return planDate >= quarterStart && planDate <= quarterEnd && plan.type === "拜访" && plan.completed
    }).length
    
    // 过滤当季度的拜访项目事务
    const quarterProjects = projects.filter(project => {
      const projectDate = new Date(project.date)
      return projectDate >= quarterStart && projectDate <= quarterEnd && project.type === "拜访"
    }).length
    
    // 总拜访数
    const totalVisitsCount = visitsCount + quarterPlans + quarterProjects

    // 查询当季度类型为电话的计划和项目事务
    const phonePlans = plans.filter(plan => {
      const planDate = new Date(plan.date)
      return planDate >= quarterStart && planDate <= quarterEnd && plan.type === "电话" && plan.completed
    }).length
    
    const phoneProjects = projects.filter(project => {
      const projectDate = new Date(project.date)
      return projectDate >= quarterStart && projectDate <= quarterEnd && project.type === "电话"
    }).length
    
    // 总电话联系数
    const totalPhoneCallsCount = phonePlans + phoneProjects

    result.push({
      name: quarter.name,
      新增线索: leadsCount,
      新增潜在客户: prospectsCount,
      电话联系: totalPhoneCallsCount,
      拜访数量: totalVisitsCount,
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

    // 查询当年类型为拜访的计划和项目事务
    const plans = await db.getAll("plans")
    const projects = await db.getAll("projects")
    
    // 过滤当年的拜访计划（已完成）
    const yearPlans = plans.filter(plan => {
      const planDate = new Date(plan.date)
      return planDate >= yearStart && planDate <= yearEnd && plan.type === "拜访" && plan.completed
    }).length
    
    // 过滤当年的拜访项目事务
    const yearProjects = projects.filter(project => {
      const projectDate = new Date(project.date)
      return projectDate >= yearStart && projectDate <= yearEnd && project.type === "拜访"
    }).length
    
    // 总拜访数
    const totalVisitsCount = visitsCount + yearPlans + yearProjects

    // 查询当年类型为电话的计划和项目事务
    const phonePlans = plans.filter(plan => {
      const planDate = new Date(plan.date)
      return planDate >= yearStart && planDate <= yearEnd && plan.type === "电话" && plan.completed
    }).length
    
    const phoneProjects = projects.filter(project => {
      const projectDate = new Date(project.date)
      return projectDate >= yearStart && projectDate <= yearEnd && project.type === "电话"
    }).length
    
    // 总电话联系数
    const totalPhoneCallsCount = phonePlans + phoneProjects

    result.push({
      name: year.toString(),
      新增线索: leadsCount,
      新增潜在客户: prospectsCount,
      电话联系: totalPhoneCallsCount,
      拜访数量: totalVisitsCount,
    })
  }

  return result
}

// 用户设置相关操作
export async function getUserSettings() {
  try {
    const db = await initDB()
    // 获取所有用户设置记录
    const settings = await db.getAll("userSettings")
    
    // 如果有设置记录，返回最新的一条
    if (settings && settings.length > 0) {
      return settings[settings.length - 1]
    }
    
    // 如果没有记录，返回默认设置
    return {
      companyName: "超级销售管理系统",
      userName: "销售经理"
    }
  } catch (error) {
    console.error("获取用户设置时出错:", error)
    // 出错时返回默认设置
    return {
      companyName: "超级销售管理系统",
      userName: "销售经理"
    }
  }
}

export async function saveUserSettings(settings: { companyName: string; userName: string }) {
  try {
    const db = await initDB()
    
    // 获取现有设置
    const existingSettings = await db.getAll("userSettings")
    
    if (existingSettings && existingSettings.length > 0) {
      // 如果有现有设置，更新最新的一条
      const latestSetting = existingSettings[existingSettings.length - 1]
      await db.put("userSettings", { ...settings, id: latestSetting.id })
      return latestSetting.id
    } else {
      // 如果没有现有设置，创建新记录
      return await db.add("userSettings", settings)
    }
  } catch (error) {
    console.error("保存用户设置时出错:", error)
    throw error
  }
}

// 获取客户分布数据
export async function getCustomerDistribution() {
  const db = await initDB()

  // 获取各类客户数量 - 使用正确的数据源
  const leadsCount = await db.count("leads")
  const prospectsCount = await db.count("prospects")
  const customersCount = await db.count("customers") // 改为从customers表获取正式客户数量

  // 计算总数
  const total = leadsCount + prospectsCount + customersCount

  // 如果没有数据，返回空数组
  if (total === 0) {
    return []
  }

  // 计算百分比 - 正确区分三种类型
  return [
    { name: "商机线索", value: Math.round((leadsCount / total) * 100) },
    { name: "潜在客户", value: Math.round((prospectsCount / total) * 100) },
    { name: "正式客户", value: Math.round((customersCount / total) * 100) },
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
  const targetsCount = await getTargetsCount()
  const visitsCount = await getVisitsCount()
  const phoneCallsCount = await getPhoneCallsCount()
  const contractsAmount = await getContractsAmount()
  const db = await initDB()
  const contractsCount = await db.count("contracts")
  
  console.log("数据源计数:", {
    leadsCount,
    prospectsCount,
    targetsCount,
    visitsCount,
    phoneCallsCount,
    contractsAmount,
    contractsCount
  });
  
  // 记录当前周期的数据
  console.log(`${period}周期的数据:`, data);

  // 计算汇总数据
  const dataNewLeads = data.reduce((sum, item) => sum + (item["新增线索"] || 0), 0);
  const dataNewProspects = data.reduce((sum, item) => sum + (item["新增潜在客户"] || 0), 0);
  const dataPhoneCalls = data.reduce((sum, item) => sum + (item["电话联系"] || 0), 0);
  const dataVisits = data.reduce((sum, item) => sum + (item["拜访数量"] || 0), 0);
  
  console.log("周期数据计算:", {
    dataNewLeads,
    dataNewProspects,
    dataPhoneCalls,
    dataVisits
  });
  
  const summaryData = {
    newLeads: dataNewLeads || leadsCount,
    newProspects: dataNewProspects || prospectsCount,
    phoneCalls: dataPhoneCalls || phoneCallsCount,
    visits: dataVisits || visitsCount,
    conversionRate: 0,
    potentialValue: 0,
    contractValue: contractsAmount,
  }
  
  console.log("汇总数据初始值:", summaryData);

  // 计算转化率 - 修正的公式：客户数/(线索数+潜在客户数)
  const totalLeadsAndProspects = summaryData.newLeads + summaryData.newProspects;
  if (totalLeadsAndProspects > 0) {
    // 使用客户表(customers)的数量作为已转化的客户数量，而不是targetsCount
    const customersCount = await db.count("customers");
    summaryData.conversionRate = Math.round((customersCount / totalLeadsAndProspects) * 100);
    console.log(`转化率计算: 正式客户数(${customersCount}) / (线索数(${summaryData.newLeads}) + 潜在客户数(${summaryData.newProspects})) = ${summaryData.conversionRate}%`);
  }

  // 计算潜在价值（从leads和prospects表中获取amount字段的总和）
  const leads = await getAll("leads")
  const prospects = await getAll("prospects")
  
  console.log("潜在价值计算 - 数据源:", {
    leadsCount: leads.length,
    prospectsCount: prospects.length
  });
  
  // 修复leads金额计算
  const leadsAmount = leads.reduce((sum, lead) => {
    // 确保amount是数字
    const amount = typeof lead.amount === 'number' ? lead.amount : 
                  (Number.parseFloat(lead.amount) || 0);
    return sum + amount;
  }, 0)
  
  // 修复prospects金额计算
  const prospectsAmount = prospects.reduce((sum, prospect) => {
    // 确保amount是数字
    const amount = typeof prospect.amount === 'number' ? prospect.amount : 
                  (Number.parseFloat(prospect.amount) || 0);
    return sum + amount;
  }, 0)
  
  // 统计商机总金额
  summaryData.potentialValue = leadsAmount + prospectsAmount;
  console.log(`线索商机总金额: leadsAmount=${leadsAmount}, prospectsAmount=${prospectsAmount}, total=${summaryData.potentialValue}`);

  // 合同金额仅计算客户的金额
  summaryData.contractValue = contractsAmount
  
  console.log("最终汇总数据:", summaryData);

  return summaryData
}

// 获取按季度获取合同数据
export async function getContractsByQuarter(quarter: string) {
  const db = await initDB()
  const contracts = await db.getAll("contracts")
  const currentYear = new Date().getFullYear()
  
  // 根据季度获取日期范围
  let startDate: Date, endDate: Date
  
  switch (quarter) {
    case "Q1":
      startDate = new Date(currentYear, 0, 1) // 1月1日
      endDate = new Date(currentYear, 2, 31, 23, 59, 59, 999) // 3月31日
      break
    case "Q2":
      startDate = new Date(currentYear, 3, 1) // 4月1日
      endDate = new Date(currentYear, 5, 30, 23, 59, 59, 999) // 6月30日
      break
    case "Q3":
      startDate = new Date(currentYear, 6, 1) // 7月1日
      endDate = new Date(currentYear, 8, 30, 23, 59, 59, 999) // 9月30日
      break
    case "Q4":
      startDate = new Date(currentYear, 9, 1) // 10月1日
      endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999) // 12月31日
      break
    default:
      // 默认返回空数组
      return []
  }
  
  console.log(`获取${quarter}季度合同 (${startDate.toISOString()} - ${endDate.toISOString()})`);
  
  // 筛选指定季度的合同
  const quarterContracts = contracts.filter(contract => {
    // 确保合同有日期字段
    if (!contract.date) {
      console.log(`合同缺少日期字段:`, contract);
      return false;
    }
    
    // 将合同日期转换为Date对象
    const contractDate = new Date(contract.date);
    
    // 检查日期是否有效
    if (isNaN(contractDate.getTime())) {
      console.log(`合同日期无效:`, contract.date);
      return false;
    }
    
    // 检查合同是否在指定季度范围内
    const inRange = contractDate >= startDate && contractDate <= endDate;
    console.log(`合同ID:${contract.id}, 日期:${contractDate.toISOString()}, 在范围内:${inRange}`);
    return inRange;
  });
  
  console.log(`找到${quarterContracts.length}个${quarter}季度合同`);
  return quarterContracts;
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

// 获取客户数量
export async function getCustomersCount() {
  const db = await initDB()
  return db.count("customers")
}

// 获取线索数量统计
export async function getLeadsCount() {
  const db = await initDB()
  return db.count("leads")
}

// 获取合同金额统计
export async function getContractsAmount() {
  const db = await initDB();
  
  // 从contracts表获取金额总和
  const contracts = await db.getAll("contracts");
  const contractsAmount = contracts.reduce((total, contract) => {
    // 确保金额是数字
    const amount = typeof contract.amount === 'number' ? contract.amount : 
                   (Number.parseFloat(contract.amount) || 0);
    return total + amount;
  }, 0);
  
  console.log("合同金额统计:", contractsAmount);
  return contractsAmount;
}

// 获取客户数量
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
  // 从visits表获取拜访数量
  const visitsCount = await db.count("visits")
  
  // 从plans表中获取类型为"拜访"的计划数量
  const allPlans = await db.getAll("plans")
  console.log("所有计划:", allPlans.map(plan => ({ id: plan.id, type: plan.type, completed: plan.completed })));
  
  const planVisitsCount = allPlans.filter(plan => {
    // 检查不同的拜访类型表达方式
    const isVisitType = plan.type === "拜访" || 
                        plan.type === "客户拜访" || 
                        plan.type?.toLowerCase().includes("拜访") ||
                        plan.type?.toLowerCase().includes("visit");
    const isCompleted = plan.completed === true;
    console.log(`计划 ${plan.id}: 类型=${plan.type}, 完成=${plan.completed}, 是拜访=${isVisitType}, 是已完成=${isCompleted}`);
    return isVisitType && isCompleted;
  }).length
  
  // 从projects表中获取类型为"拜访"的项目事务数量
  const allProjects = await db.getAll("projects")
  const projectVisitsCount = allProjects.filter(project => {
    return project.type === "拜访" || 
           project.type === "客户拜访" || 
           project.type?.toLowerCase().includes("拜访") ||
           project.type?.toLowerCase().includes("visit");
  }).length
  
  console.log(`拜访统计: visits=${visitsCount}, plans=${planVisitsCount}, projects=${projectVisitsCount}`);
  
  // 返回总数
  return visitsCount + planVisitsCount + projectVisitsCount
}

// 获取电话联系数量
export async function getPhoneCallsCount() {
  const db = await initDB()
  
  // 从plans表中获取类型为"电话"的计划数量
  const allPlans = await db.getAll("plans")
  console.log("所有计划:", allPlans.map(plan => ({ id: plan.id, type: plan.type, completed: plan.completed })));
  
  const planPhoneCallsCount = allPlans.filter(plan => {
    // 检查不同的电话类型表达方式
    const isPhoneType = plan.type === "电话" || 
                        plan.type === "电话联系" || 
                        plan.type?.toLowerCase().includes("电话") ||
                        plan.type?.toLowerCase().includes("call") ||
                        plan.type?.toLowerCase().includes("phone");
    const isCompleted = plan.completed === true;
    console.log(`计划 ${plan.id}: 类型=${plan.type}, 完成=${plan.completed}, 是电话=${isPhoneType}, 是已完成=${isCompleted}`);
    return isPhoneType && isCompleted;
  }).length
  
  // 从projects表中获取类型为"电话"的项目事务数量
  const allProjects = await db.getAll("projects")
  const projectPhoneCallsCount = allProjects.filter(project => {
    return project.type === "电话" || 
           project.type === "电话联系" || 
           project.type?.toLowerCase().includes("电话") ||
           project.type?.toLowerCase().includes("call") ||
           project.type?.toLowerCase().includes("phone");
  }).length
  
  console.log(`电话联系统计: plans=${planPhoneCallsCount}, projects=${projectPhoneCallsCount}`);
  
  // 返回总数
  return planPhoneCallsCount + projectPhoneCallsCount
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

// 修复缺少type字段的计划数据
export async function fixPlansData() {
  try {
    console.log("开始修复计划数据...");
    const db = await initDB();
    const allPlans = await db.getAll("plans");
    let fixedCount = 0;
    
    for (const plan of allPlans) {
      if (!plan.type) {
        plan.type = "其他"; // 为缺少type字段的计划设置默认值
        await db.put("plans", plan);
        fixedCount++;
      }
    }
    
    console.log(`修复完成，共修复了 ${fixedCount} 条计划数据`);
    return { success: true, message: `已修复 ${fixedCount} 条计划数据` };
  } catch (error) {
    console.error("修复计划数据时出错:", error);
    return { success: false, message: "修复计划数据失败" };
  }
}

// 在重置数据库函数中添加对计划数据的修复
export async function resetDatabase() {
  try {
    // 备份当前数据
    const db = await initDB();
    const plans = await db.getAll("plans");
    const projects = await db.getAll("projects");
    
    // 删除并重建数据库
    await deleteAndRebuildDatabase();
    
    // 重新初始化数据库
    const newDb = await initDB();
    
    // 尝试恢复并修复数据
    for (const plan of plans) {
      try {
        // 确保plan有type属性
        if (!plan.type) {
          plan.type = "其他";
        }
        await newDb.add("plans", plan);
      } catch (e) {
        console.error("恢复计划数据失败:", e);
      }
    }
    
    for (const project of projects) {
      try {
        await newDb.add("projects", project);
      } catch (e) {
        console.error("恢复项目数据失败:", e);
      }
    }
    
    return { success: true, message: "数据库已成功重置并恢复数据" };
  } catch (error) {
    console.error("重置数据库失败:", error);
    return { success: false, message: "重置数据库失败" };
  }
}

// 将线索/潜在客户/目标客户转换为正式客户
export async function convertToCustomer(sourceName: string, sourceId: number) {
  try {
    const db = await initDB();
    
    // 从源表获取数据
    const sourceItem = await get(sourceName, sourceId);
    if (!sourceItem) {
      throw new Error(`未找到ID为${sourceId}的${sourceName}记录`);
    }
    
    // 准备要插入的客户数据
    const customerData = {
      name: sourceItem.name,
      contact: sourceItem.contact || "",
      type: "新客户",
      industry: sourceItem.industry || "",
      rating: "B",
      tags: sourceItem.tags || [],
      joinDate: new Date()
    };
    
    // 添加到客户表
    const customerId = await add("customers", customerData);
    console.log(`成功将${sourceName} ID:${sourceId}转换为客户 ID:${customerId}`);
    
    return {
      success: true,
      customerId,
      message: `已成功将${sourceName}转换为客户`
    };
  } catch (error) {
    console.error(`转换为客户时出错:`, error);
    throw new Error(`转换失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}
