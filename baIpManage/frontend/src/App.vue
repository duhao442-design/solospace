<template>
  <el-container class="app-container">
    <el-header class="header">
      <div class="logo">代理IP管理系统</div>
      <div class="header-right">
        <span>欢迎使用</span>
      </div>
    </el-header>
    <el-container>
      <el-aside width="200px" class="sidebar">
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/dashboard">
            <el-icon><DataBoard /></el-icon>
            <span>数据概览</span>
          </el-menu-item>
          <el-menu-item index="/ip">
            <el-icon><Monitor /></el-icon>
            <span>IP维护</span>
          </el-menu-item>
          <el-menu-item index="/group">
            <el-icon><Folder /></el-icon>
            <span>IP分组</span>
          </el-menu-item>
          <el-menu-item index="/requester">
            <el-icon><User /></el-icon>
            <span>请求方管理</span>
          </el-menu-item>
          <el-menu-item index="/statistics">
            <el-icon><TrendCharts /></el-icon>
            <span>数据统计</span>
          </el-menu-item>
          <el-sub-menu index="system">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统设置</span>
            </template>
            <el-menu-item index="/location-api">归属地API</el-menu-item>
            <el-menu-item index="/crawl-source">爬取源管理</el-menu-item>
            <el-menu-item index="/config">系统配置</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>
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
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  width: 100%;
}

.app-container {
  height: 100%;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: #409EFF;
}

.sidebar {
  background: #304156;
}

.main-content {
  background: #f0f2f5;
  padding: 20px;
}

.el-menu {
  border-right: none;
}
</style>
