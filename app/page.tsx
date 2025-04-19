import type { Metadata } from "next"
import Dashboard from "@/components/dashboard"

export const metadata: Metadata = {
  title: "Supersales",
  description: "个人使用的大客户销售统计管理系统",
}

export default function Home() {
  return <Dashboard />
}
