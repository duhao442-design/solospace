<template>
  <div class="ip-group">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>IP分组</span>
              <el-button type="primary" size="small" @click="handleAddGroup">
                <el-icon><Plus /></el-icon>
                新增
              </el-button>
            </div>
          </template>

          <div class="group-list" v-loading="loading">
            <div
              v-for="group in groupList"
              :key="group.id"
              class="group-item"
              :class="{ active: currentGroup?.id === group.id }"
              @click="selectGroup(group)"
            >
              <div class="group-name">{{ group.groupName }}</div>
              <div class="group-code">{{ group.groupCode }}</div>
            </div>
            <el-empty v-if="groupList.length === 0" description="暂无分组" />
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card v-if="currentGroup">
          <template #header>
            <div class="card-header">
              <span>{{ currentGroup.groupName }} - IP列表</span>
              <div class="header-actions">
                <el-button size="small" @click="showAddIpDialog">
                  <el-icon><Plus /></el-icon>
                  添加IP
                </el-button>
                <el-button type="primary" size="small" @click="handleEditGroup">
                  <el-icon><Edit /></el-icon>
                  编辑分组
                </el-button>
                <el-button type="danger" size="small" @click="handleDeleteGroup">
                  <el-icon><Delete /></el-icon>
                  删除分组
                </el-button>
              </div>
            </div>
          </template>

          <el-table :data="ipList" border stripe v-loading="ipLoading">
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
            <el-table-column prop="location" label="归属地" min-width="150" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="danger" @click="handleRemoveIp(row)">移除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="ipList.length === 0" description="暂无IP" />
        </el-card>

        <el-empty v-else description="请选择分组" />
      </el-col>
    </el-row>

    <el-dialog v-model="groupDialogVisible" :title="groupDialogTitle" width="500px">
      <el-form :model="groupForm" :rules="groupRules" ref="groupFormRef" label-width="80px">
        <el-form-item label="分组名称" prop="groupName">
          <el-input v-model="groupForm.groupName" placeholder="请输入分组名称" />
        </el-form-item>
        <el-form-item label="分组编码" prop="groupCode">
          <el-input v-model="groupForm.groupCode" placeholder="请输入分组编码" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="groupForm.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="groupDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitGroup">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="addIpDialogVisible" title="添加IP到分组" width="800px">
      <div class="search-bar">
        <el-input
          v-model="ipSearchKeyword"
          placeholder="搜索IP"
          clearable
          style="width: 200px"
          @keyup.enter="searchIps"
        />
        <el-button type="primary" @click="searchIps">搜索</el-button>
      </div>
      <el-table :data="searchIpList" border stripe @selection-change="handleIpSelectionChange" height="400px">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="ip" label="IP" width="130" />
        <el-table-column prop="port" label="端口" width="80" />
        <el-table-column prop="protocol" label="协议" width="90" />
        <el-table-column prop="location" label="归属地" min-width="150" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
            {{ statusText(row.status) }}
          </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="addIpDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddIpsToGroup" :disabled="selectedIps.length === 0">
          添加选中 ({{ selectedIps.length }})
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getGroupList,
  saveGroup,
  deleteGroup,
  getIpsByGroup,
  addIpToGroup,
  batchAddIpToGroup,
  removeIpFromGroup
} from '@/api/group'
import { getIpPage } from '@/api/ip'

const loading = ref(false)
const ipLoading = ref(false)
const groupList = ref([])
const currentGroup = ref(null)
const ipList = ref([])
const groupDialogVisible = ref(false)
const groupDialogTitle = ref('')
const groupFormRef = ref(null)
const addIpDialogVisible = ref(false)
const ipSearchKeyword = ref('')
const searchIpList = ref([])
const selectedIps = ref([])

const groupForm = reactive({
  id: null,
  groupName: '',
  groupCode: '',
  description: ''
})

const groupRules = {
  groupName: [{ required: true, message: '请输入分组名称', trigger: 'blur' }],
  groupCode: [{ required: true, message: '请输入分组编码', trigger: 'blur' }]
}

const statusText = (status) => {
  const map = { 0: '待验证', 1: '可用', 2: '不可用', 3: '已过期' }
  return map[status] || '未知'
}

const statusTagType = (status) => {
  const map = { 0: 'info', 1: 'success', 2: 'danger', 3: 'warning' }
  return map[status] || 'info'
}

const loadGroups = async () => {
  loading.value = true
  try {
    groupList.value = await getGroupList()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const selectGroup = async (group) => {
  currentGroup.value = group
  await loadGroupIps(group.id)
}

const loadGroupIps = async (groupId) => {
  ipLoading.value = true
  try {
    ipList.value = await getIpsByGroup(groupId)
  } catch (e) {
    console.error(e)
  } finally {
    ipLoading.value = false
  }
}

const handleAddGroup = () => {
  groupDialogTitle.value = '新增分组'
  Object.assign(groupForm, {
    id: null,
    groupName: '',
    groupCode: '',
    description: ''
  })
  groupDialogVisible.value = true
}

const handleEditGroup = () => {
  groupDialogTitle.value = '编辑分组'
  Object.assign(groupForm, { ...currentGroup.value })
  groupDialogVisible.value = true
}

const handleSubmitGroup = async () => {
  if (!groupFormRef.value) return
  try {
    await groupFormRef.value.validate()
    await saveGroup(groupForm)
    ElMessage.success('保存成功')
    groupDialogVisible.value = false
    loadGroups()
  } catch (e) {
    if (e !== false) {
      console.error(e)
    }
  }
}

const handleDeleteGroup = () => {
  ElMessageBox.confirm('确定要删除该分组吗？分组内的IP不会被删除。', '提示', {
    type: 'warning'
  }).then(async () => {
    await deleteGroup(currentGroup.value.id)
    ElMessage.success('删除成功')
    currentGroup.value = null
    loadGroups()
  }).catch(() => {})
}

const showAddIpDialog = () => {
  ipSearchKeyword.value = ''
  searchIpList.value = []
  selectedIps.value = []
  addIpDialogVisible.value = true
  searchIps()
}

const searchIps = async () => {
  try {
    const data = await getIpPage({
      current: 1,
      size: 50,
      keyword: ipSearchKeyword.value || undefined
    })
    const currentIpIds = ipList.value.map(ip => ip.id)
    searchIpList.value = data.records.filter(ip => !currentIpIds.includes(ip.id))
  } catch (e) {
    console.error(e)
  }
}

const handleIpSelectionChange = (selection) => {
  selectedIps.value = selection
}

const handleAddIpsToGroup = async () => {
  if (selectedIps.value.length === 0) return
  try {
    const ids = selectedIps.value.map(ip => ip.id)
    await batchAddIpToGroup(currentGroup.value.id, ids)
    ElMessage.success('添加成功')
    addIpDialogVisible.value = false
    loadGroupIps(currentGroup.value.id)
  } catch (e) {
    console.error(e)
  }
}

const handleRemoveIp = (row) => {
  ElMessageBox.confirm('确定要将该IP从分组中移除吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    await removeIpFromGroup(currentGroup.value.id, row.id)
    ElMessage.success('移除成功')
    loadGroupIps(currentGroup.value.id)
  }).catch(() => {})
}

onMounted(() => {
  loadGroups()
})
</script>

<style scoped>
.ip-group {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.group-list {
  max-height: 600px;
  overflow-y: auto;
}

.group-item {
  padding: 12px 16px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 8px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s;
}

.group-item:hover {
  background: #ecf5ff;
  border-color: #409EFF;
}

.group-item.active {
  background: #409EFF;
  border-color: #409EFF;
}

.group-item.active .group-name,
.group-item.active .group-code {
  color: #fff;
}

.group-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.group-code {
  font-size: 12px;
  color: #909399;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.search-bar {
  margin-bottom: 15px;
  display: flex;
  gap: 10px;
}
</style>
