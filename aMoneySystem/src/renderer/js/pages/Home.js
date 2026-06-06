import api from '../api.js';

export default {
  name: 'Home',
  data() {
    return {
      totalAssets: 0,
      totalLiabilities: 0,
      netWorth: 0,
      periodIncome: 0,
      periodExpense: 0,
      recentTransactions: [],
      dateRange: '30',
      customDateRange: [],
      pieChartData: [],
      pieChart: null,
      trendChart: null,
      trendData: [],
      loading: false
    };
  },
  mounted() {
    this.loadData();
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
    if (this.pieChart) {
      this.pieChart.dispose();
    }
    if (this.trendChart) {
      this.trendChart.dispose();
    }
  },
  methods: {
    handleResize() {
      if (this.pieChart) {
        this.pieChart.resize();
      }
      if (this.trendChart) {
        this.trendChart.resize();
      }
    },
    
    async loadData() {
      this.loading = true;
      try {
        const { startDate, endDate } = this.getDateRange();
        
        const [assets, liabilities, netWorth, income, expense, transactions, tagTypes, history] = await Promise.all([
          api.getTotalBalance('asset'),
          api.getTotalBalance('liability'),
          api.getNetWorth(),
          api.getTotalByType('income', startDate, endDate),
          api.getTotalByType('expense', startDate, endDate),
          api.getTransactions(null, null, null, 10),
          api.getTagTypes(),
          api.getBalanceHistory('net', startDate, endDate)
        ]);
        
        this.totalAssets = assets;
        this.totalLiabilities = liabilities;
        this.netWorth = netWorth;
        this.periodIncome = income;
        this.periodExpense = expense;
        this.recentTransactions = transactions;
        this.trendData = history;
        
        const categoryType = tagTypes.find(t => t.name === '消费分类');
        if (categoryType) {
          this.pieChartData = await api.getExpenseByTag(categoryType.id, startDate, endDate);
        }
        
        this.$nextTick(() => {
          this.initPieChart();
          this.initTrendChart();
        });
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
    
    initTrendChart() {
      const chartDom = this.$refs.trendChart;
      if (!chartDom) return;
      
      if (this.trendChart) {
        this.trendChart.dispose();
      }
      
      this.trendChart = echarts.init(chartDom);
      
      const dates = this.trendData.map(item => item.date);
      const assetsData = this.trendData.map(item => item.assets);
      const liabilitiesData = this.trendData.map(item => item.liabilities);
      const netWorthData = this.trendData.map(item => item.net_worth);
      
      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: function(params) {
            let result = params[0].name + '<br/>';
            params.forEach(param => {
              result += param.marker + param.seriesName + ': ¥' + Number(param.value).toFixed(2) + '<br/>';
            });
            return result;
          }
        },
        legend: {
          data: ['总资产', '总负债', '净资产'],
          bottom: 0
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          top: '10%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: dates,
          axisLabel: {
            fontSize: 10
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '¥{value}'
          }
        },
        series: [
          {
            name: '总资产',
            type: 'line',
            smooth: true,
            data: assetsData,
            itemStyle: { color: '#67c23a' },
            lineStyle: { width: 2 },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
                { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
              ])
            }
          },
          {
            name: '总负债',
            type: 'line',
            smooth: true,
            data: liabilitiesData,
            itemStyle: { color: '#f56c6c' },
            lineStyle: { width: 2 },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(245, 108, 108, 0.3)' },
                { offset: 1, color: 'rgba(245, 108, 108, 0.05)' }
              ])
            }
          },
          {
            name: '净资产',
            type: 'line',
            smooth: true,
            data: netWorthData,
            itemStyle: { color: '#409eff' },
            lineStyle: { width: 3 },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
                { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
              ])
            }
          }
        ]
      };
      
      this.trendChart.setOption(option);
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
          top: 'center',
          textStyle: { fontSize: 12 }
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
              show: false
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 14,
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
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
    },
    
    formatAmount(amount) {
      return '¥' + parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
        <div class="stat-card asset-card" @click="$router.push('/account-management')">
          <div class="stat-icon">
            <el-icon size="28"><Wallet /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">总资产</div>
            <div class="stat-value">{{ formatAmount(totalAssets) }}</div>
          </div>
        </div>
        
        <div class="stat-card liability-card" @click="$router.push('/account-management')">
          <div class="stat-icon">
            <el-icon size="28"><CreditCard /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">总负债</div>
            <div class="stat-value">{{ formatAmount(totalLiabilities) }}</div>
          </div>
        </div>
        
        <div class="stat-card networth-card" @click="$router.push('/account-management')">
          <div class="stat-icon">
            <el-icon size="28"><TrendCharts /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">净资产</div>
            <div class="stat-value" :class="{ negative: netWorth < 0 }">{{ formatAmount(netWorth) }}</div>
          </div>
        </div>
      </div>
      
      <div class="stats-row mini-stats">
        <div class="mini-stat">
          <span class="mini-label">本期收入</span>
          <span class="mini-value income">{{ formatAmount(periodIncome) }}</span>
        </div>
        <div class="mini-stat">
          <span class="mini-label">本期支出</span>
          <span class="mini-value expense">{{ formatAmount(periodExpense) }}</span>
        </div>
        <div class="mini-stat">
          <span class="mini-label">本期结余</span>
          <span class="mini-value" :class="periodIncome - periodExpense >= 0 ? 'income' : 'expense'">
            {{ formatAmount(periodIncome - periodExpense) }}
          </span>
        </div>
      </div>
      
      <div class="content-row">
        <div class="card chart-card">
          <div class="card-header">
            <h3 class="card-title">资产负债趋势</h3>
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
          <div ref="trendChart" class="trend-chart"></div>
        </div>
      </div>
      
      <div class="content-row">
        <div class="card chart-card">
          <div class="card-header">
            <h3 class="card-title">消费倾向分析</h3>
          </div>
          <div ref="pieChart" class="pie-chart"></div>
        </div>
        
        <div class="card transactions-card">
          <div class="card-header">
            <h3 class="card-title">最近交易</h3>
            <el-button type="primary" link @click="$router.push('/all-bills')">查看全部</el-button>
          </div>
          <el-table :data="recentTransactions" style="width: 100%" v-loading="loading">
            <el-table-column prop="transaction_date" label="日期" width="100">
              <template #default="{ row }">{{ row.transaction_date }}</template>
            </el-table-column>
            <el-table-column prop="type" label="类型" width="60">
              <template #default="{ row }">
                <el-tag :type="row.type === 'income' ? 'success' : 'danger'" size="small">
                  {{ getTypeText(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="90">
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
    margin-bottom: 16px;
  }
  
  .stat-card {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    transition: transform 0.2s, box-shadow 0.2s;
    cursor: pointer;
  }
  
  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  }
  
  .stat-icon {
    width: 52px;
    height: 52px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .asset-card .stat-icon {
    background: linear-gradient(135deg, #67c23a, #85ce61);
    color: #fff;
  }
  
  .liability-card .stat-icon {
    background: linear-gradient(135deg, #f56c6c, #f78989);
    color: #fff;
  }
  
  .networth-card .stat-icon {
    background: linear-gradient(135deg, #409eff, #66b1ff);
    color: #fff;
  }
  
  .stat-label {
    font-size: 13px;
    color: #909399;
    margin-bottom: 6px;
  }
  
  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #303133;
  }
  
  .stat-value.negative {
    color: #f56c6c;
  }
  
  .mini-stats {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 20px;
  }
  
  .mini-stat {
    background: #fff;
    border-radius: 8px;
    padding: 14px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  
  .mini-label {
    font-size: 13px;
    color: #909399;
  }
  
  .mini-value {
    font-size: 16px;
    font-weight: 600;
  }
  
  .mini-value.income {
    color: #67c23a;
  }
  
  .mini-value.expense {
    color: #f56c6c;
  }
  
  .content-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .content-row:first-of-type {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .card-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
  
  .chart-card {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  }
  
  .trend-chart {
    width: 100%;
    height: 280px;
  }
  
  .pie-chart {
    width: 100%;
    height: 280px;
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
  
  .transactions-card {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
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
    
    .mini-stats {
      grid-template-columns: 1fr;
    }
  }
`;
document.head.appendChild(style);
