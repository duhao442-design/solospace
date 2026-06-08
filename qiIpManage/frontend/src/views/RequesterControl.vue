<template>
  <div class="page-container">
    <div class="search-bar">
      <el-select v-model="searchForm.requesterType" placeholder="请求方类型" clearable style="width: 150px;">
        <el-option label="IP" :value="1" />
        <el-option label="域名" :value="2" />
      </el-select>
      <el-input
        v-model="searchForm.keyword"
        placeholder="搜索IP/域名"
        clearable
        style="width: 250px;"
        @keyup.enter="loadData"
      />
      <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 120px;">
        <el-option label="启用" :value="1" />
        <el-option label="禁用" :value="0" />
      </el-select>
      <el-button type="primary" @click="loadData">搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button type="success" @click="handleAdd">新增规则</el-button>
    </div>

    <el-table :data="tableData" border v-loading="loading" style="width: 100%;">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="类型" width="90">
        <template #default="{ row }">
          {{ row.requesterType === 1 ? 'IP' : '域名' }}
        </template>
      </el-table-column>
      <el-table-column prop="requesterValue" label="请求方" min-width="180" />
      <el-table-column label="控制类型" width="120">
        <template #default="{ row }">
          <el-tag :type="row.controlType === 1 ? 'danger' : 'success'" size="small">
            {{ row.controlType === 1 ? '黑名单' : '白名单' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="rateLimit" label="限流(QPS)" width="100" />
      <el-table-column prop="dailyLimit" label="日限次数" width="110" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <div class="table-actions">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" link size="small" @click="handleGroupAccess(row)">IP池控制</el-button>
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
      width="550px"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="请求方类型" prop="requesterType">
          <el-radio-group v-model="formData.requesterType">
            <el-radio :value="1">IP</el-radio>
            <el-radio :value="2">域名</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="请求方值" prop="requesterValue">
          <el-input v-model="formData.requesterValue" :placeholder="formData.requesterType === 1 ? '请输入IP地址' : '请输入域名'" />
        </el-form-item>
        <el-form-item label="控制类型" prop="controlType">
          <el-radio-group v-model="formData.controlType">
            <el-radio :value="1">黑名单(禁止)</el-radio>
            <el-radio :value="2">白名单(仅允许)</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="限流(QPS)">
          <el-input-number v-model="formData.rateLimit" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="日限次数">
          <el-input-number v-model="formData.dailyLimit" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="accessDialogVisible" title="IP池访问控制" width="600px">
      <div style="margin-bottom: 15px;">
        <span style="margin-right: 10px;">当前请求方：</span>
        <el-tag type="primary">{{ currentRequester?.requesterValue }}</el-tag>
      </div>
      <el-table :data="groupList" border>
        <el-table-column prop="groupName" label="分组名称" />
        <el-table-column prop="groupCode" label="分组编码" width="150" />
        <el-table-column label="访问控制" width="180">
          <template #default="{ row }">
            <el-radio-group v-model="row.accessType" size="small">
              <el-radio :value="0">默认</el-radio>
              <el-radio :value="1">允许</el-radio>
              <el-radio :value="2">禁止</el-radio>
            </el-radio-group>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="accessDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveAccess">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getRequesterControlPage,
  saveRequesterControl,
  deleteRequesterControl,
  updateRequesterStatus,
  saveRequesterWithAccess,
  getRequesterGroupAccess
} from '@/api/requesterControl'
import { getIpGroupList } from '@/api/ipGroup'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const accessDialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const currentRequester = ref(null)
const groupList = ref([])

const formData = reactive({
  id: null,
  requesterType: 1,
  requesterValue: '',
  controlType: 1,
  rateLimit: null,
  dailyLimit: null,
  status: 1,
  remark: ''
})

const formRules = {
  requesterType: [{ required: true, message: '请选择请求方类型', trigger: 'change' }],
  requesterValue: [{ required: true, message: '请输入请求方值', trigger: 'blur' }]
}

const searchForm = reactive({
  requesterType: null,
  keyword: '',
  status: null
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
    const res = await getRequesterControlPage({
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

function handleReset() {
  searchForm.requesterType = null
  searchForm.keyword = ''
  searchForm.status = null
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
  dialogTitle.value = '新增规则'
  formData.id = null
  formData.requesterType = 1
  formData.requesterValue = ''
  formData.controlType = 1
  formData.rateLimit = null
  formData.dailyLimit = null
  formData.status = 1
  formData.remark = ''
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogTitle.value = '编辑规则'
  Object.assign(formData, row)
  dialogVisible.value = true
}

function handleDialogClose() {
  formRef.value?.resetFields()
}

async function handleSubmit() {
  await formRef.value?.validate()
  try {
    await saveRequesterControl(formData)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    console.error(e)
  }
}

async function handleToggleStatus(row) {
  try {
    await updateRequesterStatus(row.id, row.status === 1 ? 0 : 1)
    ElMessage.success('操作成功')
    loadData()
  } catch (e) {
    console.error(e)
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除该规则吗？', '提示', {
      type: 'warning'
    })
    await deleteRequesterControl(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

async function handleGroupAccess(row) {
  currentRequester.value = row
  await loadGroups()
  try {
    const accessList = await getRequesterGroupAccess(row.id)
    groupList.value = groupList.value.map(g => {
      const access = accessList.find(a => a.groupId === g.id)
      return {
        ...g,
        accessType: access ? access.accessType : 0
      }
    })
  } catch (e) {
    groupList.value = groupList.value.map(g => ({ ...g, accessType: 0 }))
  }
  accessDialogVisible.value = true
}

async function handleSaveAccess() {
  const accessList = groupList.value
    .filter(g => g.accessType && g.accessType !== 0)
    .map(g => ({
      groupId: g.id,
      accessType: g.accessType
    }))
  try {
    await saveRequesterWithAccess({
      requesterControl: currentRequester.value,
      accessList
    })
    ElMessage.success('保存成功')
    accessDialogVisible.value = false
  } catch (e) {
    console.error(e)
  }
}
</script>
