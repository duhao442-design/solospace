import api from '../api.js';

export default {
  name: 'AccountManagement',
  data() {
    return {
      activeTab: 'asset',
      assetAccounts: [],
      liabilityAccounts: [],
      loading: false,
      
      accountDialog: {
        visible: false,
        isEdit: false,
        form: {
          id: null,
          name: '',
          type: 'asset',
          initial_balance: 0,
          description: ''
        }
      }
    };
  },
  mounted() {
    this.loadAccounts();
  },
  methods: {
    async loadAccounts() {
      this.loading = true;
      this.assetAccounts = await api.getAccounts('asset');
      this.liabilityAccounts = await api.getAccounts('liability');
      this.loading = false;
    },
    
    openAddDialog() {
      this.accountDialog.isEdit = false;
      this.accountDialog.form = {
        id: null,
        name: '',
        type: this.activeTab,
        initial_balance: 0,
        description: ''
      };
      this.accountDialog.visible = true;
    },
    
    openEditDialog(account) {
      this.accountDialog.isEdit = true;
      this.accountDialog.form = { ...account };
      this.accountDialog.visible = true;
    },
    
    async saveAccount() {
      if (!this.accountDialog.form.name.trim()) {
        ElementPlus.ElMessage.warning('请输入账户名称');
        return;
      }
      
      try {
        if (this.accountDialog.isEdit) {
          await api.updateAccount(this.accountDialog.form.id, this.accountDialog.form);
          ElementPlus.ElMessage.success('更新成功');
        } else {
          await api.addAccount(this.accountDialog.form);
          ElementPlus.ElMessage.success('添加成功');
        }
        this.accountDialog.visible = false;
        this.loadAccounts();
      } catch (e) {
        ElementPlus.ElMessage.error('操作失败');
      }
    },
    
    async deleteAccount(account) {
      try {
        await ElementPlus.ElMessageBox.confirm(
          `确定要删除账户"${account.name}"吗？`,
          '确认删除',
          { type: 'warning' }
        );
        await api.deleteAccount(account.id);
        ElementPlus.ElMessage.success('删除成功');
        this.loadAccounts();
      } catch (e) {
        if (e !== 'cancel') {
          ElementPlus.ElMessage.error('删除失败');
        }
      }
    },
    
    formatMoney(value) {
      return '¥' + Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
  },
  template: `
    <div class="account-management page-container">
      <h2 class="page-title">账户管理</h2>
      
      <el-tabs v-model="activeTab" class="account-tabs">
        <el-tab-pane label="资产账户" name="asset">
          <div class="account-list-header">
            <el-button type="primary" @click="openAddDialog">
              <el-icon><Plus /></el-icon>
              新增资产账户
            </el-button>
          </div>
          
          <el-table :data="assetAccounts" v-loading="loading" class="account-table">
            <el-table-column prop="name" label="账户名称" width="200" />
            <el-table-column prop="description" label="描述" />
            <el-table-column label="初始余额" width="180">
              <template #default="scope">
                <span class="money-positive">{{ formatMoney(scope.row.initial_balance) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="当前余额" width="180">
              <template #default="scope">
                <span class="money-positive">{{ formatMoney(scope.row.balance) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="scope">
                <el-button size="small" @click="openEditDialog(scope.row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteAccount(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="account-summary" v-if="assetAccounts.length > 0">
            <span>总资产：</span>
            <span class="money-positive summary-value">
              {{ formatMoney(assetAccounts.reduce((sum, a) => sum + Number(a.balance), 0)) }}
            </span>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="负债账户" name="liability">
          <div class="account-list-header">
            <el-button type="primary" @click="openAddDialog">
              <el-icon><Plus /></el-icon>
              新增负债账户
            </el-button>
          </div>
          
          <el-table :data="liabilityAccounts" v-loading="loading" class="account-table">
            <el-table-column prop="name" label="账户名称" width="200" />
            <el-table-column prop="description" label="描述" />
            <el-table-column label="初始余额" width="180">
              <template #default="scope">
                <span class="money-negative">{{ formatMoney(scope.row.initial_balance) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="当前余额" width="180">
              <template #default="scope">
                <span class="money-negative">{{ formatMoney(scope.row.balance) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="scope">
                <el-button size="small" @click="openEditDialog(scope.row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteAccount(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="account-summary" v-if="liabilityAccounts.length > 0">
            <span>总负债：</span>
            <span class="money-negative summary-value">
              {{ formatMoney(liabilityAccounts.reduce((sum, a) => sum + Number(a.balance), 0)) }}
            </span>
          </div>
        </el-tab-pane>
      </el-tabs>
      
      <el-dialog
        v-model="accountDialog.visible"
        :title="accountDialog.isEdit ? '编辑账户' : '新增账户'"
        width="500px"
      >
        <el-form :model="accountDialog.form" label-width="100px">
          <el-form-item label="账户名称">
            <el-input v-model="accountDialog.form.name" placeholder="请输入账户名称" />
          </el-form-item>
          <el-form-item label="账户类型">
            <el-tag :type="accountDialog.form.type === 'asset' ? 'success' : 'danger'">
              {{ accountDialog.form.type === 'asset' ? '资产账户' : '负债账户' }}
            </el-tag>
          </el-form-item>
          <el-form-item label="初始余额">
            <el-input-number v-model="accountDialog.form.initial_balance" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="accountDialog.form.description" type="textarea" :rows="3" placeholder="请输入描述（可选）" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="accountDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="saveAccount">确定</el-button>
        </template>
      </el-dialog>
    </div>
  `
};

const style = document.createElement('style');
style.textContent = `
  .account-management {
    padding: 20px;
  }
  
  .page-title {
    margin: 0 0 20px 0;
    font-size: 24px;
    color: #303133;
  }
  
  .account-tabs {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }
  
  .account-list-header {
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .account-table {
    margin-bottom: 16px;
  }
  
  .account-summary {
    padding: 16px;
    background: #f5f7fa;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 500;
    text-align: right;
  }
  
  .summary-value {
    font-size: 20px;
    font-weight: 600;
  }
  
  .money-positive {
    color: #67c23a;
    font-weight: 500;
  }
  
  .money-negative {
    color: #f56c6c;
    font-weight: 500;
  }
`;
document.head.appendChild(style);
