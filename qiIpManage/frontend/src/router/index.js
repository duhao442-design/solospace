import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '数据概览' }
  },
  {
    path: '/proxy-ip',
    name: 'ProxyIp',
    component: () => import('@/views/ProxyIp.vue'),
    meta: { title: '代理IP列表' }
  },
  {
    path: '/pending-ip',
    name: 'PendingIp',
    component: () => import('@/views/PendingIp.vue'),
    meta: { title: '待验证IP' }
  },
  {
    path: '/ip-group',
    name: 'IpGroup',
    component: () => import('@/views/IpGroup.vue'),
    meta: { title: 'IP分组' }
  },
  {
    path: '/requester-control',
    name: 'RequesterControl',
    component: () => import('@/views/RequesterControl.vue'),
    meta: { title: '请求方控制' }
  },
  {
    path: '/ip-access-control',
    name: 'IpAccessControl',
    component: () => import('@/views/IpAccessControl.vue'),
    meta: { title: 'IP访问控制' }
  },
  {
    path: '/location-api',
    name: 'LocationApi',
    component: () => import('@/views/LocationApi.vue'),
    meta: { title: '归属地API配置' }
  },
  {
    path: '/crawler-source',
    name: 'CrawlerSource',
    component: () => import('@/views/CrawlerSource.vue'),
    meta: { title: '爬取源管理' }
  },
  {
    path: '/request-log',
    name: 'RequestLog',
    component: () => import('@/views/RequestLog.vue'),
    meta: { title: '请求日志' }
  },
  {
    path: '/sys-config',
    name: 'SysConfig',
    component: () => import('@/views/SysConfig.vue'),
    meta: { title: '系统配置' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
