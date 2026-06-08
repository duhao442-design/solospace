<template>
  <div class="statistics">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>数据统计</span>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="loadAllData"
          />
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="24">
          <div class="chart-section">
            <h3>每日请求次数</h3>
            <div ref="requestChartRef" class="chart request-chart"></div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <div class="chart-section">
            <h3>请求来源分布</h3>
            <div ref="requesterChartRef" class="chart"></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-section">
            <h3>IP池请求分布</h3>
            <div ref="proxyChartRef" class="chart"></div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import {
  getDailyRequestCount,
  getRequesterDistribution,
  getProxyIpDistribution
} from '@/api/statistics'
import * as echarts from 'echarts'

const dateRange = ref([])
const requestChartRef = ref(null)
const requesterChartRef = ref(null)
const proxyChartRef = ref(null)

let requestChart = null
let requesterChart = null
let proxyChart = null

const initDateRange = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 6)
  const format = (d) => {
    const pad = (n) => n < 10 ? '0' + n : n
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }
  dateRange.value = [format(start), format(end)]
}

const formatDateTime = (dateStr, isEnd = false) => {
  return isEnd ? `${dateStr} 23:59:59` : `${dateStr} 00:00:00`
}

const loadRequestChart = async () => {
  if (!dateRange.value || dateRange.value.length < 2) return
  try {
    const data = await getDailyRequestCount(
      formatDateTime(dateRange.value[0]),
      formatDateTime(dateRange.value[1], true)
    )

    const dates = []
    const counts = []
    
    const start = new Date(dateRange.value[0])
    const end = new Date(dateRange.value[1])
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      dates.push(dateStr)
      const item = data.find(x => x.date === dateStr)
      counts.push(item ? item.count : 0)
    }

    await nextTick()
    if (requestChartRef.value) {
      if (!requestChart) {
        requestChart = echarts.init(requestChartRef.value)
      }
      requestChart.setOption({
        tooltip: {
          trigger: 'axis'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: dates
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          name: '请求次数',
          type: 'bar',
          data: counts,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#667eea' },
              { offset: 1, color: '#764ba2' }
            ]),
            borderRadius: [4, 4, 0, 0]
          }
        }]
      })
    }
  } catch (e) {
    console.error(e)
  }
}

const loadRequesterChart = async () => {
  if (!dateRange.value || dateRange.value.length < 2) return
  try {
    const data = await getRequesterDistribution(
      formatDateTime(dateRange.value[0]),
      formatDateTime(dateRange.value[1], true),
      10
    )

    const chartData = data.map(item => ({
      name: item.requester_ip || '未知',
      value: item.count
    }))

    await nextTick()
    if (requesterChartRef.value) {
      if (!requesterChart) {
        requesterChart = echarts.init(requesterChartRef.value)
      }
      requesterChart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c}次 ({d}%)'
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
          data: chartData,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 2
          }
        }]
      })
    }
  } catch (e) {
    console.error(e)
  }
}

const loadProxyChart = async () => {
  if (!dateRange.value || dateRange.value.length < 2) return
  try {
    const data = await getProxyIpDistribution(
      formatDateTime(dateRange.value[0]),
      formatDateTime(dateRange.value[1], true),
      10
    )

    const chartData = data.map(item => ({
      name: item.proxy_ip || '未知',
      value: item.count
    }))

    await nextTick()
    if (proxyChartRef.value) {
      if (!proxyChart) {
        proxyChart = echarts.init(proxyChartRef.value)
      }
      proxyChart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c}次 ({d}%)'
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
          data: chartData,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 2
          }
        }]
      })
    }
  } catch (e) {
    console.error(e)
  }
}

const loadAllData = () => {
  loadRequestChart()
  loadRequesterChart()
  loadProxyChart()
}

const handleResize = () => {
  requestChart && requestChart.resize()
  requesterChart && requesterChart.resize()
  proxyChart && proxyChart.resize()
}

onMounted(() => {
  initDateRange()
  loadAllData()
  window.addEventListener('resize', handleResize)
})
</script>

<style scoped>
.statistics {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.chart-section {
  margin-bottom: 30px;
}

.chart-section h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #303133;
}

.chart {
  height: 300px;
}

.request-chart {
  height: 350px;
}
</style>
