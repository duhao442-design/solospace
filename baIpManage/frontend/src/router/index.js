import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue')
  },
  {
    path: '/ip',
    name: 'ProxyIp',
    component: () => import('@/views/ProxyIp.vue')
  },
  {
    path: '/group',
    name: 'IpGroup',
    component: () => import('@/views/IpGroup.vue')
  },
  {
    path: '/requester',
    name: 'Requester',
    component: () => import('@/views/Requester.vue')
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: () => import('@/views/Statistics.vue')
  },
  {
    path: '/location-api',
    name: 'LocationApi',
    component: () => import('@/views/LocationApi.vue')
  },
  {
    path: '/crawl-source',
    name: 'CrawlSource',
    component: () => import('@/views/CrawlSource.vue')
  },
  {
    path: '/config',
    name: 'Config',
    component: () => import('@/views/Config.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
