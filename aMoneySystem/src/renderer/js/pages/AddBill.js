import api from '../api.js';

export default {
  name: 'AddBill',
  data() {
    return {
      form: {
        amount: null,
        type: 'expense',
        creator_id: null,
        family_id: null,
        is_family_expense: false,
        description: '',
        transaction_date: new Date().toISOString().split('T')[0]
      },
      families: [],
      members: [],
      tagTypes: [],
      tagValuesMap: {},
      selectedTags: {},
      loading: false
    };
  },
  mounted() {
    this.loadFamilies();
    this.loadTagTypes();
  },
  methods: {
    async loadFamilies() {
      this.families = await api.getFamilies();
      if (this.families.length > 0) {
        this.form.family_id = this.families[0].id;
        this.loadMembers();
      }
    },
    
    async loadMembers() {
      if (this.form.family_id) {
        this.members = await api.getFamilyMembers(this.form.family_id);
        if (this.members.length > 0 && !this.form.creator_id) {
          this.form.creator_id = this.members[0].id;
        }
      }
    },
    
    async loadTagTypes() {
      this.tagTypes = await api.getTagTypes();
      
      for (const type of this.tagTypes) {
        if (type.is_second_level) {
          this.tagValuesMap[type.id] = await api.getTagValuesTree(type.id);
        } else {
          this.tagValuesMap[type.id] = await api.getTagValues(type.id);
        }
        this.selectedTags[type.id] = null;
      }
    },
    
    onFamilyChange() {
      this.loadMembers();
    },
    
    async submit() {
      if (!this.form.amount || this.form.amount <= 0) {
        ElementPlus.ElMessage.warning('请输入有效金额');
        return;
      }
      if (!this.form.creator_id) {
        ElementPlus.ElMessage.warning('请选择记账人');
        return;
      }
      
      const tags = [];
      for (const [tagTypeId, tagValueId] of Object.entries(this.selectedTags)) {
        if (tagValueId) {
          tags.push({
            tag_type_id: parseInt(tagTypeId),
            tag_value_id: tagValueId
          });
        }
      }
      
      this.loading = true;
      try {
        await api.addTransaction(this.form, tags);
        ElementPlus.ElMessage.success('账单添加成功');
        this.resetForm();
      } catch (e) {
        console.error(e);
        ElementPlus.ElMessage.error('添加失败');
      }
      this.loading = false;
    },
    
    resetForm() {
      this.form = {
        amount: null,
        type: 'expense',
        creator_id: this.members.length > 0 ? this.members[0].id : null,
        family_id: this.families.length > 0 ? this.families[0].id : null,
        is_family_expense: false,
        description: '',
        transaction_date: new Date().toISOString().split('T')[0]
      };
      for (const key in this.selectedTags) {
        this.selectedTags[key] = null;
      }
    },
    
    getTagTypePlaceholder(type) {
      if (type.name === '消费分类') return '请选择消费分类';
      if (type.name === '消费必要性') return '请选择消费必要性';
      if (type.name === '收入分类') return '请选择收入分类';
      return '请选择' + type.name;
    },
    
    getTagTypeTreeData(typeId) {
      const values = this.tagValuesMap[typeId] || [];
      return values.map(v => ({
        value: v.id,
        label: v.name,
        children: v.children ? v.children.map(c => ({
          value: c.id,
          label: c.name
        })) : undefined
      }));
    }
  },
  template: `
    <div class="page-container add-bill-page">
      <h1 class="page-title">新增账单</h1>
      
      <div class="card form-card">
        <el-form :model="form" label-width="100px" size="large">
          <div class="form-row">
            <div class="form-col">
              <el-form-item label="账单类型">
                <el-radio-group v-model="form.type" size="large">
                  <el-radio-button label="expense">支出</el-radio-button>
                  <el-radio-button label="income">收入</el-radio-button>
                </el-radio-group>
              </el-form-item>
            </div>
            <div class="form-col">
              <el-form-item label="金额">
                <el-input-number 
                  v-model="form.amount" 
                  :min="0" 
                  :precision="2" 
                  size="large"
                  style="width: 100%"
                  placeholder="请输入金额"
                />
              </el-form-item>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-col">
              <el-form-item label="日期">
                <el-date-picker
                  v-model="form.transaction_date"
                  type="date"
                  placeholder="选择日期"
                  size="large"
                  style="width: 100%"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
            </div>
            <div class="form-col">
              <el-form-item label="所属家庭">
                <el-select 
                  v-model="form.family_id" 
                  placeholder="请选择家庭" 
                  size="large"
                  style="width: 100%"
                  @change="onFamilyChange"
                >
                  <el-option 
                    v-for="family in families" 
                    :key="family.id" 
                    :label="family.name" 
                    :value="family.id" 
                  />
                </el-select>
              </el-form-item>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-col">
              <el-form-item label="记账人">
                <el-select 
                  v-model="form.creator_id" 
                  placeholder="请选择记账人" 
                  size="large"
                  style="width: 100%"
                >
                  <el-option 
                    v-for="member in members" 
                    :key="member.id" 
                    :label="member.name" 
                    :value="member.id" 
                  />
                </el-select>
              </el-form-item>
            </div>
            <div class="form-col">
              <el-form-item label="家庭支出">
                <el-switch v-model="form.is_family_expense" />
                <span style="margin-left: 10px; color: #909399;">标记为家庭共同支出</span>
              </el-form-item>
            </div>
          </div>
          
          <el-divider content-position="left">标签分类</el-divider>
          
          <div class="form-row tags-row">
            <div class="form-col" v-for="type in tagTypes" :key="type.id">
              <el-form-item :label="type.name">
                <template v-if="type.is_second_level">
                  <el-cascader
                    v-model="selectedTags[type.id]"
                    :options="getTagTypeTreeData(type.id)"
                    :props="{ checkStrictly: true }"
                    size="large"
                    style="width: 100%"
                    :placeholder="getTagTypePlaceholder(type)"
                    clearable
                  />
                </template>
                <template v-else>
                  <el-select 
                    v-model="selectedTags[type.id]" 
                    :placeholder="getTagTypePlaceholder(type)"
                    size="large"
                    style="width: 100%"
                    clearable
                  >
                    <el-option 
                      v-for="tag in tagValuesMap[type.id] || []" 
                      :key="tag.id" 
                      :label="tag.name" 
                      :value="tag.id" 
                    />
                  </el-select>
                </template>
              </el-form-item>
            </div>
          </div>
          
          <el-form-item label="备注">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              placeholder="请输入备注信息（选填）"
            />
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" size="large" @click="submit" :loading="loading" style="width: 160px;">
              保存账单
            </el-button>
            <el-button size="large" @click="resetForm" style="margin-left: 12px;">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  `
};

const style = document.createElement('style');
style.textContent = `
  .add-bill-page {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .form-card {
    padding: 32px;
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  
  .form-col {
    min-width: 0;
  }
  
  .tags-row {
    grid-template-columns: 1fr 1fr 1fr;
  }
  
  .el-form-item__label {
    font-weight: 500;
  }
  
  .el-input-number {
    width: 100%;
  }
  
  .el-input-number :deep(.el-input__wrapper) {
    width: 100%;
  }
  
  @media (max-width: 768px) {
    .form-row,
    .tags-row {
      grid-template-columns: 1fr;
    }
  }
`;
document.head.appendChild(style);
