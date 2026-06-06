const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class AppDatabase {
  constructor() {
    this.db = null;
    this.dbPath = null;
  }

  async init() {
    const userDataPath = app ? app.getPath('userData') : './data';
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    this.dbPath = path.join(userDataPath, 'amoneysystem.db');

    const SQL = await initSqlJs();
    
    if (fs.existsSync(this.dbPath)) {
      const fileBuffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(fileBuffer);
    } else {
      this.db = new SQL.Database();
    }

    this.createTables();
    this.migrateDatabase();
    this.initDefaultData();
    this.save();
  }

  createTables() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS families (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS family_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id INTEGER,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id)
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS tag_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        is_second_level INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS tag_values (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tag_type_id INTEGER NOT NULL,
        parent_id INTEGER,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tag_type_id) REFERENCES tag_types(id),
        FOREIGN KEY (parent_id) REFERENCES tag_values(id)
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('asset', 'liability')),
        initial_balance REAL DEFAULT 0,
        balance REAL DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS account_balance_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        balance REAL NOT NULL,
        record_date TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts(id)
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        creator_id INTEGER,
        family_id INTEGER,
        account_id INTEGER,
        is_family_expense INTEGER DEFAULT 0,
        description TEXT,
        transaction_date TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id) REFERENCES family_members(id),
        FOREIGN KEY (family_id) REFERENCES families(id),
        FOREIGN KEY (account_id) REFERENCES accounts(id)
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS transaction_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id INTEGER NOT NULL,
        tag_type_id INTEGER NOT NULL,
        tag_value_id INTEGER NOT NULL,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id),
        FOREIGN KEY (tag_type_id) REFERENCES tag_types(id),
        FOREIGN KEY (tag_value_id) REFERENCES tag_values(id)
      );
    `);
  }

  migrateDatabase() {
    try {
      const accountsResult = this.db.exec("PRAGMA table_info(accounts)");
      const columns = accountsResult[0]?.values.map(v => v[1]) || [];
      
      if (!columns.includes('initial_balance')) {
        this.db.run('ALTER TABLE accounts ADD COLUMN initial_balance REAL DEFAULT 0');
      }
      if (!columns.includes('sort_order')) {
        this.db.run('ALTER TABLE accounts ADD COLUMN sort_order INTEGER DEFAULT 0');
      }
    } catch (e) {
      console.log('Migration error:', e);
    }

    try {
      const transactionsResult = this.db.exec("PRAGMA table_info(transactions)");
      const columns = transactionsResult[0]?.values.map(v => v[1]) || [];
      
      if (!columns.includes('account_id')) {
        this.db.run('ALTER TABLE transactions ADD COLUMN account_id INTEGER');
      }
    } catch (e) {
      console.log('Migration error:', e);
    }
  }

  initDefaultData() {
    const tagTypesResult = this.db.exec('SELECT COUNT(*) as count FROM tag_types');
    if (tagTypesResult.length === 0 || tagTypesResult[0].values[0][0] === 0) {
      const insertTagType = this.db.prepare('INSERT INTO tag_types (name, is_second_level) VALUES (?, ?)');
      const insertTagValue = this.db.prepare('INSERT INTO tag_values (tag_type_id, parent_id, name) VALUES (?, ?, ?)');

      insertTagType.run(['消费必要性', 0]);
      const necessityId = this.db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
      const necessityValues = ['必需品', '可选消费', '冲动消费', '无必要消费'];
      necessityValues.forEach(v => insertTagValue.run([necessityId, null, v]));

      insertTagType.run(['消费分类', 1]);
      const categoryId = this.db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
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
        insertTagValue.run([categoryId, null, cat.name]);
        const parentId = this.db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
        cat.children.forEach(child => insertTagValue.run([categoryId, parentId, child]));
      });

      insertTagType.run(['收入分类', 0]);
      const incomeTypeId = this.db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
      const incomeValues = ['工资', '奖金', '投资收益', '兼职', '其他收入'];
      incomeValues.forEach(v => insertTagValue.run([incomeTypeId, null, v]));

      this.db.run('INSERT INTO families (name) VALUES (?)', ['默认家庭']);
      const defaultFamilyId = this.db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
      this.db.run('INSERT INTO family_members (family_id, name) VALUES (?, ?)', [defaultFamilyId, '本人']);

      const insertAccount = this.db.prepare('INSERT INTO accounts (name, type, initial_balance, balance, sort_order) VALUES (?, ?, ?, ?, ?)');
      insertAccount.run(['现金', 'asset', 0, 0, 1]);
      insertAccount.run(['银行卡', 'asset', 0, 0, 2]);
      insertAccount.run(['支付宝', 'asset', 0, 0, 3]);
      insertAccount.run(['微信', 'asset', 0, 0, 4]);
      insertAccount.run(['信用卡', 'liability', 0, 0, 1]);
      insertAccount.run(['花呗', 'liability', 0, 0, 2]);
    }
  }

  save() {
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(this.dbPath, buffer);
  }

  query(sql, params = []) {
    return this.all(sql, params);
  }

  run(sql, params = []) {
    const stmt = this.db.prepare(sql);
    if (params && params.length > 0) {
      stmt.bind(params);
    }
    stmt.step();
    stmt.free();
    
    const lastIdStmt = this.db.prepare('SELECT last_insert_rowid() as id, changes() as changes');
    lastIdStmt.step();
    const result = lastIdStmt.getAsObject();
    lastIdStmt.free();
    
    this.save();
    return { lastInsertRowid: result.id, changes: result.changes };
  }

  get(sql, params = []) {
    const stmt = this.db.prepare(sql);
    if (params && params.length > 0) {
      stmt.bind(params);
    }
    const result = {};
    if (stmt.step()) {
      const row = stmt.getAsObject();
      Object.assign(result, row);
    }
    stmt.free();
    return Object.keys(result).length > 0 ? result : undefined;
  }

  all(sql, params = []) {
    const stmt = this.db.prepare(sql);
    if (params && params.length > 0) {
      stmt.bind(params);
    }
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  addAccount(account) {
    return this.run(
      'INSERT INTO accounts (name, type, initial_balance, balance, sort_order) VALUES (?, ?, ?, ?, ?)',
      [account.name, account.type, account.initial_balance || 0, account.initial_balance || 0, account.sort_order || 0]
    );
  }

  updateAccount(id, account) {
    const oldAccount = this.get('SELECT * FROM accounts WHERE id = ?', [id]);
    if (!oldAccount) return { changes: 0 };

    const balanceDiff = (account.initial_balance || 0) - (oldAccount.initial_balance || 0);
    const newBalance = oldAccount.balance + balanceDiff;

    return this.run(
      'UPDATE accounts SET name = ?, type = ?, initial_balance = ?, balance = ?, sort_order = ? WHERE id = ?',
      [account.name, account.type, account.initial_balance || 0, newBalance, account.sort_order || 0, id]
    );
  }

  deleteAccount(id) {
    return this.run('DELETE FROM accounts WHERE id = ?', [id]);
  }

  getAccounts(type = null) {
    let sql = 'SELECT * FROM accounts';
    let params = [];
    if (type) {
      sql += ' WHERE type = ?';
      params.push(type);
    }
    sql += ' ORDER BY sort_order, id';
    return this.all(sql, params);
  }

  getAccountById(id) {
    return this.get('SELECT * FROM accounts WHERE id = ?', [id]);
  }

  getTotalBalance(type) {
    const result = this.get('SELECT COALESCE(SUM(balance), 0) as total FROM accounts WHERE type = ?', [type]);
    return result ? result.total : 0;
  }

  getNetWorth() {
    const assets = this.getTotalBalance('asset');
    const liabilities = this.getTotalBalance('liability');
    return assets - liabilities;
  }

  updateAccountBalance(accountId, amount, transactionType) {
    const account = this.get('SELECT * FROM accounts WHERE id = ?', [accountId]);
    if (!account) return;

    let newBalance = account.balance;
    if (account.type === 'asset') {
      newBalance = transactionType === 'income' ? account.balance + amount : account.balance - amount;
    } else {
      newBalance = transactionType === 'expense' ? account.balance + amount : account.balance - amount;
    }

    this.run('UPDATE accounts SET balance = ? WHERE id = ?', [newBalance, accountId]);
  }

  addTransaction(transaction, tags = []) {
    this.db.run('BEGIN TRANSACTION');
    try {
      const result = this.run(
        'INSERT INTO transactions (amount, type, account_id, creator_id, family_id, is_family_expense, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          transaction.amount,
          transaction.type,
          transaction.account_id || null,
          transaction.creator_id || null,
          transaction.family_id || null,
          transaction.is_family_expense ? 1 : 0,
          transaction.description || '',
          transaction.transaction_date
        ]
      );

      const transactionId = result.lastInsertRowid;

      for (const tag of tags) {
        this.run(
          'INSERT INTO transaction_tags (transaction_id, tag_type_id, tag_value_id) VALUES (?, ?, ?)',
          [transactionId, tag.tag_type_id, tag.tag_value_id]
        );
      }

      if (transaction.account_id) {
        this.updateAccountBalance(transaction.account_id, transaction.amount, transaction.type);
      }

      this.db.run('COMMIT');
      this.save();
      return result;
    } catch (e) {
      this.db.run('ROLLBACK');
      throw e;
    }
  }

  deleteTransaction(id) {
    const transaction = this.get('SELECT * FROM transactions WHERE id = ?', [id]);
    if (!transaction) return { changes: 0 };

    this.db.run('BEGIN TRANSACTION');
    try {
      if (transaction.account_id) {
        this.revertAccountBalance(transaction.account_id, transaction.amount, transaction.type);
      }

      this.run('DELETE FROM transaction_tags WHERE transaction_id = ?', [id]);
      const result = this.run('DELETE FROM transactions WHERE id = ?', [id]);

      this.db.run('COMMIT');
      this.save();
      return result;
    } catch (e) {
      this.db.run('ROLLBACK');
      throw e;
    }
  }

  revertAccountBalance(accountId, amount, transactionType) {
    if (!accountId) return;
    const account = this.get('SELECT * FROM accounts WHERE id = ?', [accountId]);
    if (!account) return;

    let newBalance = account.balance;
    if (account.type === 'asset') {
      newBalance = transactionType === 'income' ? account.balance - amount : account.balance + amount;
    } else {
      newBalance = transactionType === 'expense' ? account.balance - amount : account.balance + amount;
    }

    this.run('UPDATE accounts SET balance = ? WHERE id = ?', [newBalance, accountId]);
  }

  getBalanceHistory(type = 'net', startDate = null, endDate = null) {
    const dates = [];
    const assetsData = [];
    const liabilitiesData = [];
    const netWorthData = [];

    let start, end;
    if (startDate) {
      start = new Date(startDate);
    } else {
      start = new Date();
      start.setDate(start.getDate() - 30);
    }
    if (endDate) {
      end = new Date(endDate);
    } else {
      end = new Date();
    }

    const initialAssets = this.get('SELECT COALESCE(SUM(initial_balance), 0) as total FROM accounts WHERE type = ?', ['asset']).total;
    const initialLiabilities = this.get('SELECT COALESCE(SUM(initial_balance), 0) as total FROM accounts WHERE type = ?', ['liability']).total;

    const transactions = this.all(`
      SELECT 
        date(transaction_date) as date,
        type,
        amount,
        a.type as account_type
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE 1=1
      ${startDate ? 'AND transaction_date >= ?' : ''}
      ${endDate ? 'AND transaction_date <= ?' : ''}
      ORDER BY transaction_date
    `, [startDate, endDate].filter(Boolean));

    let cumAssets = initialAssets;
    let cumLiabilities = initialLiabilities;
    let currentDate = null;
    let dailyAssetsChange = 0;
    let dailyLiabilitiesChange = 0;

    const dateMap = {};

    for (const tx of transactions) {
      if (!dateMap[tx.date]) {
        dateMap[tx.date] = { assets: 0, liabilities: 0 };
      }
      if (tx.account_type === 'asset') {
        if (tx.type === 'income') {
          dateMap[tx.date].assets += tx.amount;
        } else {
          dateMap[tx.date].assets -= tx.amount;
        }
      } else if (tx.account_type === 'liability') {
        if (tx.type === 'expense') {
          dateMap[tx.date].liabilities += tx.amount;
        } else {
          dateMap[tx.date].liabilities -= tx.amount;
        }
      }
    }

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dates.push(dateStr);

      if (dateMap[dateStr]) {
        cumAssets += dateMap[dateStr].assets;
        cumLiabilities += dateMap[dateStr].liabilities;
      }

      assetsData.push(cumAssets);
      liabilitiesData.push(cumLiabilities);
      netWorthData.push(cumAssets - cumLiabilities);
    }

    return dates.map((date, i) => ({
      date,
      assets: assetsData[i],
      liabilities: liabilitiesData[i],
      net_worth: netWorthData[i]
    }));
  }

  async exportAllData() {
    return {
      families: this.all('SELECT * FROM families'),
      family_members: this.all('SELECT * FROM family_members'),
      tag_types: this.all('SELECT * FROM tag_types'),
      tag_values: this.all('SELECT * FROM tag_values'),
      accounts: this.all('SELECT * FROM accounts'),
      account_balance_history: this.all('SELECT * FROM account_balance_history'),
      transactions: this.all('SELECT * FROM transactions'),
      transaction_tags: this.all('SELECT * FROM transaction_tags')
    };
  }

  async importAllData(data) {
    this.db.run('BEGIN TRANSACTION');
    try {
      const tables = ['families', 'family_members', 'tag_types', 'tag_values', 'accounts', 'account_balance_history', 'transactions', 'transaction_tags'];
      tables.forEach(table => {
        this.db.run(`DELETE FROM ${table}`);
        if (data[table] && data[table].length > 0) {
          const columns = Object.keys(data[table][0]);
          const placeholders = columns.map(() => '?').join(', ');
          const stmt = this.db.prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`);
          data[table].forEach(row => {
            stmt.run(columns.map(col => row[col]));
          });
          stmt.free();
        }
      });
      this.db.run('COMMIT');
      this.save();
    } catch (e) {
      this.db.run('ROLLBACK');
      throw e;
    }
  }

  async clearAllData() {
    this.db.run('DELETE FROM transaction_tags');
    this.db.run('DELETE FROM transactions');
    this.db.run('DELETE FROM tag_values');
    this.db.run('DELETE FROM tag_types');
    this.db.run('DELETE FROM family_members');
    this.db.run('DELETE FROM families');
    this.db.run('DELETE FROM account_balance_history');
    this.db.run('DELETE FROM accounts');
    this.initDefaultData();
    this.save();
  }
}

module.exports = AppDatabase;
