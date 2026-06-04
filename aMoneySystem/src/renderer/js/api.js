const db = window.electronAPI.db;
const dataApi = window.electronAPI.data;

export default {
  async getFamilies() {
    return await db.all('SELECT * FROM families ORDER BY created_at DESC');
  },
  
  async addFamily(name) {
    return await db.run('INSERT INTO families (name) VALUES (?)', [name]);
  },
  
  async updateFamily(id, name) {
    return await db.run('UPDATE families SET name = ? WHERE id = ?', [name, id]);
  },
  
  async deleteFamily(id) {
    return await db.run('DELETE FROM families WHERE id = ?', [id]);
  },
  
  async getFamilyMembers(familyId = null) {
    let sql = 'SELECT fm.*, f.name as family_name FROM family_members fm LEFT JOIN families f ON fm.family_id = f.id';
    let params = [];
    if (familyId) {
      sql += ' WHERE fm.family_id = ?';
      params.push(familyId);
    }
    sql += ' ORDER BY fm.created_at DESC';
    return await db.all(sql, params);
  },
  
  async addFamilyMember(familyId, name) {
    return await db.run('INSERT INTO family_members (family_id, name) VALUES (?, ?)', [familyId, name]);
  },
  
  async updateFamilyMember(id, name) {
    return await db.run('UPDATE family_members SET name = ? WHERE id = ?', [name, id]);
  },
  
  async deleteFamilyMember(id) {
    return await db.run('DELETE FROM family_members WHERE id = ?', [id]);
  },
  
  async getTagTypes() {
    return await db.all('SELECT * FROM tag_types ORDER BY created_at');
  },
  
  async addTagType(name, isSecondLevel = 0) {
    return await db.run('INSERT INTO tag_types (name, is_second_level) VALUES (?, ?)', [name, isSecondLevel]);
  },
  
  async updateTagType(id, name, isSecondLevel) {
    return await db.run('UPDATE tag_types SET name = ?, is_second_level = ? WHERE id = ?', [name, isSecondLevel, id]);
  },
  
  async deleteTagType(id) {
    await db.run('DELETE FROM tag_values WHERE tag_type_id = ?', [id]);
    return await db.run('DELETE FROM tag_types WHERE id = ?', [id]);
  },
  
  async getTagValues(tagTypeId = null) {
    let sql = 'SELECT * FROM tag_values';
    let params = [];
    if (tagTypeId) {
      sql += ' WHERE tag_type_id = ?';
      params.push(tagTypeId);
    }
    sql += ' ORDER BY parent_id, created_at';
    return await db.all(sql, params);
  },
  
  async getTagValuesTree(tagTypeId) {
    const allValues = await this.getTagValues(tagTypeId);
    const parents = allValues.filter(v => !v.parent_id);
    return parents.map(parent => ({
      ...parent,
      children: allValues.filter(v => v.parent_id === parent.id)
    }));
  },
  
  async addTagValue(tagTypeId, parentId, name) {
    return await db.run('INSERT INTO tag_values (tag_type_id, parent_id, name) VALUES (?, ?, ?)', [tagTypeId, parentId, name]);
  },
  
  async updateTagValue(id, name) {
    return await db.run('UPDATE tag_values SET name = ? WHERE id = ?', [name, id]);
  },
  
  async deleteTagValue(id) {
    return await db.run('DELETE FROM tag_values WHERE id = ?', [id]);
  },
  
  async addTransaction(transaction, tags = []) {
    const result = await db.run(
      'INSERT INTO transactions (amount, type, creator_id, family_id, is_family_expense, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [transaction.amount, transaction.type, transaction.creator_id, transaction.family_id, transaction.is_family_expense ? 1 : 0, transaction.description, transaction.transaction_date]
    );
    
    const transactionId = result.lastInsertRowid;
    for (const tag of tags) {
      await db.run(
        'INSERT INTO transaction_tags (transaction_id, tag_type_id, tag_value_id) VALUES (?, ?, ?)',
        [transactionId, tag.tag_type_id, tag.tag_value_id]
      );
    }
    
    return result;
  },
  
  async getTransactions(startDate = null, endDate = null, type = null, limit = null) {
    let sql = `
      SELECT t.*, fm.name as creator_name, f.name as family_name,
             GROUP_CONCAT(DISTINCT tv.name) as tag_names
      FROM transactions t
      LEFT JOIN family_members fm ON t.creator_id = fm.id
      LEFT JOIN families f ON t.family_id = f.id
      LEFT JOIN transaction_tags tt ON t.id = tt.transaction_id
      LEFT JOIN tag_values tv ON tt.tag_value_id = tv.id
      WHERE 1=1
    `;
    let params = [];
    
    if (startDate) {
      sql += ' AND t.transaction_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND t.transaction_date <= ?';
      params.push(endDate);
    }
    if (type) {
      sql += ' AND t.type = ?';
      params.push(type);
    }
    
    sql += ' GROUP BY t.id ORDER BY t.transaction_date DESC, t.created_at DESC';
    
    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }
    
    return await db.all(sql, params);
  },
  
  async getTransactionDetail(id) {
    const transaction = await db.get('SELECT * FROM transactions WHERE id = ?', [id]);
    if (transaction) {
      transaction.tags = await db.all(`
        SELECT tt.*, tt.name as type_name, tv.name as value_name
        FROM transaction_tags tt
        LEFT JOIN tag_types tty ON tt.tag_type_id = tty.id
        LEFT JOIN tag_values tv ON tt.tag_value_id = tv.id
        WHERE tt.transaction_id = ?
      `, [id]);
    }
    return transaction;
  },
  
  async deleteTransaction(id) {
    await db.run('DELETE FROM transaction_tags WHERE transaction_id = ?', [id]);
    return await db.run('DELETE FROM transactions WHERE id = ?', [id]);
  },
  
  async getTotalByType(type, startDate = null, endDate = null) {
    let sql = 'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = ?';
    let params = [type];
    
    if (startDate) {
      sql += ' AND transaction_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND transaction_date <= ?';
      params.push(endDate);
    }
    
    const result = await db.get(sql, params);
    return result.total;
  },
  
  async getExpenseByTag(tagTypeId, startDate = null, endDate = null) {
    let sql = `
      SELECT tv.id, tv.name, SUM(t.amount) as amount, COUNT(*) as count
      FROM transactions t
      LEFT JOIN transaction_tags tt ON t.id = tt.transaction_id
      LEFT JOIN tag_values tv ON tt.tag_value_id = tv.id
      WHERE t.type = 'expense' AND tt.tag_type_id = ?
    `;
    let params = [tagTypeId];
    
    if (startDate) {
      sql += ' AND t.transaction_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND t.transaction_date <= ?';
      params.push(endDate);
    }
    
    sql += ' GROUP BY tv.id, tv.name ORDER BY amount DESC';
    
    return await db.all(sql, params);
  },
  
  async exportData() {
    return await dataApi.export();
  },
  
  async importData() {
    return await dataApi.import();
  },
  
  async clearData() {
    return await dataApi.clear();
  }
};
