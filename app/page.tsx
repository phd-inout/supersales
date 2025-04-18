import type { Metadata } from "next"
import Dashboard from "@/components/dashboard"

export const metadata: Metadata = {
  title: "销售统计管理系统",
  description: "个人使用的销售统计管理系统",
}

export default function Home() {
  return <Dashboard />
}
