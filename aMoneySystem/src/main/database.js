const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class AppDatabase {
  constructor() {
    const userDataPath = app ? app.getPath('userData') : './data';
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    const dbPath = path.join(userDataPath, 'amoneysystem.db');
    this.db = new Database(dbPath);
  }

  init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS families (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS family_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id INTEGER,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id)
      );

      CREATE TABLE IF NOT EXISTS tag_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        is_second_level INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tag_values (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tag_type_id INTEGER NOT NULL,
        parent_id INTEGER,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tag_type_id) REFERENCES tag_types(id),
        FOREIGN KEY (parent_id) REFERENCES tag_values(id)
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        creator_id INTEGER,
        family_id INTEGER,
        is_family_expense INTEGER DEFAULT 0,
        description TEXT,
        transaction_date TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id) REFERENCES family_members(id),
        FOREIGN KEY (family_id) REFERENCES families(id)
      );

      CREATE TABLE IF NOT EXISTS transaction_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id INTEGER NOT NULL,
        tag_type_id INTEGER NOT NULL,
        tag_value_id INTEGER NOT NULL,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id),
        FOREIGN KEY (tag_type_id) REFERENCES tag_types(id),
        FOREIGN KEY (tag_value_id) REFERENCES tag_values(id)
      );

      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('asset', 'liability')),
        balance REAL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.initDefaultData();
  }

  initDefaultData() {
    const tagTypes = this.db.prepare('SELECT COUNT(*) as count FROM tag_types').get();
    if (tagTypes.count === 0) {
      const insertTagType = this.db.prepare('INSERT INTO tag_types (name, is_second_level) VALUES (?, ?)');
      const insertTagValue = this.db.prepare('INSERT INTO tag_values (tag_type_id, parent_id, name) VALUES (?, ?, ?)');

      const necessityId = insertTagType.run('消费必要性', 0).lastInsertRowid;
      const necessityValues = ['必需品', '可选消费', '冲动消费', '无必要消费'];
      necessityValues.forEach(v => insertTagValue.run(necessityId, null, v));

      const categoryId = insertTagType.run('消费分类', 1).lastInsertRowid;
      const categories = [
        { name: '日用品', children: ['食品饮料', '清洁用品', '个人护理'] },
        { name: '家用电器', children: ['大家电', '小家电', '数码产品'] },
        { name: '水电暖燃物业费', children: ['水费', '电费', '燃气费', '物业费', '取暖费'] },
        { name: '交通出行', children: ['公共交通', '打车', '油费', '停车费'] },
        { name: '休闲娱乐', children: ['电影演出', '旅游度假', '运动健身'] },
        { name: '医疗健康', children: ['药品', '体检', '医疗服务'] },
        { name: '教育学习', children: ['书籍', '培训课程', '文具'] }
      ];
      
      categories.forEach(cat => {
        const parentId = insertTagValue.run(categoryId, null, cat.name).lastInsertRowid;
        cat.children.forEach(child => insertTagValue.run(categoryId, parentId, child));
      });

      const incomeTypeId = insertTagType.run('收入分类', 0).lastInsertRowid;
      const incomeValues = ['工资', '奖金', '投资收益', '兼职', '其他收入'];
      incomeValues.forEach(v => insertTagValue.run(incomeTypeId, null, v));

      const defaultFamily = this.db.prepare('INSERT INTO families (name) VALUES (?)').run('默认家庭');
      this.db.prepare('INSERT INTO family_members (family_id, name) VALUES (?, ?)').run(defaultFamily.lastInsertRowid, '本人');
    }
  }

  query(sql, params = []) {
    return this.db.prepare(sql).all(...params);
  }

  run(sql, params = []) {
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...params);
    return { lastInsertRowid: result.lastInsertRowid, changes: result.changes };
  }

  get(sql, params = []) {
    return this.db.prepare(sql).get(...params);
  }

  all(sql, params = []) {
    return this.db.prepare(sql).all(...params);
  }

  exportAllData() {
    return {
      families: this.all('SELECT * FROM families'),
      family_members: this.all('SELECT * FROM family_members'),
      tag_types: this.all('SELECT * FROM tag_types'),
      tag_values: this.all('SELECT * FROM tag_values'),
      transactions: this.all('SELECT * FROM transactions'),
      transaction_tags: this.all('SELECT * FROM transaction_tags'),
      accounts: this.all('SELECT * FROM accounts')
    };
  }

  importAllData(data) {
    this.db.exec('BEGIN TRANSACTION');
    try {
      const tables = ['families', 'family_members', 'tag_types', 'tag_values', 'transactions', 'transaction_tags', 'accounts'];
      tables.forEach(table => {
        this.db.exec(`DELETE FROM ${table}`);
        if (data[table] && data[table].length > 0) {
          const columns = Object.keys(data[table][0]);
          const placeholders = columns.map(() => '?').join(', ');
          const stmt = this.db.prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`);
          data[table].forEach(row => stmt.run(...columns.map(col => row[col])));
        }
      });
      this.db.exec('COMMIT');
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }

  clearAllData() {
    this.db.exec(`
      DELETE FROM transaction_tags;
      DELETE FROM transactions;
      DELETE FROM tag_values;
      DELETE FROM tag_types;
      DELETE FROM family_members;
      DELETE FROM families;
      DELETE FROM accounts;
    `);
    this.initDefaultData();
  }
}

module.exports = AppDatabase;
