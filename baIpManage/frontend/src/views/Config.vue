<template>
  <div class="config">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>系统配置</span>
        </div>
      </template>

      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="configKey" label="配置键" width="250" />
        <el-table-column prop="configValue" label="配置值" min-width="200">
          <template #default="{ row }">
            <span v-if="!row.editing">{{ row.configValue }}</span>
            <el-input
              v-else
              v-model="row.editValue"
              size="small"
              @keyup.enter="handleSave(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button v-if="!row.editing" size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <template v-else>
              <el-button size="small" type="success" @click="handleSave(row)">保存</el-button>
              <el-button size="small" @click="handleCancel(row)">取消</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getConfigList, updateConfig } from '@/api/system'

const loading = ref(false)
const tableData = ref([])

const loadData = async () => {
  loading.value = true
  try {
    const data = await getConfigList()
    tableData.value = data.map(item => ({
      ...item,
      editing: false,
      editValue: item.configValue
    }))
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleEdit = (row) => {
  row.editing = true
  row.editValue = row.configValue
}

const handleCancel = (row) => {
  row.editing = false
  row.editValue = row.configValue
}

const handleSave = async (row) => {
  try {
    await updateConfig({
      configKey: row.configKey,
      configValue: row.editValue
    })
    ElMessage.success('保存成功')
    row.configValue = row.editValue
    row.editing = false
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.config {
  padding: 0;
}

.card-header {
  font-weight: 600;
}
</style>
