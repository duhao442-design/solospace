<template>
  <el-container class="app-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon><Monitor /></el-icon>
        <span>IP管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据概览</span>
        </el-menu-item>
        <el-sub-menu index="ip-manage">
          <template #title>
            <el-icon><Cpu /></el-icon>
            <span>IP管理</span>
          </template>
          <el-menu-item index="/proxy-ip">代理IP列表</el-menu-item>
          <el-menu-item index="/pending-ip">待验证IP</el-menu-item>
          <el-menu-item index="/ip-group">IP分组</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="control-manage">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>访问控制</span>
          </template>
          <el-menu-item index="/requester-control">请求方控制</el-menu-item>
          <el-menu-item index="/ip-access-control">IP访问控制</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="api-manage">
          <template #title>
            <el-icon><Connection /></el-icon>
            <span>API配置</span>
          </template>
          <el-menu-item index="/location-api">归属地API</el-menu-item>
          <el-menu-item index="/crawler-source">爬取源管理</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/request-log">
          <el-icon><Document /></el-icon>
          <span>请求日志</span>
        </el-menu-item>
        <el-menu-item index="/sys-config">
          <el-icon><Tools /></el-icon>
          <span>系统配置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-title">{{ pageTitle }}</div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const activeMenu = computed(() => route.path)

const pageTitle = computed(() => route.meta?.title || '代理IP管理系统')
</script>

<style lang="scss" scoped>
.app-container {
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  background-color: #304156;
  overflow-y: auto;

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 18px;
    font-weight: bold;
    background-color: #2b2f3a;

    .el-icon {
      margin-right: 8px;
      font-size: 24px;
    }
  }

  :deep(.el-menu) {
    border-right: none;
  }
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  padding: 0 20px;

  .header-title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }
}

.main-content {
  background-color: #f0f2f5;
  overflow-y: auto;
  padding: 20px;
}
</style>
