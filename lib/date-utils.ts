/**
 * 获取日期所在的周数
 * @param date 日期对象
 * @returns 周数 (1-53)
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
}

/**
 * 获取指定年份和周数的日期范围
 * @param year 年份
 * @param week 周数
 * @returns 包含开始日期和结束日期的对象
 */
export function getWeekRange(year: number, week: number): { startDate: Date; endDate: Date } {
  const firstDayOfYear = new Date(year, 0, 1)
  const dayOffset = 24 * 60 * 60 * 1000
  const firstWeekDay = firstDayOfYear.getDay()

  // 计算第一周的第一天
  const firstWeekStartDate = new Date(
    firstDayOfYear.getTime() - (firstWeekDay > 0 ? (firstWeekDay - 1) * dayOffset : 6 * dayOffset),
  )

  // 计算指定周的开始日期
  const startDate = new Date(firstWeekStartDate.getTime() + (week - 1) * 7 * dayOffset)

  // 计算指定周的结束日期
  const endDate = new Date(startDate.getTime() + 6 * dayOffset)

  return { startDate, endDate }
}

/**
 * 获取两个日期之间的天数
 * @param date1 第一个日期
 * @param date2 第二个日期
 * @returns 天数
 */
export function getDaysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000 // 一天的毫秒数
  const diffTime = Math.abs(date2.getTime() - date1.getTime())
  return Math.round(diffTime / oneDay)
}

/**
 * 获取日期所在的季度
 * @param date 日期对象
 * @returns 季度 (Q1-Q4)
 */
export function getQuarter(date: Date): string {
  const month = date.getMonth()
  if (month < 3) return "Q1"
  if (month < 6) return "Q2"
  if (month < 9) return "Q3"
  return "Q4"
}

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param date 日期对象
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
