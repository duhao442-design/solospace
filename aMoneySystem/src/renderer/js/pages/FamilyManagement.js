import api from '../api.js';

export default {
  name: 'FamilyManagement',
  data() {
    return {
      families: [],
      familyMembers: [],
      selectedFamily: null,
      loading: false,
      familyDialog: {
        visible: false,
        isEdit: false,
        form: {
          id: null,
          name: ''
        }
      },
      memberDialog: {
        visible: false,
        isEdit: false,
        form: {
          id: null,
          family_id: null,
          name: ''
        }
      }
    };
  },
  mounted() {
    this.loadFamilies();
  },
  methods: {
    async loadFamilies() {
      this.loading = true;
      this.families = await api.getFamilies();
      if (this.families.length > 0 && !this.selectedFamily) {
        this.selectedFamily = this.families[0].id;
        this.loadMembers();
      }
      this.loading = false;
    },
    
    async loadMembers() {
      if (this.selectedFamily) {
        this.familyMembers = await api.getFamilyMembers(this.selectedFamily);
      }
    },
    
    selectFamily(familyId) {
      this.selectedFamily = familyId;
      this.loadMembers();
    },
    
    openFamilyDialog(isEdit = false, family = null) {
      this.familyDialog.isEdit = isEdit;
      if (isEdit && family) {
        this.familyDialog.form = { ...family };
      } else {
        this.familyDialog.form = { id: null, name: '' };
      }
      this.familyDialog.visible = true;
    },
    
    async saveFamily() {
      if (!this.familyDialog.form.name.trim()) {
        ElementPlus.ElMessage.warning('请输入家庭名称');
        return;
      }
      
      try {
        if (this.familyDialog.isEdit) {
          await api.updateFamily(this.familyDialog.form.id, this.familyDialog.form.name);
          ElementPlus.ElMessage.success('更新成功');
        } else {
          await api.addFamily(this.familyDialog.form.name);
          ElementPlus.ElMessage.success('添加成功');
        }
        this.familyDialog.visible = false;
        this.loadFamilies();
      } catch (e) {
        ElementPlus.ElMessage.error('操作失败');
      }
    },
    
    deleteFamily(id) {
      ElementPlus.ElMessageBox.confirm('确定要删除这个家庭吗？相关成员也会被删除', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await api.deleteFamily(id);
          ElementPlus.ElMessage.success('删除成功');
          if (this.selectedFamily === id) {
            this.selectedFamily = null;
            this.familyMembers = [];
          }
          this.loadFamilies();
        } catch (e) {
          ElementPlus.ElMessage.error('删除失败');
        }
      }).catch(() => {});
    },
    
    openMemberDialog(isEdit = false, member = null) {
      this.memberDialog.isEdit = isEdit;
      if (isEdit && member) {
        this.memberDialog.form = { ...member };
      } else {
        this.memberDialog.form = { id: null, family_id: this.selectedFamily, name: '' };
      }
      this.memberDialog.visible = true;
    },
    
    async saveMember() {
      if (!this.memberDialog.form.name.trim()) {
        ElementPlus.ElMessage.warning('请输入成员名称');
        return;
      }
      
      try {
        if (this.memberDialog.isEdit) {
          await api.updateFamilyMember(this.memberDialog.form.id, this.memberDialog.form.name);
          ElementPlus.ElMessage.success('更新成功');
        } else {
          await api.addFamilyMember(this.memberDialog.form.family_id, this.memberDialog.form.name);
          ElementPlus.ElMessage.success('添加成功');
        }
        this.memberDialog.visible = false;
        this.loadMembers();
      } catch (e) {
        ElementPlus.ElMessage.error('操作失败');
      }
    },
    
    deleteMember(id) {
      ElementPlus.ElMessageBox.confirm('确定要删除这个成员吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await api.deleteFamilyMember(id);
          ElementPlus.ElMessage.success('删除成功');
          this.loadMembers();
        } catch (e) {
          ElementPlus.ElMessage.error('删除失败');
        }
      }).catch(() => {});
    }
  },
  template: `
    <div class="page-container family-page">
      <h1 class="page-title">家庭管理</h1>
      
      <div class="content-layout">
        <div class="family-sidebar">
          <div class="sidebar-header">
            <h3>家庭列表</h3>
            <el-button type="primary" size="small" @click="openFamilyDialog(false)">
              <el-icon><Plus /></el-icon>
            </el-button>
          </div>
          <div class="family-list" v-loading="loading">
            <div 
              v-for="family in families" 
              :key="family.id"
              class="family-item"
              :class="{ active: selectedFamily === family.id }"
              @click="selectFamily(family.id)"
            >
              <div class="family-name">
                <el-icon><HomeFilled /></el-icon>
                <span>{{ family.name }}</span>
              </div>
              <div class="family-actions">
                <el-button type="primary" link size="small" @click.stop="openFamilyDialog(true, family)">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button type="danger" link size="small" @click.stop="deleteFamily(family.id)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <el-empty v-if="families.length === 0" description="暂无家庭" />
          </div>
        </div>
        
        <div class="members-main">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">
                {{ families.find(f => f.id === selectedFamily)?.name || '请选择家庭' }} - 家庭成员
              </h3>
              <el-button 
                type="primary" 
                @click="openMemberDialog(false)"
                :disabled="!selectedFamily"
              >
                添加成员
              </el-button>
            </div>
            
            <el-table :data="familyMembers" style="width: 100%" v-loading="loading">
              <el-table-column type="index" label="序号" width="80" align="center" />
              <el-table-column prop="name" label="成员姓名" />
              <el-table-column prop="created_at" label="添加时间" width="200">
                <template #default="{ row }">{{ row.created_at }}</template>
              </el-table-column>
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="openMemberDialog(true, row)">编辑</el-button>
                  <el-button type="danger" link size="small" @click="deleteMember(row.id)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <el-empty v-if="familyMembers.length === 0 && selectedFamily" description="暂无成员，请添加" />
            <el-empty v-if="!selectedFamily" description="请先选择一个家庭" />
          </div>
        </div>
      </div>
      
      <el-dialog
        v-model="familyDialog.visible"
        :title="familyDialog.isEdit ? '编辑家庭' : '添加家庭'"
        width="400px"
      >
        <el-form :model="familyDialog.form" label-width="80px">
          <el-form-item label="家庭名称">
            <el-input v-model="familyDialog.form.name" placeholder="请输入家庭名称" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="familyDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="saveFamily">确定</el-button>
        </template>
      </el-dialog>
      
      <el-dialog
        v-model="memberDialog.visible"
        :title="memberDialog.isEdit ? '编辑成员' : '添加成员'"
        width="400px"
      >
        <el-form :model="memberDialog.form" label-width="80px">
          <el-form-item label="成员姓名">
            <el-input v-model="memberDialog.form.name" placeholder="请输入成员姓名" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="memberDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="saveMember">确定</el-button>
        </template>
      </el-dialog>
    </div>
  `
};

const style = document.createElement('style');
style.textContent = `
  .family-page {
    height: calc(100% - 48px);
  }
  
  .content-layout {
    display: flex;
    gap: 20px;
    height: 100%;
  }
  
  .family-sidebar {
    width: 280px;
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
  }
  
  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #ebeef5;
  }
  
  .sidebar-header h3 {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0;
  }
  
  .family-list {
    flex: 1;
    overflow-y: auto;
  }
  
  .family-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;
    margin-bottom: 8px;
  }
  
  .family-item:hover {
    background-color: #f5f7fa;
  }
  
  .family-item.active {
    background-color: #ecf5ff;
    color: #409eff;
  }
  
  .family-name {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
  }
  
  .family-actions {
    display: none;
  }
  
  .family-item:hover .family-actions {
    display: flex;
  }
  
  .members-main {
    flex: 1;
    min-width: 0;
  }
`;
document.head.appendChild(style);
