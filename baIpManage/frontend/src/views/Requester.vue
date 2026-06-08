<template>
  <div class="requester">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>请求方管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增请求方
          </el-button>
        </div>
      </template>

      <div class="search-bar">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="关键词">
            <el-input v-model="searchForm.keyword" placeholder="IP/域名/名称" clearable @keyup.enter="loadData" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
              <el-option label="启用" :value="1" />
              <el-option label="禁用" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadData">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="requesterKey" label="标识" width="180" />
        <el-table-column prop="requesterType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.requesterType === 1 ? 'primary' : 'success'" size="small">
              {{ row.requesterType === 1 ? 'IP' : '域名' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" width="150" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rateLimit" label="每秒限流" width="120">
          <template #default="{ row }">
            {{ row.rateLimit || '不限' }}
          </template>
        </el-table-column>
        <el-table-column prop="rateLimitDay" label="每日限流" width="120">
          <template #default="{ row }">
            {{ row.rateLimitDay || '不限' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="success" @click="showControlDialog(row)">访问控制</el-button>
            <el-button size="small" type="warning" @click="showPoolDialog(row)">IP池控制</el-button>
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
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="标识" prop="requesterKey">
          <el-input v-model="form.requesterKey" placeholder="请输入IP或域名" />
        </el-form-item>
        <el-form-item label="类型" prop="requesterType">
          <el-radio-group v-model="form.requesterType">
            <el-radio :value="1">IP</el-radio>
            <el-radio :value="2">域名</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="请输入名称/备注" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="每秒限流">
            <el-input v-model="form.rateLimit" type="number" placeholder="0表示不限" />
          </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="每日限流">
            <el-input v-model="form.rateLimitDay" type="number" placeholder="0表示不限" />
          </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="controlDialogVisible" title="访问控制" width="700px">
      <div class="control-tabs">
        <el-tabs v-model="activeControlTab">
          <el-tab-pane label="黑名单(禁止访问的目标)" name="blacklist" />
          <el-tab-pane label="白名单(仅允许访问的目标)" name="whitelist" />
        </el-tabs>
      </div>

      <div class="control-form">
        <el-form :inline="true" :model="controlForm">
          <el-form-item label="目标类型">
            <el-select v-model="controlForm.targetType" style="width: 120px">
              <el-option label="IP" :value="1" />
              <el-option label="域名" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="目标值">
            <el-input v-model="controlForm.targetValue" placeholder="请输入IP或域名" style="width: 200px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleAddControl">添加</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="controlList" border stripe v-loading="controlLoading">
        <el-table-column prop="targetType" label="类型" width="100">
          <template #default="{ row }">
            {{ row.targetType === 1 ? 'IP' : '域名' }}
          </template>
        </el-table-column>
        <el-table-column prop="targetValue" label="目标值" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click="handleDeleteControl(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="poolDialogVisible" title="IP池控制" width="700px">
      <div class="control-tabs">
        <el-tabs v-model="activePoolTab">
          <el-tab-pane label="允许访问的分组" name="allow" />
          <el-tab-pane label="禁止访问的分组" name="deny" />
        </el-tabs>
      </div>

      <div class="control-form">
        <el-form :inline="true" :model="poolForm">
          <el-form-item label="选择分组">
            <el-select v-model="poolForm.groupId" style="width: 200px">
              <el-option
              v-for="group in groupList"
              :key="group.id"
              :label="group.groupName"
              :value="group.id"
            />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleAddPoolControl">添加</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="poolControlList" border stripe v-loading="poolLoading">
        <el-table-column prop="groupId" label="分组ID" width="100" />
        <el-table-column label="分组名称">
          <template #default="{ row }">
            {{ getGroupName(row.groupId) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click="handleDeletePoolControl(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getRequesterPage,
  saveRequester,
  deleteRequester,
  getRequesterControls,
  addRequesterControl,
  deleteRequesterControl,
  getPoolControls,
  addPoolControl,
  deletePoolControl
} from '@/api/requester'
import { getGroupList } from '@/api/group'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const currentRequester = ref(null)

const controlDialogVisible = ref(false)
const activeControlTab = ref('blacklist')
const controlList = ref([])
const controlLoading = ref(false)

const poolDialogVisible = ref(false)
const activePoolTab = ref('allow')
const poolControlList = ref([])
const poolLoading = ref(false)
const groupList = ref([])

const searchForm = reactive({
  keyword: '',
  status: null
})

const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
})

const form = reactive({
  id: null,
  requesterKey: '',
  requesterType: 1,
  name: '',
  status: 1,
  rateLimit: 0,
  rateLimitDay: 0
})

const rules = {
  requesterKey: [{ required: true, message: '请输入标识', trigger: 'blur' }],
  requesterType: [{ required: true, message: '请选择类型', trigger: 'change' }]
}

const controlForm = reactive({
  targetType: 1,
  targetValue: ''
})

const poolForm = reactive({
  groupId: null
})

const loadData = async () => {
  loading.value = true
  try {
    const data = await getRequesterPage({
      current: pagination.current,
      size: pagination.size,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status
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
  pagination.current = 1
  loadData()
}

const handleAdd = () => {
  dialogTitle.value = '新增请求方'
  Object.assign(form, {
    id: null,
    requesterKey: '',
    requesterType: 1,
    name: '',
    status: 1,
    rateLimit: 0,
    rateLimitDay: 0
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑请求方'
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    await saveRequester(form)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    if (e !== false) console.error(e)
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该请求方吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    await deleteRequester(row.id)
    ElMessage.success('删除成功')
    loadData()
  }).catch(() => {})
}

const showControlDialog = (row) => {
  currentRequester.value = row
  activeControlTab.value = 'blacklist'
  controlDialogVisible.value = true
  loadControls()
}

const loadControls = async () => {
  controlLoading.value = true
  try {
    const controlType = activeControlTab.value === 'blacklist' ? 1 : 2
    controlList.value = await getRequesterControls(currentRequester.value.id, controlType)
  } catch (e) {
    console.error(e)
  } finally {
    controlLoading.value = false
  }
}

watch(activeControlTab, () => {
  if (controlDialogVisible.value) {
    loadControls()
  }
})

const handleAddControl = async () => {
  if (!controlForm.targetValue) {
    ElMessage.warning('请输入目标值')
    return
  }
  try {
    const controlType = activeControlTab.value === 'blacklist' ? 1 : 2
    await addRequesterControl({
      requesterId: currentRequester.value.id,
      controlType,
      targetType: controlForm.targetType,
      targetValue: controlForm.targetValue
    })
    ElMessage.success('添加成功')
    controlForm.targetValue = ''
    loadControls()
  } catch (e) {
    console.error(e)
  }
}

const handleDeleteControl = (row) => {
  ElMessageBox.confirm('确定要删除该条控制规则吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    await deleteRequesterControl(row.id)
    ElMessage.success('删除成功')
    loadControls()
  }).catch(() => {})
}

const showPoolDialog = async (row) => {
  currentRequester.value = row
  activePoolTab.value = 'allow'
  poolDialogVisible.value = true
  try {
    groupList.value = await getGroupList()
  } catch (e) {}
  loadPoolControls()
}

const loadPoolControls = async () => {
  poolLoading.value = true
  try {
    const controlType = activePoolTab.value === 'allow' ? 1 : 2
    poolControlList.value = await getPoolControls(currentRequester.value.id, controlType)
  } catch (e) {
    console.error(e)
  } finally {
    poolLoading.value = false
  }
}

watch(activePoolTab, () => {
  if (poolDialogVisible.value) {
    loadPoolControls()
  }
})

const handleAddPoolControl = async () => {
  if (!poolForm.groupId) {
    ElMessage.warning('请选择分组')
    return
  }
  try {
    const controlType = activePoolTab.value === 'allow' ? 1 : 2
    await addPoolControl({
      requesterId: currentRequester.value.id,
      controlType,
      groupId: poolForm.groupId
    })
    ElMessage.success('添加成功')
    poolForm.groupId = null
    loadPoolControls()
  } catch (e) {
    console.error(e)
  }
}

const handleDeletePoolControl = (row) => {
  ElMessageBox.confirm('确定要删除该条控制规则吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    await deletePoolControl(row.id)
    ElMessage.success('删除成功')
    loadPoolControls()
  }).catch(() => {})
}

const getGroupName = (groupId) => {
  const group = groupList.value.find(g => g.id === groupId)
  return group ? group.groupName : '未知'
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.requester {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.search-bar {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.control-tabs {
  margin-bottom: 15px;
}

.control-form {
  margin-bottom: 15px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}
</style>
