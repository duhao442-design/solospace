<template>
  <div class="page-container">
    <div class="search-bar">
      <el-input
        v-model="keyword"
        placeholder="搜索源名称"
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
      <el-button type="success" @click="handleAdd">新增源</el-button>
    </div>

    <el-table :data="tableData" border v-loading="loading" style="width: 100%;">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="sourceName" label="源名称" width="150" />
      <el-table-column prop="sourceUrl" label="源地址" min-width="250" show-overflow-tooltip />
      <el-table-column prop="parserType" label="解析方式" width="100" />
      <el-table-column prop="crawlInterval" label="爬取间隔(秒)" width="120" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="lastCrawlTime" label="最后爬取" width="170" />
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <div class="table-actions">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" link size="small" @click="handleCrawl(row)">立即爬取</el-button>
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
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px">
        <el-form-item label="源名称" prop="sourceName">
          <el-input v-model="formData.sourceName" placeholder="请输入源名称" />
        </el-form-item>
        <el-form-item label="源地址" prop="sourceUrl">
          <el-input v-model="formData.sourceUrl" placeholder="请输入爬取地址" />
        </el-form-item>
        <el-form-item label="解析方式">
          <el-select v-model="formData.parserType" style="width: 100%;">
            <el-option label="正则表达式" value="regex" />
            <el-option label="XPath" value="xpath" />
            <el-option label="JSON" value="json" />
          </el-select>
        </el-form-item>
        <el-form-item label="解析规则">
          <el-input
            v-model="formData.parserRule"
            type="textarea"
            :rows="3"
            placeholder="请输入解析规则"
          />
        </el-form-item>
        <el-form-item label="爬取间隔(秒)">
          <el-input-number v-model="formData.crawlInterval" :min="60" style="width: 100%;" />
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
  getCrawlerSourcePage,
  saveCrawlerSource,
  deleteCrawlerSource,
  updateCrawlerSourceStatus,
  crawlFromSource
} from '@/api/crawlerSource'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const keyword = ref('')
const statusFilter = ref(null)
const formRef = ref(null)

const formData = reactive({
  id: null,
  sourceName: '',
  sourceUrl: '',
  parserType: 'regex',
  parserRule: '',
  crawlInterval: 3600,
  status: 1
})

const formRules = {
  sourceName: [{ required: true, message: '请输入源名称', trigger: 'blur' }],
  sourceUrl: [{ required: true, message: '请输入源地址', trigger: 'blur' }]
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
    const res = await getCrawlerSourcePage({
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
  dialogTitle.value = '新增爬取源'
  formData.id = null
  formData.sourceName = ''
  formData.sourceUrl = ''
  formData.parserType = 'regex'
  formData.parserRule = ''
  formData.crawlInterval = 3600
  formData.status = 1
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogTitle.value = '编辑爬取源'
  Object.assign(formData, row)
  dialogVisible.value = true
}

function handleDialogClose() {
  formRef.value?.resetFields()
}

async function handleSubmit() {
  await formRef.value?.validate()
  try {
    await saveCrawlerSource(formData)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    console.error(e)
  }
}

async function handleToggleStatus(row) {
  try {
    await updateCrawlerSourceStatus(row.id, row.status === 1 ? 0 : 1)
    ElMessage.success('操作成功')
    loadData()
  } catch (e) {
    console.error(e)
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除该爬取源吗？', '提示', {
      type: 'warning'
    })
    await deleteCrawlerSource(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

async function handleCrawl(row) {
  try {
    const count = await crawlFromSource(row.id)
    ElMessage.success(`爬取完成，新增 ${count} 个IP`)
    loadData()
  } catch (e) {
    console.error(e)
  }
}
</script>
