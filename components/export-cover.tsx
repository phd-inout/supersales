"use client"

import React, { useState, useEffect } from 'react'
import { getUserSettings } from './user-settings-dialog'

interface ExportCoverProps {
  title?: string;
  date?: string;
}

export function ExportCover({ title, date }: ExportCoverProps) {
  // 状态用于存储用户设置
  const [settings, setSettings] = useState(getUserSettings())
  
  // 从数据库加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { getUserSettings: getDBSettings } = await import('@/lib/db-service')
        const dbSettings = await getDBSettings()
        setSettings(dbSettings)
      } catch (error) {
        console.error('从数据库加载用户设置时出错:', error)
        // 如果从数据库加载失败，已经有从localStorage加载的默认值
      }
    }
    
    loadSettings()
  }, [])

  // 获取当前日期和周数
  const [formattedDate, setFormattedDate] = useState('')


  // 获取周数和日期
  useEffect(() => {
    const getFormattedDate = async () => {
      try {
        const { getWeekNumber } = await import('@/lib/date-utils')
        const { formatWeekDisplay } = await import('@/lib/db-service')
        
        const now = new Date()
        const year = now.getFullYear()
        const weekNumber = getWeekNumber(now)
        const weekDisplay = formatWeekDisplay(year, weekNumber)
        
        setFormattedDate(weekDisplay)
      } catch (error) {
        console.error('获取日期周数时出错:', error)
        // 使用默认日期格式作为后备
        setFormattedDate(new Date().toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }))
      }
    }
    
    getFormattedDate()
  }, [])
  
  return (
    <div className="flex flex-col items-center justify-center relative bg-white" 
      style={{ 
        width: '1280px', 
        height: '720px',
        margin: '0 auto',
        background: 'linear-gradient(135deg,rgb(211, 224, 243) 0%,rgb(227, 208, 237) 100%)',
        overflow: 'hidden',
        // 确保比例为16:9
        aspectRatio: '16/9'
      }}>
      
      {/* 背景几何线条装饰 */}
      <div className="absolute inset-0">
        {/* 左上角几何线条 */}
        <svg width="300" height="300" viewBox="0 0 300 300" fill="none" 
          className="absolute -left-20 -top-20 opacity-30"
          style={{ transform: 'rotate(15deg)' }}>
          <circle cx="150" cy="150" r="100" stroke="#2563eb" strokeWidth="1" />
          <circle cx="150" cy="150" r="130" stroke="#4f46e5" strokeWidth="0.8" />
          <circle cx="150" cy="150" r="160" stroke="#7c3aed" strokeWidth="0.6" />
        </svg>
        
        {/* 右下角几何线条 */}
        <svg width="400" height="400" viewBox="0 0 400 400" fill="none" 
          className="absolute -right-40 -bottom-40 opacity-20"
          style={{ transform: 'rotate(-10deg)' }}>
          <rect x="50" y="50" width="300" height="300" stroke="#2563eb" strokeWidth="1" />
          <rect x="80" y="80" width="240" height="240" stroke="#4f46e5" strokeWidth="0.8" />
          <rect x="110" y="110" width="180" height="180" stroke="#7c3aed" strokeWidth="0.6" />
        </svg>
        
        {/* 装饰点和线 */}
        <div className="absolute inset-0">
          {Array.from({ length: 20 }).map((_, index) => (
            <div 
              key={index}
              className="absolute w-1 h-1 rounded-full bg-blue-500 opacity-30"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
            />
          ))}
          
          {/* 连接线 */}
          <svg width="100%" height="100%" className="absolute inset-0 opacity-10">
            <line x1="0" y1="0" x2="1280" y2="720" stroke="#2563eb" strokeWidth="0.5" />
            <line x1="1280" y1="0" x2="0" y2="720" stroke="#4f46e5" strokeWidth="0.5" />
            <line x1="640" y1="0" x2="640" y2="720" stroke="#7c3aed" strokeWidth="0.5" />
            <line x1="0" y1="360" x2="1280" y2="360" stroke="#db2777" strokeWidth="0.5" />
          </svg>
        </div>
      </div>
      
      {/* 公司Logo区域 - 顶部中央 */}
      <div className="absolute top-20 left-0 right-0 flex justify-center">
        <div className="h-20 w-20 rounded-full bg-white shadow-lg flex items-center justify-center">
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" 
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" 
              className="text-blue-600" />
          </svg>
        </div>
      </div>
      
      {/* 主标题区域 */}
      <div className="z-10 flex flex-col items-center text-center px-8">
       
        
        <div className="w-40 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-10"></div>
        
        <h2 className="text-3xl font-semibold text-gray-700 mb-6">
          {settings.companyName}
        </h2>
        
        <p className="text-xl text-gray-600 mb-12">
          {settings.userName}
        </p>
        
        <div className="flex items-center justify-center mt-10 text-gray-500">
          <div className="w-10 h-0.5 bg-gray-300 mr-4"></div>
          <span className="text-lg">{formattedDate}</span>
          <div className="w-10 h-0.5 bg-gray-300 ml-4"></div>
        </div>
      </div>
      
      {/* 底部装饰 */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center">
        <div className="w-32 h-8 flex">
          <div className="h-full w-8 bg-blue-600 opacity-20 rounded-l-full"></div>
          <div className="h-full w-8 bg-indigo-600 opacity-30"></div>
          <div className="h-full w-8 bg-purple-600 opacity-40"></div>
          <div className="h-full w-8 bg-pink-600 opacity-20 rounded-r-full"></div>
        </div>
      </div>
    </div>
  )
}