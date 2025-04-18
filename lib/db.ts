import { openDB } from "idb"

// 初始化数据库
export async function initDB() {
  const db = await openDB("salesManagementDB", 1, {
    upgrade(db) {
      // 创建客户表
      if (!db.objectStoreNames.contains("customers")) {
        const customerStore = db.createObjectStore("customers", { keyPath: "id", autoIncrement: true })
        customerStore.createIndex("name", "name", { unique: false })
        customerStore.createIndex("industry", "industry", { unique: false })
      }

      // 创建线索表
      if (!db.objectStoreNames.contains("leads")) {
        const leadsStore = db.createObjectStore("leads", { keyPath: "id", autoIncrement: true })
        leadsStore.createIndex("name", "name", { unique: false })
        leadsStore.createIndex("stage", "stage", { unique: false })
      }

      // 创建潜在客户表
      if (!db.objectStoreNames.contains("prospects")) {
        const prospectsStore = db.createObjectStore("prospects", { keyPath: "id", autoIncrement: true })
        prospectsStore.createIndex("name", "name", { unique: false })
        prospectsStore.createIndex("stage", "stage", { unique: false })
      }

      // 创建目标客户表
      if (!db.objectStoreNames.contains("targets")) {
        const targetsStore = db.createObjectStore("targets", { keyPath: "id", autoIncrement: true })
        targetsStore.createIndex("name", "name", { unique: false })
        targetsStore.createIndex("stage", "stage", { unique: false })
      }

      // 创建计划表
      if (!db.objectStoreNames.contains("plans")) {
        const plansStore = db.createObjectStore("plans", { keyPath: "id", autoIncrement: true })
        plansStore.createIndex("task", "task", { unique: false })
        plansStore.createIndex("date", "date", { unique: false })
      }

      // 创建目标表
      if (!db.objectStoreNames.contains("goals")) {
        const goalsStore = db.createObjectStore("goals", { keyPath: "id", autoIncrement: true })
        goalsStore.createIndex("name", "name", { unique: false })
        goalsStore.createIndex("progress", "progress", { unique: false })
      }

      // 创建项目事务表
      if (!db.objectStoreNames.contains("projects")) {
        const projectsStore = db.createObjectStore("projects", { keyPath: "id", autoIncrement: true })
        projectsStore.createIndex("name", "name", { unique: false })
        projectsStore.createIndex("type", "type", { unique: false })
      }
    },
  })

  return db
}

// 通用的CRUD操作
export async function getAll(storeName) {
  const db = await initDB()
  return db.getAll(storeName)
}

export async function get(storeName, id) {
  const db = await initDB()
  return db.get(storeName, id)
}

export async function add(storeName, item) {
  const db = await initDB()
  return db.add(storeName, item)
}

export async function put(storeName, item) {
  const db = await initDB()
  return db.put(storeName, item)
}

export async function remove(storeName, id) {
  const db = await initDB()
  return db.delete(storeName, id)
}

// 查询操作
export async function getByIndex(storeName, indexName, value) {
  const db = await initDB()
  const tx = db.transaction(storeName, "readonly")
  const index = tx.store.index(indexName)
  return index.getAll(value)
}
