<template>
  <div class="proxy-ip">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>代理IP维护</span>
          <div class="header-actions">
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新增IP
            </el-button>
            <el-button type="success" @click="handleCheckAll">
              <el-icon><Refresh /></el-icon>
              批量检查
            </el-button>
          </div>
        </div>
      </template>

      <div class="search-bar">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="关键词">
            <el-input v-model="searchForm.keyword" placeholder="IP/归属地/供应商" clearable @keyup.enter="loadData" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
              <el-option label="待验证" :value="0" />
              <el-option label="可用" :value="1" />
              <el-option label="不可用" :value="2" />
              <el-option label="已过期" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item label="协议">
            <el-select v-model="searchForm.protocol" placeholder="全部" clearable style="width: 120px">
              <el-option label="HTTP" value="http" />
              <el-option label="HTTPS" value="https" />
              <el-option label="SOCKS5" value="socks5" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadData">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="tableData" border stripe v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="ip" label="IP" width="130" />
        <el-table-column prop="port" label="端口" width="80" />
        <el-table-column prop="protocol" label="协议" width="90">
          <template #default="{ row }">
            <el-tag size="small">{{ row.protocol?.toUpperCase() }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="supplier" label="供应商" width="120" />
        <el-table-column prop="location" label="归属地" min-width="150" />
        <el-table-column prop="useCount" label="使用次数" width="100" />
        <el-table-column prop="responseTime" label="响应时间(ms)" width="120" />
        <el-table-column prop="survivalDate" label="存活日期" width="120" />
        <el-table-column prop="remark" label="备注" min-width="100" show-overflow-tooltip />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="success" @click="handleCheck(row)">检查</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>

      <div v-if="selectedIds.length > 0" class="batch-actions">
        <span>已选择 {{ selectedIds.length }} 项</span>
        <el-button type="primary" size="small" @click="showBatchGroupDialog = true">加入分组</el-button>
        <el-button type="danger" size="small" @click="handleBatchDelete">批量删除</el-button>
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="IP地址" prop="ip">
              <el-input v-model="form.ip" placeholder="请输入IP地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="端口" prop="port">
              <el-input v-model="form.port" type="number" placeholder="请输入端口" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="协议" prop="protocol">
              <el-select v-model="form.protocol" style="width: 100%">
                <el-option label="HTTP" value="http" />
                <el-option label="HTTPS" value="https" />
                <el-option label="SOCKS5" value="socks5" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" style="width: 100%">
                <el-option label="待验证" :value="0" />
                <el-option label="可用" :value="1" />
                <el-option label="不可用" :value="2" />
                <el-option label="已过期" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商">
              <el-input v-model="form.supplier" placeholder="请输入供应商" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="归属地">
              <el-input v-model="form.location" placeholder="请输入归属地" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="国家">
              <el-input v-model="form.country" placeholder="请输入国家" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="省份">
              <el-input v-model="form.province" placeholder="请输入省份" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="城市">
              <el-input v-model="form.city" placeholder="请输入城市" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="匿名度">
              <el-select v-model="form.anonymityLevel" style="width: 100%">
                <el-option label="透明" :value="0" />
                <el-option label="匿名" :value="1" />
                <el-option label="高匿" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="存活日期">
          <el-date-picker
            v-model="form.survivalDate"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showBatchGroupDialog" title="批量加入分组" width="400px">
      <el-form label-width="80px">
        <el-form-item label="选择分组">
          <el-select v-model="selectedGroupId" style="width: 100%">
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
        <el-button @click="showBatchGroupDialog = false">取消</el-button>
        <el-button type="primary" @click="handleBatchAddToGroup">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getIpPage, saveIp, deleteIp, batchDeleteIp, checkIp, checkAllIps } from '@/api/ip'
import { getGroupList, batchAddIpToGroup } from '@/api/group'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const selectedIds = ref([])
const groupList = ref([])
const showBatchGroupDialog = ref(false)
const selectedGroupId = ref(null)

const searchForm = reactive({
  keyword: '',
  status: null,
  protocol: ''
})

const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
})

const form = reactive({
  id: null,
  ip: '',
  port: null,
  protocol: 'http',
  status: 0,
  supplier: '',
  location: '',
  country: '',
  province: '',
  city: '',
  useCount: 0,
  anonymityLevel: 0,
  survivalDate: null,
  remark: ''
})

const rules = {
  ip: [{ required: true, message: '请输入IP地址', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口', trigger: 'blur' }],
  protocol: [{ required: true, message: '请选择协议', trigger: 'change' }]
}

const statusText = (status) => {
  const map = { 0: '待验证', 1: '可用', 2: '不可用', 3: '已过期' }
  return map[status] || '未知'
}

const statusTagType = (status) => {
  const map = { 0: 'info', 1: 'success', 2: 'danger', 3: 'warning' }
  return map[status] || 'info'
}

const loadData = async () => {
  loading.value = true
  try {
    const data = await getIpPage({
      current: pagination.current,
      size: pagination.size,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status,
      protocol: searchForm.protocol || undefined
    })
    tableData.value = data.records
    pagination.total = data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.status = null
  searchForm.protocol = ''
  pagination.current = 1
  loadData()
}

const handleAdd = () => {
  dialogTitle.value = '新增IP'
  Object.assign(form, {
    id: null,
    ip: '',
    port: null,
    protocol: 'http',
    status: 0,
    supplier: '',
    location: '',
    country: '',
    province: '',
    city: '',
    useCount: 0,
    anonymityLevel: 0,
    survivalDate: null,
    remark: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑IP'
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    await saveIp(form)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    if (e !== false) {
      console.error(e)
    }
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该IP吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    await deleteIp(row.id)
    ElMessage.success('删除成功')
    loadData()
  }).catch(() => {})
}

const handleCheck = async (row) => {
  try {
    const result = await checkIp(row.id)
    ElMessage.success(result ? 'IP可用' : 'IP不可用')
    loadData()
  } catch (e) {
    console.error(e)
  }
}

const handleCheckAll = () => {
  ElMessageBox.confirm('确定要批量检查所有IP吗？这可能需要一些时间。', '提示', {
    type: 'info'
  }).then(async () => {
    await checkAllIps()
    ElMessage.success('已开始批量检查，请稍后刷新查看')
  }).catch(() => {})
}

const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(item => item.id)
}

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 个IP吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    await batchDeleteIp(selectedIds.value)
    ElMessage.success('删除成功')
    loadData()
  }).catch(() => {})
}

const loadGroups = async () => {
  try {
    groupList.value = await getGroupList()
  } catch (e) {}
}

const handleBatchAddToGroup = async () => {
  if (!selectedGroupId.value) {
    ElMessage.warning('请选择分组')
    return
  }
  try {
    await batchAddIpToGroup(selectedGroupId.value, selectedIds.value)
    ElMessage.success('已加入分组')
    showBatchGroupDialog.value = false
  } catch (e) {}
}

onMounted(() => {
  loadData()
  loadGroups()
})
</script>

<style scoped>
.proxy-ip {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-bar {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.batch-actions {
  margin-top: 15px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
