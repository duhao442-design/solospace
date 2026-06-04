import api from '../api.js';

export default {
  name: 'MonthlyAnalysis',
  data() {
    return {
      selectedMonth: '',
      tagTypes: [],
      selectedTagType: null,
      pieChart: null,
      totalIncome: 0,
      totalExpense: 0,
      chartData: [],
      loading: false
    };
  },
  mounted() {
    const now = new Date();
    this.selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.loadTagTypes();
    this.loadData();
  },
  methods: {
    async loadTagTypes() {
      this.tagTypes = await api.getTagTypes();
      if (this.tagTypes.length > 0) {
        this.selectedTagType = this.tagTypes[0].id;
      }
    },
    
    async loadData() {
      this.loading = true;
      try {
        const [year, month] = this.selectedMonth.split('-');
        const startDate = `${year}-${month}-01`;
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const endDate = `${year}-${month}-${lastDay}`;
        
        const [income, expense] = await Promise.all([
          api.getTotalByType('income', startDate, endDate),
          api.getTotalByType('expense', startDate, endDate)
        ]);
        
        this.totalIncome = income;
        this.totalExpense = expense;
        
        if (this.selectedTagType) {
          this.chartData = await api.getExpenseByTag(this.selectedTagType, startDate, endDate);
          this.$nextTick(() => this.initPieChart());
        }
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
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
          formatter: '{a} <br/>{b}: ¥{c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          right: '5%',
          top: 'center',
          textStyle: { fontSize: 13 }
        },
        series: [
          {
            name: '消费分析',
            type: 'pie',
            radius: ['45%', '75%'],
            center: ['35%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 8,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              formatter: '{b}\n¥{c}\n{d}%',
              fontSize: 12
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 15,
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: true,
              length: 15,
              length2: 10
            },
            data: this.chartData.map(item => ({
              value: parseFloat(item.amount),
              name: item.name
            }))
          }
        ],
        color: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#00c1de', '#ff6b6b', '#722ed1', '#eb2f96', '#fa8c16']
      };
      
      this.pieChart.setOption(option);
      window.addEventListener('resize', () => this.pieChart.resize());
    },
    
    formatAmount(amount) {
      return '¥' + parseFloat(amount).toFixed(2);
    },
    
    onMonthChange() {
      this.loadData();
    },
    
    onTagTypeChange() {
      this.loadData();
    }
  },
  template: `
    <div class="page-container analysis-page">
      <h1 class="page-title">每月收支分析</h1>
      
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-label">总收入</div>
          <div class="stat-value income">{{ formatAmount(totalIncome) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">总支出</div>
          <div class="stat-value expense">{{ formatAmount(totalExpense) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">结余</div>
          <div class="stat-value" :class="totalIncome - totalExpense >= 0 ? 'income' : 'expense'">
            {{ formatAmount(totalIncome - totalExpense) }}
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">收支分析</h3>
          <div class="controls">
            <el-date-picker
              v-model="selectedMonth"
              type="month"
              placeholder="选择月份"
              size="default"
              format="YYYY-MM"
              value-format="YYYY-MM"
              @change="onMonthChange"
            />
            <el-select 
              v-model="selectedTagType" 
              placeholder="选择分析维度" 
              size="default" 
              style="width: 180px; margin-left: 12px;"
              @change="onTagTypeChange"
            >
              <el-option 
                v-for="type in tagTypes" 
                :key="type.id" 
                :label="type.name" 
                :value="type.id" 
              />
            </el-select>
          </div>
        </div>
        
        <div class="chart-container" v-loading="loading">
          <div ref="pieChart" class="pie-chart"></div>
        </div>
        
        <div class="data-list" v-if="chartData.length > 0">
          <h4 class="list-title">详细数据</h4>
          <el-table :data="chartData" style="width: 100%">
            <el-table-column type="index" label="排名" width="80" align="center" />
            <el-table-column prop="name" label="分类" />
            <el-table-column prop="amount" label="金额" width="150">
              <template #default="{ row }">{{ formatAmount(row.amount) }}</template>
            </el-table-column>
            <el-table-column prop="count" label="笔数" width="100" align="center" />
            <el-table-column label="占比" width="120">
              <template #default="{ row }">
                <div class="progress-item">
                  <el-progress 
                    :percentage="Math.round(row.amount / totalExpense * 100)" 
                    :show-text="false"
                    :stroke-width="8"
                  />
                  <span class="progress-text">{{ Math.round(row.amount / totalExpense * 100) }}%</span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <el-empty v-else description="暂无数据" />
      </div>
    </div>
  `
};

const style = document.createElement('style');
style.textContent = `
  .analysis-page {
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
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    text-align: center;
  }
  
  .stat-label {
    font-size: 14px;
    color: #909399;
    margin-bottom: 12px;
  }
  
  .stat-value {
    font-size: 32px;
    font-weight: 700;
  }
  
  .stat-value.income {
    color: #67c23a;
  }
  
  .stat-value.expense {
    color: #f56c6c;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .controls {
    display: flex;
    align-items: center;
  }
  
  .chart-container {
    min-height: 400px;
  }
  
  .pie-chart {
    width: 100%;
    height: 350px;
  }
  
  .data-list {
    margin-top: 30px;
  }
  
  .list-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 16px;
  }
  
  .progress-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .progress-text {
    font-size: 12px;
    color: #606266;
    min-width: 40px;
  }
  
  @media (max-width: 768px) {
    .stats-row {
      grid-template-columns: 1fr;
    }
    
    .card-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
  }
`;
document.head.appendChild(style);
