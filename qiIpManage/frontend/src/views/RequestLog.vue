<template>
  <div class="page-container">
    <div class="search-bar">
      <el-input
        v-model="searchForm.proxyIp"
        placeholder="代理IP"
        clearable
        style="width: 180px;"
        @keyup.enter="loadData"
      />
      <el-input
        v-model="searchForm.requesterIp"
        placeholder="请求方IP"
        clearable
        style="width: 180px;"
        @keyup.enter="loadData"
      />
      <el-select v-model="searchForm.success" placeholder="状态" clearable style="width: 120px;">
        <el-option label="成功" :value="1" />
        <el-option label="失败" :value="0" />
      </el-select>
      <el-button type="primary" @click="loadData">搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <el-table :data="tableData" border v-loading="loading" style="width: 100%;">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="proxyIp" label="代理IP" width="130" />
      <el-table-column prop="requesterIp" label="请求方IP" width="130" />
      <el-table-column prop="requestPath" label="请求路径" min-width="200" show-overflow-tooltip />
      <el-table-column prop="requestMethod" label="方法" width="80" />
      <el-table-column prop="responseStatus" label="响应码" width="90" />
      <el-table-column prop="responseTime" label="响应时间(ms)" width="110" />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.success === 1 ? 'success' : 'danger'" size="small">
            {{ row.success === 1 ? '成功' : '失败' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="errorMsg" label="错误信息" min-width="150" show-overflow-tooltip />
      <el-table-column prop="createTime" label="创建时间" width="170" />
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getRequestLogPage } from '@/api/requestLog'

const loading = ref(false)
const tableData = ref([])

const searchForm = reactive({
  proxyIp: '',
  requesterIp: '',
  success: null
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
    const res = await getRequestLogPage({
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
  searchForm.proxyIp = ''
  searchForm.requesterIp = ''
  searchForm.success = null
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
</script>
