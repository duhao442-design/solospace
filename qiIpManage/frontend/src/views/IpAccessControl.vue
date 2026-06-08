<template>
  <div class="page-container">
    <div class="search-bar">
      <el-select v-model="searchForm.controlTargetType" placeholder="控制目标类型" clearable style="width: 150px;">
        <el-option label="IP" :value="1" />
        <el-option label="域名" :value="2" />
      </el-select>
      <el-select v-model="searchForm.controlType" placeholder="控制类型" clearable style="width: 150px;">
        <el-option label="禁止访问" :value="1" />
        <el-option label="仅允许访问" :value="2" />
      </el-select>
      <el-button type="primary" @click="loadData">搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button type="success" @click="handleAdd">新增规则</el-button>
    </div>

    <el-table :data="tableData" border v-loading="loading" style="width: 100%;">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="proxyIpId" label="代理IP ID" width="110" />
      <el-table-column label="目标类型" width="100">
        <template #default="{ row }">
          {{ row.controlTargetType === 1 ? 'IP' : '域名' }}
        </template>
      </el-table-column>
      <el-table-column prop="controlTargetValue" label="目标值" min-width="180" />
      <el-table-column label="控制类型" width="120">
        <template #default="{ row }">
          <el-tag :type="row.controlType === 1 ? 'danger' : 'success'" size="small">
            {{ row.controlType === 1 ? '禁止访问' : '仅允许访问' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <div class="table-actions">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
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
      width="500px"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px">
        <el-form-item label="代理IP ID" prop="proxyIpId">
          <el-input-number v-model="formData.proxyIpId" :min="1" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="目标类型" prop="controlTargetType">
          <el-radio-group v-model="formData.controlTargetType">
            <el-radio :value="1">IP</el-radio>
            <el-radio :value="2">域名</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="目标值" prop="controlTargetValue">
          <el-input v-model="formData.controlTargetValue" placeholder="请输入IP或域名" />
        </el-form-item>
        <el-form-item label="控制类型" prop="controlType">
          <el-radio-group v-model="formData.controlType">
            <el-radio :value="1">禁止访问</el-radio>
            <el-radio :value="2">仅允许访问</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
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
  getIpAccessControlPage,
  saveIpAccessControl,
  deleteIpAccessControl,
  updateIpAccessControlStatus
} from '@/api/ipAccessControl'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)

const formData = reactive({
  id: null,
  proxyIpId: null,
  controlTargetType: 1,
  controlTargetValue: '',
  controlType: 1,
  status: 1
})

const formRules = {
  proxyIpId: [{ required: true, message: '请输入代理IP ID', trigger: 'blur' }],
  controlTargetType: [{ required: true, message: '请选择目标类型', trigger: 'change' }],
  controlTargetValue: [{ required: true, message: '请输入目标值', trigger: 'blur' }]
}

const searchForm = reactive({
  controlTargetType: null,
  controlType: null
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
    const res = await getIpAccessControlPage({
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
  searchForm.controlTargetType = null
  searchForm.controlType = null
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
  formData.proxyIpId = null
  formData.controlTargetType = 1
  formData.controlTargetValue = ''
  formData.controlType = 1
  formData.status = 1
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
    await saveIpAccessControl(formData)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    console.error(e)
  }
}

async function handleToggleStatus(row) {
  try {
    await updateIpAccessControlStatus(row.id, row.status === 1 ? 0 : 1)
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
    await deleteIpAccessControl(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}
</script>
