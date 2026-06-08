<template>
  <div class="page-container">
    <div class="search-bar">
      <el-input
        v-model="keyword"
        placeholder="搜索分组名称/编码"
        clearable
        style="width: 250px;"
        @keyup.enter="loadData"
      />
      <el-button type="primary" @click="loadData">搜索</el-button>
      <el-button type="success" @click="handleAdd">新增分组</el-button>
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
      <el-table-column prop="groupName" label="分组名称" width="200" />
      <el-table-column prop="groupCode" label="分组编码" width="200" />
      <el-table-column prop="description" label="描述" min-width="200" />
      <el-table-column prop="sortOrder" label="排序" width="100" />
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <div class="table-actions">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
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
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="分组名称" prop="groupName">
          <el-input v-model="formData.groupName" placeholder="请输入分组名称" />
        </el-form-item>
        <el-form-item label="分组编码" prop="groupCode">
          <el-input v-model="formData.groupCode" placeholder="请输入分组编码" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="formData.sortOrder" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
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
  getIpGroupPage,
  saveIpGroup,
  deleteIpGroup,
  batchDeleteIpGroup
} from '@/api/ipGroup'

const loading = ref(false)
const tableData = ref([])
const selectedIds = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const keyword = ref('')
const formRef = ref(null)

const formData = reactive({
  id: null,
  groupName: '',
  groupCode: '',
  description: '',
  sortOrder: 0
})

const formRules = {
  groupName: [{ required: true, message: '请输入分组名称', trigger: 'blur' }],
  groupCode: [{ required: true, message: '请输入分组编码', trigger: 'blur' }]
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
    const res = await getIpGroupPage({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      keyword: keyword.value
    })
    tableData.value = res.records
    pagination.total = res.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
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

function handleAdd() {
  dialogTitle.value = '新增分组'
  formData.id = null
  formData.groupName = ''
  formData.groupCode = ''
  formData.description = ''
  formData.sortOrder = 0
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogTitle.value = '编辑分组'
  Object.assign(formData, row)
  dialogVisible.value = true
}

function handleDialogClose() {
  formRef.value?.resetFields()
}

async function handleSubmit() {
  await formRef.value?.validate()
  try {
    await saveIpGroup(formData)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    console.error(e)
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除该分组吗？', '提示', {
      type: 'warning'
    })
    await deleteIpGroup(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}
</script>
