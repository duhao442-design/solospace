<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-value" style="color: #409EFF">{{ stats.totalIp }}</div>
          <div class="stat-label">IP总数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-value" style="color: #67C23A">{{ stats.availableIp }}</div>
          <div class="stat-label">可用IP</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-value" style="color: #E6A23C">{{ stats.pendingIp }}</div>
          <div class="stat-label">待验证IP</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-value" style="color: #F56C6C">{{ stats.todayRequest }}</div>
          <div class="stat-label">今日请求</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="14">
        <div class="chart-card">
          <div class="chart-title">近7日请求趋势</div>
          <div ref="lineChart" style="height: 300px;"></div>
        </div>
      </el-col>
      <el-col :span="10">
        <div class="chart-card">
          <div class="chart-title">IP地理位置分布</div>
          <div ref="pieChart" style="height: 300px;"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-title">请求来源TOP10</div>
          <div ref="barChart1" style="height: 300px;"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-title">使用最多代理IP TOP10</div>
          <div ref="barChart2" style="height: 300px;"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getDailyRequestCount, getLocationDistribution, getTopRequesterIps, getTopProxyIps } from '@/api/requestLog'

const stats = ref({
  totalIp: 0,
  availableIp: 0,
  pendingIp: 0,
  todayRequest: 0
})

const lineChart = ref(null)
const pieChart = ref(null)
const barChart1 = ref(null)
const barChart2 = ref(null)

let lineChartInstance = null
let pieChartInstance = null
let barChart1Instance = null
let barChart2Instance = null

onMounted(async () => {
  await loadData()
  await nextTick()
  initCharts()
})

async function loadData() {
  try {
    const dailyData = await getDailyRequestCount({})
    if (dailyData && dailyData.length > 0) {
      const today = dailyData[dailyData.length - 1]
      stats.value.todayRequest = today.count || 0
    }
  } catch (e) {}
}

function initCharts() {
  initLineChart()
  initPieChart()
  initBarChart1()
  initBarChart2()
}

async function initLineChart() {
  lineChartInstance = echarts.init(lineChart.value)
  const data = await getDailyRequestCount({})
  const dates = data.map(item => item.date)
  const counts = data.map(item => item.count)

  lineChartInstance.setOption({
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: counts,
      type: 'line',
      smooth: true,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
        ])
      },
      lineStyle: {
        color: '#409EFF',
        width: 2
      },
      itemStyle: {
        color: '#409EFF'
      }
    }]
  })
}

async function initPieChart() {
  pieChartInstance = echarts.init(pieChart.value)
  const data = await getLocationDistribution({ limit: 10 })
  const pieData = data.map(item => ({
    name: item.location || '未知',
    value: item.count
  }))

  pieChartInstance.setOption({
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 6,
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
      data: pieData
    }]
  })
}

async function initBarChart1() {
  barChart1Instance = echarts.init(barChart1.value)
  const data = await getTopRequesterIps({ limit: 10 })
  const ips = data.map(item => item.requester || '未知')
  const counts = data.map(item => item.count)

  barChart1Instance.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: ips.reverse()
    },
    series: [{
      type: 'bar',
      data: counts.reverse(),
      itemStyle: {
        color: '#67C23A'
      }
    }]
  })
}

async function initBarChart2() {
  barChart2Instance = echarts.init(barChart2.value)
  const data = await getTopProxyIps({ limit: 10 })
  const ips = data.map(item => item.proxy_ip || '未知')
  const counts = data.map(item => item.count)

  barChart2Instance.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: ips.reverse()
    },
    series: [{
      type: 'bar',
      data: counts.reverse(),
      itemStyle: {
        color: '#E6A23C'
      }
    }]
  })
}
</script>

<style lang="scss" scoped>
.dashboard {
  .stat-row {
    margin-bottom: 20px;
  }
}
</style>
