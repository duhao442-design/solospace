<template>
  <div class="page-container">
    <div class="search-bar">
      <el-input
        v-model="keyword"
        placeholder="搜索API名称"
        clearable
        style="width: 250px;"
        @keyup.enter="loadData"
      />
      <el-select v-model="statusFilter" placeholder="状态" clearable style="width: 120px;">
        <el-option label="启用" :value="1" />
        <el-option label="禁用" :value="0" />
      </el-select>
      <el-button type="primary" @click="loadData">搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button type="success" @click="handleAdd">新增API</el-button>
    </div>

    <el-table :data="tableData" border v-loading="loading" style="width: 100%;">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="apiName" label="API名称" width="150" />
      <el-table-column prop="apiUrl" label="API地址" min-width="250" show-overflow-tooltip />
      <el-table-column prop="requestMethod" label="请求方法" width="100" />
      <el-table-column prop="dailyLimit" label="日限额" width="100" />
      <el-table-column prop="todayUsed" label="今日已用" width="100" />
      <el-table-column prop="priority" label="优先级" width="90" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <div class="table-actions">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" link size="small" @click="handleTest(row)">测试</el-button>
            <el-button
              :type="row.status === 1 ? 'warning' : 'success'"
              link
              size="small"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="pagination.pageNum"
      v-model:page-size="pagination.pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="pagination.total"
      layout="total, sizes, prev, pager, next, jumper"
      style="margin-top: 20px; justify-content: flex-end;"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="650px"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px">
        <el-form-item label="API名称" prop="apiName">
          <el-input v-model="formData.apiName" placeholder="请输入API名称" />
        </el-form-item>
        <el-form-item label="API地址" prop="apiUrl">
          <el-input v-model="formData.apiUrl" placeholder="支持{ip}占位符" />
        </el-form-item>
        <el-form-item label="请求方法">
          <el-select v-model="formData.requestMethod" style="width: 100%;">
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
          </el-select>
        </el-form-item>
        <el-form-item label="请求参数">
          <el-input
            v-model="formData.requestParams"
            type="textarea"
            :rows="2"
            placeholder="JSON格式，支持{ip}占位符"
          />
        </el-form-item>
        <el-form-item label="请求头">
          <el-input
            v-model="formData.requestHeaders"
            type="textarea"
            :rows="2"
            placeholder="JSON格式"
          />
        </el-form-item>
        <el-form-item label="响应类型">
          <el-select v-model="formData.responseType" style="width: 100%;">
            <el-option label="JSON" value="json" />
            <el-option label="TEXT" value="text" />
            <el-option label="XML" value="xml" />
          </el-select>
        </el-form-item>
        <el-form-item label="归属地路径">
          <el-input v-model="formData.locationPath" placeholder="JSONPath，如 $.country+$.city" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="省份路径">
              <el-input v-model="formData.provincePath" placeholder="JSONPath" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="城市路径">
              <el-input v-model="formData.cityPath" placeholder="JSONPath" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="运营商路径">
              <el-input v-model="formData.ispPath" placeholder="JSONPath" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="日限额">
              <el-input-number v-model="formData.dailyLimit" :min="1" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="优先级">
              <el-input-number v-model="formData.priority" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态">
              <el-radio-group v-model="formData.status">
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="testDialogVisible" title="测试API" width="400px">
      <el-form label-width="80px">
        <el-form-item label="测试IP">
          <el-input v-model="testIp" placeholder="请输入要测试的IP" />
        </el-form-item>
      </el-form>
      <div v-if="testResult" style="margin-top: 15px;">
        <div style="font-weight: bold; margin-bottom: 8px;">测试结果：</div>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; max-height: 200px; overflow: auto;">{{ JSON.stringify(testResult, null, 2) }}</pre>
      </div>
      <template #footer>
        <el-button @click="testDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleConfirmTest">测试</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getLocationApiPage,
  saveLocationApi,
  deleteLocationApi,
  updateLocationApiStatus,
  testLocationApi
} from '@/api/locationApi'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const testDialogVisible = ref(false)
const dialogTitle = ref('')
const keyword = ref('')
const statusFilter = ref(null)
const testIp = ref('8.8.8.8')
const testResult = ref(null)
const formRef = ref(null)

const formData = reactive({
  id: null,
  apiName: '',
  apiUrl: '',
  requestMethod: 'GET',
  requestParams: '',
  requestHeaders: '',
  responseType: 'json',
  locationPath: '',
  provincePath: '',
  cityPath: '',
  ispPath: '',
  dailyLimit: 1000,
  priority: 0,
  status: 1
})

const formRules = {
  apiName: [{ required: true, message: '请输入API名称', trigger: 'blur' }],
  apiUrl: [{ required: true, message: '请输入API地址', trigger: 'blur' }]
}

const pagination = reactive({
  pageNum: 1,
  pageSize: 20,
  total: 0
})

onMounted(() => {
  loadData()
})

async function loadData() {
  loading.value = true
  try {
    const res = await getLocationApiPage({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      keyword: keyword.value,
      status: statusFilter.value
    })
    tableData.value = res.records
    pagination.total = res.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function handleReset() {
  keyword.value = ''
  statusFilter.value = null
  pagination.pageNum = 1
  loadData()
}

function handleSizeChange(size) {
  pagination.pageSize = size
  loadData()
}

function handleCurrentChange(page) {
  pagination.pageNum = page
  loadData()
}

function handleAdd() {
  dialogTitle.value = '新增API'
  formData.id = null
  formData.apiName = ''
  formData.apiUrl = ''
  formData.requestMethod = 'GET'
  formData.requestParams = ''
  formData.requestHeaders = ''
  formData.responseType = 'json'
  formData.locationPath = ''
  formData.provincePath = ''
  formData.cityPath = ''
  formData.ispPath = ''
  formData.dailyLimit = 1000
  formData.priority = 0
  formData.status = 1
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogTitle.value = '编辑API'
  Object.assign(formData, row)
  dialogVisible.value = true
}

function handleDialogClose() {
  formRef.value?.resetFields()
}

async function handleSubmit() {
  await formRef.value?.validate()
  try {
    await saveLocationApi(formData)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    console.error(e)
  }
}

async function handleToggleStatus(row) {
  try {
    await updateLocationApiStatus(row.id, row.status === 1 ? 0 : 1)
    ElMessage.success('操作成功')
    loadData()
  } catch (e) {
    console.error(e)
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除该API吗？', '提示', {
      type: 'warning'
    })
    await deleteLocationApi(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

function handleTest(row) {
  testResult.value = null
  testIp.value = '8.8.8.8'
  testDialogVisible.value = true
}

async function handleConfirmTest() {
  if (!testIp.value) {
    ElMessage.warning('请输入测试IP')
    return
  }
  try {
    testResult.value = await testLocationApi(testIp.value)
  } catch (e) {
    console.error(e)
  }
}
</script>
