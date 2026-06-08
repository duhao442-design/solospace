<template>
  <div class="location-api">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>归属地API配置</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增API
          </el-button>
        </div>
      </template>

      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="apiName" label="API名称" width="150" />
        <el-table-column prop="apiUrl" label="API地址" min-width="250" show-overflow-tooltip />
        <el-table-column prop="requestMethod" label="请求方式" width="100" />
        <el-table-column prop="countryField" label="国家字段" width="120" />
        <el-table-column prop="provinceField" label="省份字段" width="120" />
        <el-table-column prop="cityField" label="城市字段" width="120" />
        <el-table-column prop="dailyQuota" label="每日额度" width="100" />
        <el-table-column prop="usedCountToday" label="今日已用" width="100" />
        <el-table-column prop="priority" label="优先级" width="80" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="API名称" prop="apiName">
              <el-input v-model="form.apiName" placeholder="请输入API名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="请求方式" prop="requestMethod">
              <el-select v-model="form.requestMethod" style="width: 100%">
                <el-option label="GET" value="GET" />
                <el-option label="POST" value="POST" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="API地址" prop="apiUrl">
          <el-input v-model="form.apiUrl" placeholder="支持{ip}占位符" />
        </el-form-item>
        <el-form-item label="请求参数">
          <el-input v-model="form.requestParams" type="textarea" :rows="2" placeholder="JSON格式，支持{ip}占位符" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="国家字段">
              <el-input v-model="form.countryField" placeholder="返回JSON中的字段名" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="省份字段">
              <el-input v-model="form.provinceField" placeholder="返回JSON中的字段名" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="城市字段">
              <el-input v-model="form.cityField" placeholder="返回JSON中的字段名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="归属地字段">
          <el-input v-model="form.locationField" placeholder="多个用逗号分隔，如: country,city" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="每日额度">
              <el-input v-model="form.dailyQuota" type="number" placeholder="0表示不限" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="优先级">
              <el-input v-model="form.priority" type="number" placeholder="数字越大优先级越高" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态">
              <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getLocationApiList,
  saveLocationApi,
  deleteLocationApi
} from '@/api/system'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)

const form = reactive({
  id: null,
  apiName: '',
  apiUrl: '',
  requestMethod: 'GET',
  requestParams: '',
  countryField: '',
  provinceField: '',
  cityField: '',
  locationField: '',
  dailyQuota: 0,
  priority: 0,
  status: 1
})

const rules = {
  apiName: [{ required: true, message: '请输入API名称', trigger: 'blur' }],
  apiUrl: [{ required: true, message: '请输入API地址', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    tableData.value = await getLocationApiList()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  dialogTitle.value = '新增API'
  Object.assign(form, {
    id: null,
    apiName: '',
    apiUrl: '',
    requestMethod: 'GET',
    requestParams: '',
    countryField: '',
    provinceField: '',
    cityField: '',
    locationField: '',
    dailyQuota: 0,
    priority: 0,
    status: 1
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑API'
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    await saveLocationApi(form)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    if (e !== false) console.error(e)
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该API配置吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    await deleteLocationApi(row.id)
    ElMessage.success('删除成功')
    loadData()
  }).catch(() => {})
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.location-api {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}
</style>
