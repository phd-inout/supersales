"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Settings, User } from "lucide-react"

// 用户设置类型定义
export interface UserSettings {
  companyName: string;
  userName: string;
}

// 默认用户设置
const defaultSettings: UserSettings = {
  companyName: "超级销售管理系统",
  userName: "销售经理",
}

// 导出获取用户设置的函数，以便在其他组件中使用
export function getUserSettings(): UserSettings {
  if (typeof window === 'undefined') return defaultSettings;
  
  // 为了保持兼容性，先检查localStorage
  const localSettings = localStorage.getItem('userSettings');
  if (localSettings) {
    try {
      // 如果localStorage中有数据，返回并同时迁移到数据库
      const parsedSettings = JSON.parse(localSettings);
      // 异步迁移到数据库，不阻塞返回
      import('@/lib/db-service').then(({ saveUserSettings }) => {
        saveUserSettings(parsedSettings).catch(console.error);
      });
      return parsedSettings;
    } catch (error) {
      console.error('解析用户设置时出错:', error);
    }
  }
  
  // 如果localStorage中没有数据或解析出错，返回默认值
  // 实际数据将在组件中通过useEffect从数据库加载
  return defaultSettings;
}

interface UserSettingsDialogProps {
  onSettingsChange?: (settings: UserSettings) => void;
  onOpenChange?: (open: boolean) => void;
  open?: boolean; // 添加open属性，允许外部控制对话框状态
}

export function UserSettingsDialog({ onSettingsChange, onOpenChange, open: externalOpen }: UserSettingsDialogProps) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [internalOpen, setInternalOpen] = useState(false);
  
  // 使用外部传入的open状态或内部状态
  const open = externalOpen !== undefined ? externalOpen : internalOpen;

  // 处理对话框开关状态变化
  const handleOpenChange = (newOpen: boolean) => {
    setInternalOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  // 当外部open状态变化时更新内部状态
  useEffect(() => {
    if (externalOpen !== undefined) {
      setInternalOpen(externalOpen);
    }
  }, [externalOpen]);

  // 从数据库加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { getUserSettings: getDBSettings } = await import('@/lib/db-service');
        const savedSettings = await getDBSettings();
        setSettings(savedSettings);
      } catch (error) {
        console.error('从数据库加载用户设置时出错:', error);
        // 如果从数据库加载失败，尝试从localStorage加载
        const localSettings = getUserSettings();
        setSettings(localSettings);
      }
    };
    
    // 当对话框打开时加载设置
    if (open) {
      loadSettings();
    }
  }, [open]);

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 保存设置
  const saveSettings = async () => {
    try {
      // 保存到数据库
      const { saveUserSettings } = await import('@/lib/db-service');
      await saveUserSettings(settings);
      
      // 同时保存到localStorage以保持兼容性
      localStorage.setItem('userSettings', JSON.stringify(settings));
      
      if (onSettingsChange) {
        onSettingsChange(settings);
      }
      handleOpenChange(false);
    } catch (error) {
      console.error('保存用户设置时出错:', error);
      alert('保存设置失败，请稍后重试');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>用户信息设置</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="companyName" className="text-right">
              公司名称
            </Label>
            <Input
              id="companyName"
              name="companyName"
              value={settings.companyName}
              onChange={handleInputChange}
              placeholder="请输入公司名称"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="userName" className="text-right">
              用户姓名
            </Label>
            <Input
              id="userName"
              name="userName"
              value={settings.userName}
              onChange={handleInputChange}
              placeholder="请输入您的姓名"
              className="col-span-3"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={saveSettings}>保存设置</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}