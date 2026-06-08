<template>
  <div class="page-container">
    <div class="search-bar">
      <el-input
        v-model="searchForm.keyword"
        placeholder="搜索IP/归属地/供应商"
        clearable
        style="width: 250px;"
        @keyup.enter="handleSearch"
      />
      <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 120px;">
        <el-option label="全部" :value="null" />
        <el-option label="待验证" :value="0" />
        <el-option label="可用" :value="1" />
        <el-option label="不可用" :value="2" />
        <el-option label="已禁用" :value="3" />
      </el-select>
      <el-select v-model="searchForm.protocol" placeholder="协议" clearable style="width: 120px;">
        <el-option label="HTTP" value="http" />
        <el-option label="HTTPS" value="https" />
        <el-option label="SOCKS5" value="socks5" />
      </el-select>
      <el-input v-model="searchForm.supplier" placeholder="供应商" clearable style="width: 150px;" />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button type="success" @click="handleAdd">新增IP</el-button>
      <el-button type="warning" @click="handleBatchAddGroup" :disabled="selectedIds.length === 0">
        批量分组
      </el-button>
      <el-button type="danger" @click="handleBatchDelete" :disabled="selectedIds.length === 0">
        批量删除
      </el-button>
    </div>

    <el-table
      :data="tableData"
      border
      v-loading="loading"
      @selection-change="handleSelectionChange"
      style="width: 100%;"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="ip" label="IP地址" width="140" />
      <el-table-column prop="port" label="端口" width="80" />
      <el-table-column prop="protocol" label="协议" width="90" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="supplier" label="供应商" width="120" />
      <el-table-column prop="location" label="归属地" min-width="150" />
      <el-table-column prop="anonymityLevel" label="匿名等级" width="90">
        <template #default="{ row }">
          {{ getAnonymityText(row.anonymityLevel) }}
        </template>
      </el-table-column>
      <el-table-column prop="useCount" label="使用次数" width="100" />
      <el-table-column prop="responseTime" label="响应时间(ms)" width="110" />
      <el-table-column prop="surviveDate" label="存活日期" width="120" />
      <el-table-column prop="lastCheckTime" label="最后检查" width="160" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <div class="table-actions">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button
              :type="row.status === 1 ? 'danger' : 'success'"
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
      width="600px"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="IP地址" prop="ip">
              <el-input v-model="formData.ip" placeholder="请输入IP地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="端口" prop="port">
              <el-input v-model.number="formData.port" placeholder="请输入端口" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="协议" prop="protocol">
              <el-select v-model="formData.protocol" style="width: 100%;">
                <el-option label="HTTP" value="http" />
                <el-option label="HTTPS" value="https" />
                <el-option label="SOCKS5" value="socks5" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="formData.status" style="width: 100%;">
                <el-option label="待验证" :value="0" />
                <el-option label="可用" :value="1" />
                <el-option label="不可用" :value="2" />
                <el-option label="已禁用" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商" prop="supplier">
              <el-input v-model="formData.supplier" placeholder="请输入供应商" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="匿名等级" prop="anonymityLevel">
              <el-select v-model="formData.anonymityLevel" style="width: 100%;">
                <el-option label="透明" :value="1" />
                <el-option label="普匿" :value="2" />
                <el-option label="高匿" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="归属地" prop="location">
          <el-input v-model="formData.location" placeholder="请输入归属地" />
        </el-form-item>
        <el-form-item label="所属分组">
          <el-select v-model="selectedGroups" multiple placeholder="请选择分组" style="width: 100%;">
            <el-option
              v-for="group in groupList"
              :key="group.id"
              :label="group.groupName"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="groupDialogVisible" title="批量添加到分组" width="400px">
      <el-form label-width="80px">
        <el-form-item label="选择分组">
          <el-select v-model="batchGroupIds" multiple placeholder="请选择分组" style="width: 100%;">
            <el-option
              v-for="group in groupList"
              :key="group.id"
              :label="group.groupName"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="groupDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmBatchGroup">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getProxyIpPage,
  saveProxyIpWithGroups,
  deleteProxyIp,
  batchDeleteProxyIp,
  updateProxyIpStatus,
  batchUpdateProxyIpStatus,
  batchAddToGroup,
  getProxyIpGroups
} from '@/api/proxyIp'
import { getIpGroupList } from '@/api/ipGroup'

const loading = ref(false)
const tableData = ref([])
const selectedIds = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const groupDialogVisible = ref(false)
const batchGroupIds = ref([])
const selectedGroups = ref([])
const groupList = ref([])

const formRef = ref(null)
const formData = reactive({
  id: null,
  ip: '',
  port: 80,
  protocol: 'http',
  status: 1,
  supplier: '',
  location: '',
  anonymityLevel: 1,
  remark: ''
})

const formRules = {
  ip: [{ required: true, message: '请输入IP地址', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口', trigger: 'blur' }]
}

const searchForm = reactive({
  keyword: '',
  status: null,
  protocol: '',
  supplier: ''
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 20,
  total: 0
})

onMounted(() => {
  loadData()
  loadGroups()
})

async function loadData() {
  loading.value = true
  try {
    const res = await getProxyIpPage({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      ...searchForm
    })
    tableData.value = res.records
    pagination.total = res.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function loadGroups() {
  try {
    groupList.value = await getIpGroupList()
  } catch (e) {
    console.error(e)
  }
}

function handleSearch() {
  pagination.pageNum = 1
  loadData()
}

function handleReset() {
  searchForm.keyword = ''
  searchForm.status = null
  searchForm.protocol = ''
  searchForm.supplier = ''
  handleSearch()
}

function handleSelectionChange(selection) {
  selectedIds.value = selection.map(item => item.id)
}

function handleSizeChange(size) {
  pagination.pageSize = size
  loadData()
}

function handleCurrentChange(page) {
  pagination.pageNum = page
  loadData()
}

function getStatusType(status) {
  const map = { 0: 'info', 1: 'success', 2: 'danger', 3: 'warning' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { 0: '待验证', 1: '可用', 2: '不可用', 3: '已禁用' }
  return map[status] || '未知'
}

function getAnonymityText(level) {
  const map = { 1: '透明', 2: '普匿', 3: '高匿' }
  return map[level] || '未知'
}

function handleAdd() {
  dialogTitle.value = '新增代理IP'
  formData.id = null
  formData.ip = ''
  formData.port = 80
  formData.protocol = 'http'
  formData.status = 1
  formData.supplier = ''
  formData.location = ''
  formData.anonymityLevel = 1
  formData.remark = ''
  selectedGroups.value = []
  dialogVisible.value = true
}

async function handleEdit(row) {
  dialogTitle.value = '编辑代理IP'
  Object.assign(formData, row)
  try {
    selectedGroups.value = await getProxyIpGroups(row.id)
  } catch (e) {
    selectedGroups.value = []
  }
  dialogVisible.value = true
}

function handleDialogClose() {
  formRef.value?.resetFields()
}

async function handleSubmit() {
  await formRef.value?.validate()
  try {
    await saveProxyIpWithGroups({
      proxyIp: formData,
      groupIds: selectedGroups.value
    })
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    console.error(e)
  }
}

async function handleToggleStatus(row) {
  const newStatus = row.status === 1 ? 3 : 1
  try {
    await updateProxyIpStatus(row.id, newStatus)
    ElMessage.success('操作成功')
    loadData()
  } catch (e) {
    console.error(e)
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除该IP吗？', '提示', {
      type: 'warning'
    })
    await deleteProxyIp(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 条记录吗？`, '提示', {
      type: 'warning'
    })
    await batchDeleteProxyIp(selectedIds.value)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

function handleBatchAddGroup() {
  batchGroupIds.value = []
  groupDialogVisible.value = true
}

async function handleConfirmBatchGroup() {
  if (batchGroupIds.value.length === 0) {
    ElMessage.warning('请选择分组')
    return
  }
  try {
    await batchAddToGroup(selectedIds.value, batchGroupIds.value)
    ElMessage.success('操作成功')
    groupDialogVisible.value = false
  } catch (e) {
    console.error(e)
  }
}
</script>
