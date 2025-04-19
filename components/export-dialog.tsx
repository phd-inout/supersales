"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Download, FileOutput } from "lucide-react"

interface ExportDialogProps {
  onExport: (fileName: string, type: 'current' | 'all') => void;
  trigger?: React.ReactNode;
}

export function ExportDialog({ onExport, trigger }: ExportDialogProps) {
  const [fileName, setFileName] = useState("")
  const [open, setOpen] = useState(false)
  
  const today = new Date().toISOString().slice(0, 10)
  const defaultFileName = `销售报告_${today}`
  
  const handleExport = (type: 'current' | 'all') => {
    const finalFileName = fileName.trim() || defaultFileName
    onExport(finalFileName, type)
    setOpen(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full p-0">
            <FileOutput className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>导出报告</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fileName" className="text-right">
              文件名称
            </Label>
            <Input
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder={defaultFileName}
              className="col-span-3"
            />
          </div>
          <div className="px-1 py-2">
            <p className="text-sm text-muted-foreground">
              选择要导出的内容及格式。导出的文件将以PDF格式保存。
            </p>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleExport('current')}
            className="flex-1 gap-2"
          >
            <Download className="h-4 w-4" />
            <span>导出当前页面</span>
          </Button>
          <Button 
            onClick={() => handleExport('all')}
            className="flex-1 gap-2"
          >
            <FileOutput className="h-4 w-4" />
            <span>导出所有页面</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 