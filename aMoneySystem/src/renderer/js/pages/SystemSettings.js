import api from '../api.js';

export default {
  name: 'SystemSettings',
  data() {
    return {
      activeTab: 'tags',
      tagTypes: [],
      selectedTagType: null,
      tagValues: [],
      tagValuesTree: [],
      loading: false,
      
      tagTypeDialog: {
        visible: false,
        isEdit: false,
        form: {
          id: null,
          name: '',
          is_second_level: 0
        }
      },
      
      tagValueDialog: {
        visible: false,
        isEdit: false,
        form: {
          id: null,
          parent_id: null,
          name: ''
        }
      }
    };
  },
  mounted() {
    this.loadTagTypes();
  },
  methods: {
    async loadTagTypes() {
      this.tagTypes = await api.getTagTypes();
      if (this.tagTypes.length > 0) {
        this.selectedTagType = this.tagTypes[0];
        this.loadTagValues();
      }
    },
    
    async loadTagValues() {
      if (!this.selectedTagType) return;
      
      this.loading = true;
      this.tagValues = await api.getTagValues(this.selectedTagType.id);
      
      if (this.selectedTagType.is_second_level) {
        this.tagValuesTree = await api.getTagValuesTree(this.selectedTagType.id);
      } else {
        this.tagValuesTree = this.tagValues.map(v => ({ ...v, children: [] }));
      }
      this.loading = false;
    },
    
    selectTagType(type) {
      this.selectedTagType = type;
      this.loadTagValues();
    },
    
    openTagTypeDialog(isEdit = false, tagType = null) {
      this.tagTypeDialog.isEdit = isEdit;
      if (isEdit && tagType) {
        this.tagTypeDialog.form = { ...tagType };
      } else {
        this.tagTypeDialog.form = { id: null, name: '', is_second_level: 0 };
      }
      this.tagTypeDialog.visible = true;
    },
    
    async saveTagType() {
      if (!this.tagTypeDialog.form.name.trim()) {
        ElementPlus.ElMessage.warning('请输入类型名称');
        return;
      }
      
      try {
        if (this.tagTypeDialog.isEdit) {
          await api.updateTagType(
            this.tagTypeDialog.form.id,
            this.tagTypeDialog.form.name,
            this.tagTypeDialog.form.is_second_level
          );
          ElementPlus.ElMessage.success('更新成功');
        } else {
          await api.addTagType(
            this.tagTypeDialog.form.name,
            this.tagTypeDialog.form.is_second_level
          );
          ElementPlus.ElMessage.success('添加成功');
        }
        this.tagTypeDialog.visible = false;
        this.loadTagTypes();
      } catch (e) {
        ElementPlus.ElMessage.error('操作失败');
      }
    },
    
    deleteTagType(id) {
      ElementPlus.ElMessageBox.confirm('确定要删除这个标签类型吗？所有相关标签值也会被删除', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: '警告'
      }).then(async () => {
        try {
          await api.deleteTagType(id);
          ElementPlus.ElMessage.success('删除成功');
          if (this.selectedTagType?.id === id) {
            this.selectedTagType = null;
            this.tagValues = [];
          }
          this.loadTagTypes();
        } catch (e) {
          ElementPlus.ElMessage.error('删除失败');
        }
      }).catch(() => {});
    },
    
    openTagValueDialog(isEdit = false, tagValue = null, parentId = null) {
      this.tagValueDialog.isEdit = isEdit;
      if (isEdit && tagValue) {
        this.tagValueDialog.form = { ...tagValue };
      } else {
        this.tagValueDialog.form = {
          id: null, parent_id: parentId, name: '' };
      }
      this.tagValueDialog.visible = true;
    },
    
    async saveTagValue() {
      if (!this.tagValueDialog.form.name.trim()) {
        ElementPlus.ElMessage.warning('请输入标签名称');
        return;
      }
      
      try {
        if (this.tagValueDialog.isEdit) {
          await api.updateTagValue(
            this.tagValueDialog.form.id,
            this.tagValueDialog.form.name
          );
          ElementPlus.ElMessage.success('更新成功');
        } else {
          await api.addTagValue(
            this.selectedTagType.id,
            this.tagValueDialog.form.parent_id,
            this.tagValueDialog.form.name
          );
          ElementPlus.ElMessage.success('添加成功');
        }
        this.tagValueDialog.visible = false;
        this.loadTagValues();
      } catch (e) {
        ElementPlus.ElMessage.error('操作失败');
      }
    },
    
    deleteTagValue(id) {
      ElementPlus.ElMessageBox.confirm('确定要删除这个标签吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await api.deleteTagValue(id);
          ElementPlus.ElMessage.success('删除成功');
          this.loadTagValues();
        } catch (e) {
          ElementPlus.ElMessage.error('删除失败');
        }
      }).catch(() => {});
    },
    
    async exportData() {
      try {
        const filePath = await api.exportData();
        if (filePath) {
          ElementPlus.ElMessage.success('数据已导出到: ' + filePath);
        }
      } catch (e) {
        ElementPlus.ElMessage.error('导出失败');
      }
    },
    
    async importData() {
      try {
        const result = await api.importData();
        if (result) {
          ElementPlus.ElMessage.success('数据导入成功');
          this.loadTagTypes();
        }
      } catch (e) {
        ElementPlus.ElMessage.error('导入失败');
      }
    },
    
    async clearData() {
      ElementPlus.ElMessageBox.confirm(
        '确定要清空所有数据吗？此操作不可恢复！', '严重警告', {
        confirmButtonText: '确定清空',
        cancelButtonText: '取消',
        type: 'error',
        confirmButtonClass: 'el-button--danger'
      }).then(async () => {
        try {
          const result = await api.clearData();
          if (result) {
            ElementPlus.ElMessage.success('数据已清空');
            this.loadTagTypes();
          }
        } catch (e) {
            ElementPlus.ElMessage.error('操作失败');
          }
      }).catch(() => {});
    }
  },
  template: `
    <div class="page-container settings-page">
      <h1 class="page-title">系统管理</h1>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="标签配置" name="tags">
          <div class="tags-layout">
            <div class="tag-types-sidebar">
              <div class="sidebar-header">
                <h3>标签类型</h3>
                <el-button type="primary" size="small" @click="openTagTypeDialog(false)">
                  <el-icon><Plus /></el-icon>
                </el-button>
              </div>
              <div class="tag-types-list">
                <div 
                  v-for="type in tagTypes" 
                  :key="type.id"
                  class="tag-type-item"
                  :class="{ active: selectedTagType?.id === type.id }"
                  @click="selectTagType(type)"
                >
                  <div class="type-info">
                    <span class="type-name">{{ type.name }}</span>
                    <el-tag v-if="type.is_second_level" size="small" type="info">二级</el-tag>
                  </div>
                  <div class="type-actions">
                    <el-button type="primary" link size="small" @click.stop="openTagTypeDialog(true, type)">
                      <el-icon><Edit /></el-icon>
                    </el-button>
                    <el-button type="danger" link size="small" @click.stop="deleteTagType(type.id)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="tag-values-main">
              <div class="card">
                <div class="card-header">
                  <h3 class="card-title">
                    {{ selectedTagType?.name || '请选择标签类型' }} - 标签值
                  </h3>
                  <div class="actions">
                    <el-button 
                      type="primary" 
                      @click="openTagValueDialog(false, null, null)"
                      :disabled="!selectedTagType"
                    >
                      添加一级标签
                    </el-button>
                  </div>
                </div>
                
                <div v-if="selectedTagType?.is_second_level">
                  <el-table :data="tagValuesTree" style="width: 100%" row-key="id" v-loading="loading">
                    <el-table-column prop="name" label="一级分类" />
                    <el-table-column label="二级分类">
                      <template #default="{ row }">
                        <div v-if="row.children && row.children.length > 0">
                          <el-tag v-for="child in row.children" :key="child.id" size="small" style="margin-right: 8px; margin-bottom: 4px;">
                            {{ child.name }}
                            <el-button type="primary" link @click.stop="openTagValueDialog(true, child)" style="margin-left: 4px;">
                              <el-icon><Edit /></el-icon>
                            </el-button>
                            <el-button type="danger" link @click.stop="deleteTagValue(child.id)" style="margin-left: 4px;">
                              <el-icon><Delete /></el-icon>
                            </el-button>
                          </el-tag>
                        </div>
                        <el-button v-else type="primary" link size="small" @click="openTagValueDialog(false, null, row.id)">
                          <el-icon><Plus /></el-icon>添加子分类
                        </el-button>
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="150">
                      <template #default="{ row }">
                        <el-button type="primary" link size="small" @click="openTagValueDialog(true, row)">编辑</el-button>
                        <el-button type="danger" link size="small" @click="deleteTagValue(row.id)">删除</el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                
                <el-table v-else :data="tagValues" style="width: 100%" v-loading="loading">
                  <el-table-column type="index" label="序号" width="80" align="center" />
                  <el-table-column prop="name" label="标签名称" />
                  <el-table-column prop="created_at" label="创建时间" width="200" />
                  <el-table-column label="操作" width="150">
                    <template #default="{ row }">
                      <el-button type="primary" link size="small" @click="openTagValueDialog(true, row)">编辑</el-button>
                      <el-button type="danger" link size="small" @click="deleteTagValue(row.id)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
                
                <el-empty v-if="!selectedTagType" description="请先选择标签类型" />
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="数据管理" name="data">
          <div class="card">
            <h3 class="card-title">数据导入导出</h3>
            <p class="description">
              您可以导出所有数据进行备份，或导入之前备份的数据文件。</p>
            
            <div class="data-actions">
              <el-button type="primary" size="large" @click="exportData">
                <el-icon><Download /></el-icon>
                导出数据
              </el-button>
              <el-button size="large" @click="importData">
                <el-icon><Upload /></el-icon>
                导入数据
              </el-button>
              <el-button type="danger" size="large" @click="clearData">
                <el-icon><Delete /></el-icon>
                清空数据
              </el-button>
            </div>
            
            <el-alert
              title="注意事项"
              type="warning"
              :closable="false"
              style="margin-top: 20px;"
            >
              <ul>
                <li>导出的数据可以通过导入功能恢复</li>
                <li>导入数据会覆盖当前所有数据</li>
                <li>清空数据会删除所有账单、家庭、标签等所有数据</li>
                <li>请谨慎操作，建议先导出备份</li>
              </ul>
            </el-alert>
          </div>
        </el-tab-pane>
      </el-tabs>
      
      <el-dialog
        v-model="tagTypeDialog.visible"
        :title="tagTypeDialog.isEdit ? '编辑标签类型' : '添加标签类型'"
        width="450px"
      >
        <el-form :model="tagTypeDialog.form" label-width="100px">
          <el-form-item label="类型名称">
            <el-input v-model="tagTypeDialog.form.name" placeholder="请输入类型名称" />
          </el-form-item>
          <el-form-item label="二级分类">
            <el-switch v-model="tagTypeDialog.form.is_second_level" :active-value="1" :inactive-value="0" />
            <span style="margin-left: 10px; color: #909399;">开启后支持二级子分类</span>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="tagTypeDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="saveTagType">确定</el-button>
        </template>
      </el-dialog>
      
      <el-dialog
        v-model="tagValueDialog.visible"
        :title="tagValueDialog.isEdit ? '编辑标签' : '添加标签'"
        width="450px"
      >
        <el-form :model="tagValueDialog.form" label-width="100px">
          <el-form-item label="标签名称">
            <el-input v-model="tagValueDialog.form.name" placeholder="请输入标签名称" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="tagValueDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="saveTagValue">确定</el-button>
        </template>
      </el-dialog>
    </div>
  `
};

const style = document.createElement('style');
style.textContent = `
  .settings-page {
    height: calc(100% - 48px);
  }
  
  .tags-layout {
    display: flex;
    gap: 20px;
    height: 100%;
  }
  
  .tag-types-sidebar {
    width: 260px;
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
  
  .tag-types-list {
    flex: 1;
    overflow-y: auto;
  }
  
  .tag-type-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;
    margin-bottom: 8px;
  }
  
  .tag-type-item:hover {
    background-color: #f5f7fa;
  }
  
  .tag-type-item.active {
    background-color: #ecf5ff;
  }
  
  .type-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .type-name {
    font-weight: 500;
  }
  
  .type-actions {
    display: none;
  }
  
  .tag-type-item:hover .type-actions {
    display: flex;
  }
  
  .tag-values-main {
    flex: 1;
    min-width: 0;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .description {
    color: #909399;
    margin-bottom: 20px;
  }
  
  .data-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
`;
document.head.appendChild(style);
