<template>
  <div class="crawl-source">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>爬取源管理</span>
          <div class="header-actions">
            <el-button type="success" @click="handleRunNow">
              <el-icon><Refresh /></el-icon>
              立即爬取
            </el-button>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新增爬取源
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="sourceName" label="来源名称" width="150" />
        <el-table-column prop="sourceUrl" label="来源URL" min-width="250" show-overflow-tooltip />
        <el-table-column prop="crawlInterval" label="爬取间隔(秒)" width="120" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastCrawlTime" label="最后爬取时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="来源名称" prop="sourceName">
              <el-input v-model="form.sourceName" placeholder="请输入来源名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="爬取间隔">
              <el-input v-model="form.crawlInterval" type="number" placeholder="秒" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="来源URL" prop="sourceUrl">
          <el-input v-model="form.sourceUrl" placeholder="请输入爬取URL" />
        </el-form-item>
        <el-form-item label="解析规则">
          <el-input v-model="form.parseRule" type="textarea" :rows="6" placeholder="JSON格式的解析规则" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
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
  getCrawlSourceList,
  saveCrawlSource,
  deleteCrawlSource,
  runCrawlNow
} from '@/api/system'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)

const form = reactive({
  id: null,
  sourceName: '',
  sourceUrl: '',
  parseRule: '',
  crawlInterval: 3600,
  status: 1
})

const rules = {
  sourceName: [{ required: true, message: '请输入来源名称', trigger: 'blur' }],
  sourceUrl: [{ required: true, message: '请输入来源URL', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    tableData.value = await getCrawlSourceList()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  dialogTitle.value = '新增爬取源'
  Object.assign(form, {
    id: null,
    sourceName: '',
    sourceUrl: '',
    parseRule: '',
    crawlInterval: 3600,
    status: 1
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑爬取源'
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    await saveCrawlSource(form)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    if (e !== false) console.error(e)
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该爬取源吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    await deleteCrawlSource(row.id)
    ElMessage.success('删除成功')
    loadData()
  }).catch(() => {})
}

const handleRunNow = () => {
  ElMessageBox.confirm('确定要立即执行爬取任务吗？', '提示', {
    type: 'info'
  }).then(async () => {
    await runCrawlNow()
    ElMessage.success('已开始爬取，请稍后查看结果')
  }).catch(() => {})
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.crawl-source {
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
</style>
