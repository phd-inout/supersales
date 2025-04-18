"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Settings } from "lucide-react"

export function PerformanceWeightsDialog({ weights, onWeightsChange }) {
  const [localWeights, setLocalWeights] = useState({ ...weights })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 1) {
      setLocalWeights((prev) => ({ ...prev, [name]: numValue }))
    }
  }

  const handleSave = () => {
    // 确保权重总和为1
    const sum = Object.values(localWeights).reduce((a, b) => a + b, 0)
    if (Math.abs(sum - 1) > 0.01) {
      alert("所有权重之和必须等于1")
      return
    }

    onWeightsChange(localWeights)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 px-2">
          <Settings className="h-3.5 w-3.5 mr-1" />
          <span className="text-xs">权重设置</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>业绩自评权重设置</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="leads" className="text-right">
              线索权重
            </Label>
            <Input
              id="leads"
              name="leads"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={localWeights.leads}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="prospects" className="text-right">
              潜在客户权重
            </Label>
            <Input
              id="prospects"
              name="prospects"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={localWeights.prospects}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phoneCalls" className="text-right">
              电话联系权重
            </Label>
            <Input
              id="phoneCalls"
              name="phoneCalls"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={localWeights.phoneCalls}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="visits" className="text-right">
              拜访权重
            </Label>
            <Input
              id="visits"
              name="visits"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={localWeights.visits}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contracts" className="text-right">
              合同金额权重
            </Label>
            <Input
              id="contracts"
              name="contracts"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={localWeights.contracts}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="profit" className="text-right">
              利润权重
            </Label>
            <Input
              id="profit"
              name="profit"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={localWeights.profit}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          <div className="col-span-4 text-right text-sm">
            权重总和:{" "}
            {Object.values(localWeights)
              .reduce((a, b) => a + b, 0)
              .toFixed(2)}
            {Math.abs(Object.values(localWeights).reduce((a, b) => a + b, 0) - 1) > 0.01 && (
              <span className="text-red-500 ml-2">（必须等于1）</span>
            )}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">取消</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={handleSave}>保存</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
