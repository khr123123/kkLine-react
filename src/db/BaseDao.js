import fs from 'fs'
import os from 'os'
import Database from 'better-sqlite3'
import { Table_DDL } from './CreateTableSQL.js'

const NODE_ENV = process.env.NODE_ENV
const userDir = os.homedir()
const dbFolder = `${userDir}/${NODE_ENV === 'development' ? '.KK-LineTest' : '.KK-Line'}/`

fs.mkdirSync(dbFolder, { recursive: true })

const db = new Database(dbFolder + 'local.db', { verbose: console.log })

// ✅ 初始化数据库表
export const dbInit = () => {
  for (const ddl of Table_DDL) {
    try {
      db.prepare(ddl).run()
      console.log('✅ 表创建成功:', ddl.split('(')[0])
    } catch (err) {
      console.error('❌ 表创建失败:', ddl, err)
    }
  }
  console.log('📂 数据库初始化完成:', dbFolder)
}

// ✅ 数据库服务
export const DatabaseService = {
  // 插入数据
  insertData: (table, data) => {
    const keys = Object.keys(data)
    const placeholders = keys.map(k => `@${k}`).join(', ')
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`
    try {
      db.prepare(sql).run(data)
      console.log('✅ 插入成功:', sql)
      return true
    } catch (err) {
      console.error('❌ 插入失败:', sql, err)
      return false
    }
  },

  // 更新数据
  updateData: (table, data, whereClause, whereParams = {}) => {
    const setClause = Object.keys(data).map(k => `${k} = @${k}`).join(', ')
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`
    try {
      db.prepare(sql).run({ ...data, ...whereParams })
      console.log('✅ 更新成功:', sql)
      return true
    } catch (err) {
      console.error('❌ 更新失败:', sql, err)
      return false
    }
  },

  // 插入或更新数据
  insertOrUpdateData: (table, data) => {
    const keys = Object.keys(data)
    const placeholders = keys.map(k => `@${k}`).join(', ')
    const sql = `INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`
    try {
      db.prepare(sql).run(data)
      console.log('✅ 插入或替换成功:', sql)
      return true
    } catch (err) {
      console.error('❌ 插入或替换失败:', sql, err)
      return false
    }
  },

  // 查询单条
  queryOne: (sql, params = {}) => {
    try {
      const result = db.prepare(sql).get(params)
      console.log('✅ 查询单条成功:', sql)
      return result || null
    } catch (err) {
      console.error('❌ 查询单条失败:', sql, err)
      return null
    }
  },

  // 查询多条
  queryAll: (sql, params = {}) => {
    try {
      const result = db.prepare(sql).all(params)
      console.log('✅ 查询多条成功:', sql)
      return result
    } catch (err) {
      console.error('❌ 查询多条失败:', sql, err)
      return []
    }
  },

  // 执行 DML
  execute: (sql, params = {}) => {
    try {
      db.prepare(sql).run(params)
      console.log('✅ 执行成功:', sql)
      return true
    } catch (err) {
      console.error('❌ 执行失败:', sql, err)
      return false
    }
  },

  // 事务封装（传入一个函数）
  executeTransaction: (transactionCallback) => {
    const transaction = db.transaction(transactionCallback)
    try {
      transaction()
      console.log('✅ 事务执行成功')
    } catch (err) {
      console.error('❌ 事务执行失败:', err)
    }
  },

  // 批量插入
  batchInsert: (table, dataArray) => {
    if (!Array.isArray(dataArray) || dataArray.length === 0) return false
    const keys = Object.keys(dataArray[0])
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(k => `@${k}`).join(', ')})`
    const stmt = db.prepare(sql)

    const insertMany = db.transaction((rows) => {
      for (const row of rows) {
        stmt.run(row)
      }
    })

    try {
      insertMany(dataArray)
      console.log(`✅ 批量插入成功 (${dataArray.length} 条)`)
      return true
    } catch (err) {
      console.error('❌ 批量插入失败:', err)
      return false
    }
  }
}
