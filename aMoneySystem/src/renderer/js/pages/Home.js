import api from '../api.js';

export default {
  name: 'Home',
  data() {
    return {
      totalIncome: 0,
      totalExpense: 0,
      netWorth: 0,
      recentTransactions: [],
      dateRange: '7',
      customDateRange: [],
      pieChartData: [],
      pieChart: null,
      loading: false
    };
  },
  mounted() {
    this.loadData();
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        const { startDate, endDate } = this.getDateRange();
        
        const [income, expense, transactions, tagTypes] = await Promise.all([
          api.getTotalByType('income', startDate, endDate),
          api.getTotalByType('expense', startDate, endDate),
          api.getTransactions(null, null, null, 10),
          api.getTagTypes()
        ]);
        
        this.totalIncome = income;
        this.totalExpense = expense;
        this.netWorth = income - expense;
        this.recentTransactions = transactions;
        
        const categoryType = tagTypes.find(t => t.name === '消费分类');
        if (categoryType) {
          this.pieChartData = await api.getExpenseByTag(categoryType.id, startDate, endDate);
          this.$nextTick(() => this.initPieChart());
        }
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
    },
    
    getDateRange() {
      const end = new Date();
      let start = new Date();
      
      if (this.dateRange === 'custom' && this.customDateRange.length === 2) {
        return {
          startDate: this.customDateRange[0],
          endDate: this.customDateRange[1]
        };
      }
      
      start.setDate(start.getDate() - parseInt(this.dateRange));
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      };
    },
    
    initPieChart() {
      const chartDom = this.$refs.pieChart;
      if (!chartDom) return;
      
      if (this.pieChart) {
        this.pieChart.dispose();
      }
      
      this.pieChart = echarts.init(chartDom);
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          right: '5%',
          top: 'center'
        },
        series: [
          {
            name: '消费占比',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['35%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              formatter: '{b}\n{d}%'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 16,
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: true
            },
            data: this.pieChartData.map(item => ({
              value: item.amount,
              name: item.name
            }))
          }
        ],
        color: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#00c1de', '#ff6b6b', '#722ed1']
      };
      
      this.pieChart.setOption(option);
      window.addEventListener('resize', () => this.pieChart.resize());
    },
    
    formatAmount(amount) {
      return '¥' + parseFloat(amount).toFixed(2);
    },
    
    getTypeClass(type) {
      return type === 'income' ? 'income' : 'expense';
    },
    
    getTypeText(type) {
      return type === 'income' ? '收入' : '支出';
    },
    
    onDateRangeChange() {
      if (this.dateRange !== 'custom') {
        this.loadData();
      }
    },
    
    onCustomDateChange() {
      if (this.customDateRange.length === 2) {
        this.loadData();
      }
    }
  },
  template: `
    <div class="page-container home-page">
      <h1 class="page-title">首页概览</h1>
      
      <div class="stats-row">
        <div class="stat-card income-card">
          <div class="stat-icon">
            <el-icon size="32"><TrendCharts /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">总收入</div>
            <div class="stat-value">{{ formatAmount(totalIncome) }}</div>
          </div>
        </div>
        
        <div class="stat-card expense-card">
          <div class="stat-icon">
            <el-icon size="32"><ShoppingCart /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">总支出</div>
            <div class="stat-value">{{ formatAmount(totalExpense) }}</div>
          </div>
        </div>
        
        <div class="stat-card networth-card">
          <div class="stat-icon">
            <el-icon size="32"><Wallet /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">净资产</div>
            <div class="stat-value" :class="{ negative: netWorth < 0 }">{{ formatAmount(netWorth) }}</div>
          </div>
        </div>
      </div>
      
      <div class="content-row">
        <div class="card chart-card">
          <div class="card-header">
            <h3 class="card-title">消费倾向分析</h3>
            <div class="date-selector">
              <el-radio-group v-model="dateRange" size="small" @change="onDateRangeChange">
                <el-radio-button label="7">近7天</el-radio-button>
                <el-radio-button label="30">近30天</el-radio-button>
                <el-radio-button label="90">近90天</el-radio-button>
                <el-radio-button label="custom">自定义</el-radio-button>
              </el-radio-group>
              <el-date-picker
                v-if="dateRange === 'custom'"
                v-model="customDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                size="small"
                style="margin-left: 10px;"
                @change="onCustomDateChange"
              />
            </div>
          </div>
          <div ref="pieChart" class="pie-chart"></div>
        </div>
        
        <div class="card transactions-card">
          <div class="card-header">
            <h3 class="card-title">最近交易</h3>
            <el-button type="primary" link @click="$router.push('/all-bills')">查看全部</el-button>
          </div>
          <el-table :data="recentTransactions" style="width: 100%" v-loading="loading">
            <el-table-column prop="transaction_date" label="日期" width="110">
              <template #default="{ row }">{{ row.transaction_date }}</template>
            </el-table-column>
            <el-table-column prop="type" label="类型" width="70">
              <template #default="{ row }">
                <el-tag :type="row.type === 'income' ? 'success' : 'danger'" size="small">
                  {{ getTypeText(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="100">
              <template #default="{ row }">
                <span :class="getTypeClass(row.type)">
                  {{ row.type === 'income' ? '+' : '-' }}{{ formatAmount(row.amount) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="tag_names" label="分类">
              <template #default="{ row }">{{ row.tag_names || '-' }}</template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
  `
};

const style = document.createElement('style');
style.textContent = `
  .home-page {
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ed 100%);
  }
  
  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .stat-card {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  }
  
  .stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .income-card .stat-icon {
    background: linear-gradient(135deg, #67c23a, #85ce61);
    color: #fff;
  }
  
  .expense-card .stat-icon {
    background: linear-gradient(135deg, #f56c6c, #f78989);
    color: #fff;
  }
  
  .networth-card .stat-icon {
    background: linear-gradient(135deg, #409eff, #66b1ff);
    color: #fff;
  }
  
  .stat-label {
    font-size: 14px;
    color: #909399;
    margin-bottom: 8px;
  }
  
  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: #303133;
  }
  
  .stat-value.negative {
    color: #f56c6c;
  }
  
  .content-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .chart-card {
    min-height: 400px;
  }
  
  .pie-chart {
    width: 100%;
    height: 300px;
  }
  
  .date-selector {
    display: flex;
    align-items: center;
  }
  
  .income {
    color: #67c23a;
    font-weight: 600;
  }
  
  .expense {
    color: #f56c6c;
    font-weight: 600;
  }
  
  .transactions-card .el-table {
    font-size: 13px;
  }
  
  @media (max-width: 1200px) {
    .content-row {
      grid-template-columns: 1fr;
    }
  }
  
  @media (max-width: 768px) {
    .stats-row {
      grid-template-columns: 1fr;
    }
  }
`;
document.head.appendChild(style);
