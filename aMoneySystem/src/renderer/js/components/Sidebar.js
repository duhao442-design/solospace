export default {
  name: 'Sidebar',
  props: {
    sidebarCollapsed: {
      type: Boolean,
      default: true
    }
  },
  emits: ['toggle-sidebar', 'pin-sidebar'],
  data() {
    return {
      isHovered: false,
      isPinned: false,
      activeMenu: '/'
    };
  },
  computed: {
    showSidebar() {
      return !this.sidebarCollapsed || this.isHovered || this.isPinned;
    }
  },
  mounted() {
    this.activeMenu = this.$route.path;
    this.$router.afterEach((to) => {
      this.activeMenu = to.path;
    });
  },
  methods: {
    handleMouseEnter() {
      if (!this.isPinned) {
        this.isHovered = true;
        this.$emit('toggle-sidebar', false);
      }
    },
    handleMouseLeave() {
      if (!this.isPinned) {
        this.isHovered = false;
        this.$emit('toggle-sidebar', true);
      }
    },
    togglePin() {
      this.isPinned = !this.isPinned;
      this.$emit('pin-sidebar', this.isPinned);
    },
    navigateTo(path) {
      this.$router.push(path);
      this.activeMenu = path;
    }
  },
  template: `
    <div 
      class="sidebar" 
      :class="{ 
        'sidebar-expanded': showSidebar, 
        'sidebar-collapsed-default': !showSidebar,
        'sidebar-pinned': isPinned
      }"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <div class="sidebar-header">
        <div class="logo">
          <el-icon size="24" color="#409eff"><Money /></el-icon>
          <span v-if="showSidebar" class="logo-text">aMoneySystem</span>
        </div>
        <el-button 
          v-if="showSidebar" 
          class="pin-btn" 
          :type="isPinned ? 'primary' : ''" 
          text 
          size="small"
          @click="togglePin"
        >
          <el-icon><PushPin v-if="isPinned" /><Collection v-else /></el-icon>
        </el-button>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        :collapse="!showSidebar"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        class="sidebar-menu"
      >
        <el-menu-item index="/" @click="navigateTo('/')">
          <el-icon><House /></el-icon>
          <template #title>首页概览</template>
        </el-menu-item>
        <el-menu-item index="/all-bills" @click="navigateTo('/all-bills')">
          <el-icon><Document /></el-icon>
          <template #title>全部账单</template>
        </el-menu-item>
        <el-menu-item index="/monthly-analysis" @click="navigateTo('/monthly-analysis')">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>每月收支分析</template>
        </el-menu-item>
        <el-menu-item index="/family-management" @click="navigateTo('/family-management')">
          <el-icon><User /></el-icon>
          <template #title>家庭管理</template>
        </el-menu-item>
        <el-menu-item index="/add-bill" @click="navigateTo('/add-bill')">
          <el-icon><Plus /></el-icon>
          <template #title>新增账单</template>
        </el-menu-item>
        <el-menu-item index="/system-settings" @click="navigateTo('/system-settings')">
          <el-icon><Setting /></el-icon>
          <template #title>系统管理</template>
        </el-menu-item>
      </el-menu>
    </div>
  `
};

const style = document.createElement('style');
style.textContent = `
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100%;
    background: #304156;
    transition: width 0.3s ease;
    z-index: 999;
    overflow: hidden;
  }
  
  .sidebar-collapsed-default {
    width: 60px;
  }
  
  .sidebar-expanded {
    width: 220px;
  }
  
  .sidebar-pinned {
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  }
  
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    padding: 0 16px;
    background: #2b3a4a;
    border-bottom: 1px solid #1f2d3d;
  }
  
  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
  }
  
  .logo-text {
    white-space: nowrap;
  }
  
  .pin-btn {
    color: #bfcbd9;
  }
  
  .sidebar-menu {
    border-right: none;
    height: calc(100% - 60px);
  }
  
  .sidebar-menu .el-menu-item {
    height: 50px;
    line-height: 50px;
  }
  
  .sidebar-menu:not(.el-menu--collapse) .el-menu-item {
    padding-left: 20px !important;
  }
`;
document.head.appendChild(style);
