<template>
  <div class="page-container">
    <div class="search-bar">
      <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 150px;">
        <el-option label="全部" :value="null" />
        <el-option label="待验证" :value="0" />
        <el-option label="验证通过" :value="1" />
        <el-option label="验证失败" :value="2" />
      </el-select>
      <el-input v-model="searchForm.source" placeholder="来源" clearable style="width: 200px;" />
      <el-button type="primary" @click="loadData">搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button type="success" @click="handleAdd">手动添加</el-button>
      <el-button type="warning" @click="handleClearVerified">清理已验证</el-button>
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
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="source" label="来源" width="150" />
      <el-table-column prop="supplier" label="供应商" width="120" />
      <el-table-column prop="verifyCount" label="验证次数" width="100" />
      <el-table-column prop="lastVerifyTime" label="最后验证时间" width="170" />
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" title="添加待验证IP" width="500px">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="IP地址" prop="ip">
          <el-input v-model="formData.ip" placeholder="请输入IP地址" />
        </el-form-item>
        <el-form-item label="端口" prop="port">
          <el-input v-model.number="formData.port" placeholder="请输入端口" />
        </el-form-item>
        <el-form-item label="协议">
          <el-select v-model="formData.protocol" style="width: 100%;">
            <el-option label="HTTP" value="http" />
            <el-option label="HTTPS" value="https" />
            <el-option label="SOCKS5" value="socks5" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源">
          <el-input v-model="formData.source" placeholder="请输入来源" />
        </el-form-item>
        <el-form-item label="供应商">
          <el-input v-model="formData.supplier" placeholder="请输入供应商" />
        </el-form-item>
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
  getPendingIpPage,
  addPendingIp,
  deletePendingIp,
  batchDeletePendingIp,
  clearVerifiedPendingIp
} from '@/api/pendingIp'

const loading = ref(false)
const tableData = ref([])
const selectedIds = ref([])
const dialogVisible = ref(false)
const formRef = ref(null)

const formData = reactive({
  ip: '',
  port: 80,
  protocol: 'http',
  source: '',
  supplier: ''
})

const formRules = {
  ip: [{ required: true, message: '请输入IP地址', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口', trigger: 'blur' }]
}

const searchForm = reactive({
  status: null,
  source: ''
})

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
    const res = await getPendingIpPage({
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

function handleReset() {
  searchForm.status = null
  searchForm.source = ''
  pagination.pageNum = 1
  loadData()
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
  const map = { 0: 'info', 1: 'success', 2: 'danger' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { 0: '待验证', 1: '验证通过', 2: '验证失败' }
  return map[status] || '未知'
}

function handleAdd() {
  formData.ip = ''
  formData.port = 80
  formData.protocol = 'http'
  formData.source = ''
  formData.supplier = ''
  dialogVisible.value = true
}

async function handleSubmit() {
  await formRef.value?.validate()
  try {
    await addPendingIp(formData)
    ElMessage.success('添加成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    console.error(e)
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除该记录吗？', '提示', {
      type: 'warning'
    })
    await deletePendingIp(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

async function handleClearVerified() {
  try {
    await ElMessageBox.confirm('确定要清理所有已验证的记录吗？', '提示', {
      type: 'warning'
    })
    await clearVerifiedPendingIp()
    ElMessage.success('清理成功')
    loadData()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}
</script>
