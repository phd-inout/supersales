"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Database, Trash2, RefreshCw, Download, Upload, CheckCircle, AlertTriangle } from "lucide-react"
import { clearAllData, getAll, deleteAndRebuildDatabase } from "@/lib/db-service"
import { motion } from "framer-motion"

export function DatabaseManager() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [stats, setStats] = useState(null)

  // 获取数据库统计信息
  const fetchStats = async () => {
    setLoading(true)
    try {
      const tables = ["customers", "leads", "prospects", "targets", "plans", "goals", "projects", "visits", "contracts"]

      const stats: Record<string, number> = {}

      for (const table of tables) {
        try {
          const data = await getAll(table)
          stats[table] = data.length
        } catch (tableError) {
          console.error(`获取表 ${table} 数据失败:`, tableError)
          stats[table] = 0
        }
      }

      setStats(stats)
      setMessage({ type: "success", text: "数据库统计信息已更新" })
    } catch (error) {
      console.error("Error fetching database stats:", error)
      setMessage({ type: "error", text: `获取数据库统计信息失败: ${error instanceof Error ? error.message : String(error)}` })
    } finally {
      setLoading(false)
    }
  }

  // 清空所有数据
  const handleClearAllData = async () => {
    if (!window.confirm("确定要清空所有数据吗？此操作不可恢复！")) {
      return
    }

    setLoading(true)
    setMessage({ type: "info", text: "正在清空数据，请稍候..." })
    
    try {
      console.log("开始清空所有数据")
      const result = await clearAllData()
      console.log("清空数据结果:", result)
      
      // 等待一段时间，确保数据库操作完成
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log("开始刷新统计信息")
      await fetchStats()
      console.log("统计信息已刷新")
      
      setMessage({ type: "success", text: "所有数据已成功清空" })
    } catch (error) {
      console.error("清空数据错误:", error)
      setMessage({ type: "error", text: `清空数据失败: ${error instanceof Error ? error.message : String(error)}` })
    } finally {
      setLoading(false)
    }
  }

  // 导出数据
  const handleExportData = async () => {
    setLoading(true)
    try {
      const tables = ["customers", "leads", "prospects", "targets", "plans", "goals", "projects", "visits", "contracts"]

      const exportData: Record<string, any[]> = {}

      for (const table of tables) {
        try {
          const data = await getAll(table)
          exportData[table] = data
        } catch (tableError) {
          console.error(`获取表 ${table} 数据失败:`, tableError)
          exportData[table] = []
        }
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

      const exportFileDefaultName = `sales_management_backup_${new Date().toISOString().slice(0, 10)}.json`

      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportFileDefaultName)
      linkElement.click()

      setMessage({ type: "success", text: "数据导出成功" })
    } catch (error) {
      console.error("Error exporting data:", error)
      setMessage({ type: "error", text: `导出数据失败: ${error instanceof Error ? error.message : String(error)}` })
    } finally {
      setLoading(false)
    }
  }

  // 重建数据库
  const handleRebuildDatabase = async () => {
    if (!window.confirm("警告：这将完全删除并重建数据库！所有数据将永久丢失。确定要继续吗？")) {
      return
    }

    setLoading(true)
    setMessage({ type: "info", text: "正在重建数据库，请稍候..." })
    
    try {
      console.log("开始重建数据库")
      const result = await deleteAndRebuildDatabase()
      console.log("重建数据库结果:", result)
      
      // 等待一段时间，确保数据库操作完成
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      console.log("开始刷新统计信息")
      await fetchStats()
      console.log("统计信息已刷新")
      
      setMessage({ type: "success", text: "数据库已成功重建" })
    } catch (error) {
      console.error("重建数据库错误:", error)
      setMessage({ type: "error", text: `重建数据库失败: ${error instanceof Error ? error.message : String(error)}` })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <motion.div
        className="flex justify-between items-center mb-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-brand-blue to-brand-indigo bg-clip-text text-transparent">
          数据库管理
        </h1>
      </motion.div>

      {message && (
        <Alert className={`mb-4 ${
          message.type === "error" ? "bg-red-50" : 
          message.type === "info" ? "bg-blue-50" : 
          "bg-green-50"
        }`}>
          <AlertCircle className={
            message.type === "error" ? "text-red-500" : 
            message.type === "info" ? "text-blue-500" : 
            "text-green-500"
          } />
          <AlertTitle>
            {message.type === "error" ? "错误" : 
             message.type === "info" ? "信息" : 
             "成功"}
          </AlertTitle>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              数据库操作
            </CardTitle>
            <CardDescription>管理数据库中的数据</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="flex items-center gap-2" onClick={fetchStats} disabled={loading}>
                <RefreshCw className="h-4 w-4" />
                刷新统计
              </Button>

              <Button
                variant="outline"
                className="flex items-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={handleClearAllData}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4" />
                清空所有数据
              </Button>

              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleExportData}
                disabled={loading}
              >
                <Download className="h-4 w-4" />
                导出数据
              </Button>

              <Button variant="outline" className="flex items-center gap-2" disabled={true}>
                <Upload className="h-4 w-4" />
                导入数据
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center gap-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 col-span-2"
                onClick={handleRebuildDatabase}
                disabled={loading}
              >
                <AlertTriangle className="h-4 w-4" />
                删除并重建数据库
              </Button>
            </div>

            {loading && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              数据库统计
            </CardTitle>
            <CardDescription>查看数据库中的记录数量</CardDescription>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(stats).map(([table, count]) => (
                    <div key={table} className="flex justify-between items-center p-2 border rounded-md">
                      <span className="text-sm font-medium capitalize">{table}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>点击"刷新统计"查看数据库信息</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              使用说明
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm">本页面用于管理销售统计系统的数据库。您可以执行以下操作：</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>刷新统计 - 查看各表中的记录数量</li>
                <li>清空所有数据 - 删除数据库中的所有记录，适合重新开始使用系统</li>
                <li>导出数据 - 将数据库中的所有数据导出为JSON文件，用于备份</li>
                <li>删除并重建数据库 - 完全删除并重新创建数据库（当清空数据功能无效时使用）</li>
              </ul>
              <Alert className="bg-yellow-50">
                <AlertTriangle className="text-yellow-500" />
                <AlertTitle>注意</AlertTitle>
                <AlertDescription>
                  如果清空数据操作失败，请尝试"删除并重建数据库"功能。此操作将彻底删除数据库并重新创建，所有数据将被永久删除。
                </AlertDescription>
              </Alert>
              <Alert className="bg-blue-50">
                <AlertCircle className="text-blue-500" />
                <AlertTitle>提示</AlertTitle>
                <AlertDescription>
                  清空数据后，您可以开始添加自己的真实数据。系统将直接使用IndexedDB存储您的数据，无需依赖模拟数据。
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
