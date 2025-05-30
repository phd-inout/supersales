"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// 在 import 部分添加 Pencil 图标
import { CalendarIcon, Plus, Search, Trash2, Pencil } from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { cn } from "@/lib/utils"

// 定义项目类型接口
interface Project {
  id: string | number;
  name: string;
  type: string;
  description: string;
  date: Date;
}

// 定义IDBValidKey类型
type IDBValidKey = string | number | Date | ArrayBuffer | IDBValidKey[];

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  // 添加选中的项目状态，用于编辑
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  // 添加对话框显示状态
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newProject, setNewProject] = useState({
    name: "",
    type: "会议",
    description: "",
    date: new Date(),
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 从数据库获取项目事务数据
        const { getAll } = await import("@/lib/db-service")
        const projectsData = await getAll("projects")
        setProjects(projectsData)
      } catch (error) {
        console.error("Error fetching projects data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (selectedProject) {
      setSelectedProject(prev => ({ ...prev!, [name]: value }))
    } else {
      setNewProject((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    if (selectedProject) {
      setSelectedProject(prev => ({ ...prev!, [name]: value }))
    } else {
      setNewProject((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      if (selectedProject) {
        setSelectedProject(prev => ({ ...prev!, date }))
      } else {
        setNewProject((prev) => ({ ...prev, date }))
      }
    }
  }

  // 打开编辑对话框
  const handleEditProject = (project: Project) => {
    setSelectedProject({
      ...project,
      date: new Date(project.date)
    })
    setDialogOpen(true)
  }

  // 关闭对话框并重置状态
  const handleCloseDialog = () => {
    setSelectedProject(null)
    setDialogOpen(false)
  }

  // 提交表单（添加或更新）
  const handleSubmit = async () => {
    try {
      if (selectedProject) {
        // 更新现有项目
        const { put } = await import("@/lib/db-service")
        await put("projects", selectedProject)
        
        // 更新状态
        setProjects(prev => prev.map(item => 
          item.id === selectedProject.id ? selectedProject : item
        ))
        
        setSelectedProject(null)
      } else {
        // 添加到数据库
        const { add } = await import("@/lib/db-service")
        const id = await add("projects", newProject)

        // 更新状态
        const newId = typeof id === 'object' ? String(id) : id;
        setProjects([...projects, { ...newProject, id: newId }])

        // 重置表单
        setNewProject({
          name: "",
          type: "会议",
          description: "",
          date: new Date(),
        })
      }
      setDialogOpen(false)
    } catch (error) {
      console.error("Error saving project:", error)
    }
  }

  // 添加删除功能
  const handleDeleteProject = async (id: string | number) => {
    try {
      if (window.confirm("确定要删除此项目事务吗？此操作不可恢复。")) {
        // 从数据库删除
        const { remove } = await import("@/lib/db-service")
        await remove("projects", typeof id === 'string' ? parseInt(id) : id)

        // 更新状态
        setProjects(projects.filter((project) => project.id !== id))
      }
    } catch (error) {
      console.error("Error deleting project:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Daily</h1>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="搜索项目事务..."
              className="pl-8 w-[250px]"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedProject(null)}>
                <Plus className="mr-2 h-4 w-4" />
                添加事务
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{selectedProject ? "编辑项目事务" : "添加项目事务"}</DialogTitle>
                <DialogDescription>
                  {selectedProject ? "修改项目事务信息" : "添加新的项目事务"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    事务名称
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={selectedProject ? selectedProject.name : newProject.name}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    事务类型
                  </Label>
                  <Select 
                    value={selectedProject ? selectedProject.type : newProject.type} 
                    onValueChange={(value) => handleSelectChange("type", value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="选择事务类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="电话">电话联系</SelectItem>
                      <SelectItem value="拜访">客户拜访</SelectItem>
                      <SelectItem value="会议">会议</SelectItem>
                      <SelectItem value="培训">培训</SelectItem>
                      <SelectItem value="活动">活动</SelectItem>
                      <SelectItem value="调研">调研</SelectItem>
                      <SelectItem value="其他">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    事务描述
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={selectedProject ? selectedProject.description : newProject.description}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    日期
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                          "col-span-3 justify-start text-left font-normal",
                          !newProject.date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedProject 
                          ? format(new Date(selectedProject.date), "PPP", { locale: zhCN }) 
                          : newProject.date 
                            ? format(newProject.date, "PPP", { locale: zhCN }) 
                            : <span>选择日期</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar 
                        mode="single" 
                        selected={selectedProject ? new Date(selectedProject.date) : newProject.date} 
                        onSelect={handleDateChange} 
                        initialFocus 
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" onClick={handleCloseDialog}>取消</Button>
                </DialogClose>
                <Button onClick={handleSubmit}>
                  {selectedProject ? "更新" : "保存"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">序号</TableHead>
              <TableHead>事务名称</TableHead>
              <TableHead>事务类型</TableHead>
              <TableHead>事务描述</TableHead>
              <TableHead>日期</TableHead>
              <TableHead className="w-[120px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.map((project) => (
              <TableRow key={project.id} className="group">
                <TableCell>{project.id}</TableCell>
                <TableCell>{project.name}</TableCell>
                <TableCell>{project.type}</TableCell>
                <TableCell>{project.description}</TableCell>
                <TableCell>{format(new Date(project.date), "yyyy-MM-dd")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditProject(project)}
                      className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">编辑</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteProject(project.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">删除</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
