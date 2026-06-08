<template>
  <div class="page-container">
    <div class="page-header">
      <h3>系统配置</h3>
    </div>

    <el-table :data="configList" border v-loading="loading" style="width: 100%;">
      <el-table-column prop="configKey" label="配置键" width="250" />
      <el-table-column prop="configValue" label="配置值" min-width="200">
        <template #default="{ row }">
          <el-input
            v-if="editingKey === row.configKey"
            v-model="editValue"
            size="small"
            style="width: 100%;"
            @keyup.enter="handleSave(row)"
          />
          <span v-else>{{ row.configValue }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="250" />
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column prop="updateTime" label="更新时间" width="170" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="editingKey !== row.configKey"
            type="primary"
            link
            size="small"
            @click="handleEdit(row)"
          >
            编辑
          </el-button>
          <div v-else class="table-actions">
            <el-button type="success" link size="small" @click="handleSave(row)">
              保存
            </el-button>
            <el-button type="info" link size="small" @click="handleCancel">
              取消
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAllSysConfig, updateSysConfig } from '@/api/sysConfig'

const loading = ref(false)
const configList = ref([])
const editingKey = ref('')
const editValue = ref('')

onMounted(() => {
  loadData()
})

async function loadData() {
  loading.value = true
  try {
    const data = await getAllSysConfig()
    configList.value = Object.entries(data).map(([key, value]) => ({
      configKey: key,
      configValue: value,
      description: getDescription(key)
    }))
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function getDescription(key) {
  const descMap = {
    'ip.check.interval': 'IP可用性检查间隔(秒)',
    'ip.check.thread.pool.size': 'IP检查线程池大小',
    'ip.crawl.interval': 'IP爬取间隔(秒)',
    'ip.verify.timeout': 'IP验证超时时间(毫秒)',
    'ip.max.batch.get': '批量获取IP最大数量',
    'api.rate.limit.default': 'API默认限流(每秒请求数)'
  }
  return descMap[key] || ''
}

function handleEdit(row) {
  editingKey.value = row.configKey
  editValue.value = row.configValue
}

function handleCancel() {
  editingKey.value = ''
  editValue.value = ''
}

async function handleSave(row) {
  try {
    await updateSysConfig(row.configKey, editValue.value)
    ElMessage.success('保存成功')
    editingKey.value = ''
    loadData()
  } catch (e) {
    console.error(e)
  }
}
</script>
