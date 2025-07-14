// db.ts
import fs from 'fs';
import os from 'os';
import Database from 'better-sqlite3';
import { Table_DDL } from './CreateTableSQL.js';

const NODE_ENV = process.env.NODE_ENV;
const userDir = os.homedir();
const dbFolder = `${userDir}/${NODE_ENV === 'development' ? '.KK-LineTest' : '.KK-Line'}/`;

fs.mkdirSync(dbFolder, { recursive: true });

const db = new Database(dbFolder + 'local.db', { verbose: console.log });

// 创建表
for (const ddl of Table_DDL) {
  db.exec(ddl);
}

export default db;
