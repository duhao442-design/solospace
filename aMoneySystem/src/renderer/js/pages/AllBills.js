import api from '../api.js';

export default {
  name: 'AllBills',
  data() {
    return {
      transactions: [],
      loading: false,
      filters: {
        dateRange: [],
        type: ''
      },
      currentPage: 1,
      pageSize: 20,
      total: 0
    };
  },
  mounted() {
    this.loadData();
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        let startDate = null;
        let endDate = null;
        
        if (this.filters.dateRange.length === 2) {
          startDate = this.filters.dateRange[0];
          endDate = this.filters.dateRange[1];
        } else {
          startDate = oneMonthAgo.toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
        }
        
        const type = this.filters.type || null;
        const allTransactions = await api.getTransactions(startDate, endDate, type);
        
        this.total = allTransactions.length;
        const start = (this.currentPage - 1) * this.pageSize;
        this.transactions = allTransactions.slice(start, start + this.pageSize);
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
    },
    
    formatAmount(amount) {
      return '¥' + parseFloat(amount).toFixed(2);
    },
    
    getTypeText(type) {
      return type === 'income' ? '收入' : '支出';
    },
    
    getTypeTagType(type) {
      return type === 'income' ? 'success' : 'danger';
    },
    
    async deleteTransaction(id) {
      try {
        await api.deleteTransaction(id);
        ElementPlus.ElMessage.success('删除成功');
        this.loadData();
      } catch (e) {
        ElementPlus.ElMessage.error('删除失败');
      }
    },
    
    confirmDelete(id) {
      ElementPlus.ElMessageBox.confirm('确定要删除这笔账单吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.deleteTransaction(id);
      }).catch(() => {});
    },
    
    handleSizeChange(val) {
      this.pageSize = val;
      this.loadData();
    },
    
    handleCurrentChange(val) {
      this.currentPage = val;
      this.loadData();
    },
    
    resetFilters() {
      this.filters = {
        dateRange: [],
        type: ''
      };
      this.currentPage = 1;
      this.loadData();
    }
  },
  template: `
    <div class="page-container">
      <h1 class="page-title">全部账单</h1>
      
      <div class="card">
        <div class="filter-bar">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="default"
          />
          <el-select v-model="filters.type" placeholder="全部类型" clearable size="default" style="width: 120px;">
            <el-option label="收入" value="income" />
            <el-option label="支出" value="expense" />
          </el-select>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </div>
        
        <el-table :data="transactions" style="width: 100%; margin-top: 20px;" v-loading="loading">
          <el-table-column prop="transaction_date" label="日期" width="120" sortable />
          <el-table-column prop="type" label="类型" width="80">
            <template #default="{ row }">
              <el-tag :type="getTypeTagType(row.type)" size="small">
                {{ getTypeText(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" width="120">
            <template #default="{ row }">
              <span :style="{ color: row.type === 'income' ? '#67c23a' : '#f56c6c', fontWeight: 600 }">
                {{ row.type === 'income' ? '+' : '-' }}{{ formatAmount(row.amount) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="creator_name" label="记账人" width="100" />
          <el-table-column prop="family_name" label="所属家庭" width="120" />
          <el-table-column prop="is_family_expense" label="家庭支出" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.is_family_expense" type="info" size="small">是</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="tag_names" label="标签" />
          <el-table-column prop="description" label="备注" show-overflow-tooltip />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button type="danger" link size="small" @click="confirmDelete(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination">
          <el-pagination
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="pageSize"
            :current-page="currentPage"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
  `
};

const style = document.createElement('style');
style.textContent = `
  .filter-bar {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
`;
document.head.appendChild(style);
