const { createApp } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

import Sidebar from './components/Sidebar.js';
import Home from './pages/Home.js';
import AllBills from './pages/AllBills.js';
import MonthlyAnalysis from './pages/MonthlyAnalysis.js';
import FamilyManagement from './pages/FamilyManagement.js';
import AddBill from './pages/AddBill.js';
import SystemSettings from './pages/SystemSettings.js';

const routes = [
  { path: '/', component: Home, meta: { title: '首页概览' } },
  { path: '/all-bills', component: AllBills, meta: { title: '全部账单' } },
  { path: '/monthly-analysis', component: MonthlyAnalysis, meta: { title: '每月收支分析' } },
  { path: '/family-management', component: FamilyManagement, meta: { title: '家庭管理' } },
  { path: '/add-bill', component: AddBill, meta: { title: '新增账单' } },
  { path: '/system-settings', component: SystemSettings, meta: { title: '系统管理' } }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

const App = {
  components: { Sidebar },
  template: `
    <div class="app-container">
      <Sidebar :sidebar-collapsed="sidebarCollapsed" @toggle-sidebar="toggleSidebar" @pin-sidebar="pinSidebar" />
      <div class="main-content" :class="{ 'sidebar-pinned': !sidebarCollapsed }">
        <router-view />
      </div>
      <el-button 
        class="add-bill-fab" 
        type="primary" 
        circle 
        @click="goToAddBill"
      >
        <el-icon><Plus /></el-icon>
      </el-button>
    </div>
  `,
  data() {
    return {
      sidebarCollapsed: true
    };
  },
  methods: {
    toggleSidebar(collapsed) {
      this.sidebarCollapsed = collapsed;
    },
    pinSidebar(pinned) {
      this.sidebarCollapsed = !pinned;
    },
    goToAddBill() {
      this.$router.push('/add-bill');
    }
  }
};

const app = createApp(App);
app.use(router);
app.use(ElementPlus);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.mount('#app');

const style = document.createElement('style');
style.textContent = `
  .app-container {
    display: flex;
    width: 100%;
    height: 100%;
    background: #f5f7fa;
  }
  
  .main-content {
    flex: 1;
    margin-left: 60px;
    transition: margin-left 0.3s ease;
    overflow-y: auto;
    height: 100%;
  }
  
  .main-content.sidebar-pinned {
    margin-left: 220px;
  }
  
  .add-bill-fab {
    position: fixed;
    right: 30px;
    bottom: 30px;
    width: 56px;
    height: 56px;
    font-size: 24px;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
    z-index: 1000;
  }
  
  .add-bill-fab:hover {
    transform: scale(1.1);
  }
  
  .page-container {
    padding: 24px;
    min-height: 100%;
  }
  
  .page-title {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 24px;
  }
  
  .card {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    margin-bottom: 20px;
  }
  
  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 16px;
  }
`;
document.head.appendChild(style);
