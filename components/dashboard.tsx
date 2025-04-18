"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { LeadsPage } from "@/components/pages/leads-page"
import { ProspectsPage } from "@/components/pages/prospects-page"
import { TargetCustomersPage } from "@/components/pages/target-customers-page"
import { PlansPage } from "@/components/pages/plans-page"
import { GoalsPage } from "@/components/pages/goals-page"
import { ProjectsPage } from "@/components/pages/projects-page"
import { ReportsPage } from "@/components/pages/reports-page"
import { CustomerInfoPage } from "@/components/pages/customer-info-page"
import { DatabaseManager } from "@/components/pages/database-manager"
import { motion } from "framer-motion"

export default function Dashboard() {
  const [activePage, setActivePage] = useState("reports")
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    setLoading(false)
  }, [])

  // 在renderPage函数中添加数据库管理页面的渲染
  const renderPage = () => {
    switch (activePage) {
      case "leads":
        return <LeadsPage />
      case "prospects":
        return <ProspectsPage />
      case "targets":
        return <TargetCustomersPage />
      case "plans":
        return <PlansPage />
      case "goals":
        return <GoalsPage />
      case "projects":
        return <ProjectsPage />
      case "reports":
        return <ReportsPage />
      case "customers":
        return <CustomerInfoPage />
      case "database":
        return <DatabaseManager />
      default:
        return <ReportsPage />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-mesh bg-mesh-md">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">正在加载数据...</p>
        </div>
      </div>
    )
  }

  if (!mounted) return null

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-mesh bg-mesh-md">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <motion.div
        className="flex-1 h-screen overflow-hidden"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderPage()}
      </motion.div>
    </div>
  )
}
