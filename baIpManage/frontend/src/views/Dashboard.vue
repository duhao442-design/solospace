<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon icon-total">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total || 0 }}</div>
              <div class="stat-label">IP总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon icon-available">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.available || 0 }}</div>
              <div class="stat-label">可用IP</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon icon-group">
              <el-icon><Folder /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ groupCount }}</div>
              <div class="stat-label">IP分组</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon icon-requester">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ requesterCount }}</div>
              <div class="stat-label">请求方</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>IP地理分布（国家）</span>
            </div>
          </template>
          <div ref="countryChartRef" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>IP地理分布（省份）</span>
            </div>
          </template>
          <div ref="provinceChartRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>近7日请求次数</span>
            </div>
          </template>
          <div ref="requestChartRef" class="chart request-chart"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { getIpStats, getCountryDistribution, getProvinceDistribution } from '@/api/ip'
import { getDailyRequestCount } from '@/api/statistics'
import { getGroupList } from '@/api/group'
import { getRequesterPage } from '@/api/requester'
import * as echarts from 'echarts'

const stats = ref({})
const groupCount = ref(0)
const requesterCount = ref(0)
const countryChartRef = ref(null)
const provinceChartRef = ref(null)
const requestChartRef = ref(null)

let countryChart = null
let provinceChart = null
let requestChart = null

const loadStats = async () => {
  try {
    stats.value = await getIpStats()
  } catch (e) {}
}

const loadGroupCount = async () => {
  try {
    const data = await getGroupList()
    groupCount.value = data.length
  } catch (e) {}
}

const loadRequesterCount = async () => {
  try {
    const data = await getRequesterPage({ current: 1, size: 1 })
    requesterCount.value = data.total || 0
  } catch (e) {}
}

const initCountryChart = async () => {
  try {
    const data = await getCountryDistribution()
    const chartData = data.map(item => ({
      name: item.country || '未知',
      value: item.count
    }))

    await nextTick()
    if (countryChartRef.value) {
      countryChart = echarts.init(countryChartRef.value)
      countryChart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
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
  } catch (e) {}
}

const initProvinceChart = async () => {
  try {
    const data = await getProvinceDistribution()
    const chartData = data.map(item => ({
      name: item.province || '未知',
      value: item.count
    }))

    await nextTick()
    if (provinceChartRef.value) {
      provinceChart = echarts.init(provinceChartRef.value)
      provinceChart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
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
  } catch (e) {}
}

const initRequestChart = async () => {
  try {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 7)
    
    const formatDate = (d) => {
      const pad = (n) => n < 10 ? '0' + n : n
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 00:00:00`
    }

    const data = await getDailyRequestCount(formatDate(start), formatDate(end))
    const dates = []
    const counts = []
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      dates.push(dateStr)
      const item = data.find(x => x.date === dateStr)
      counts.push(item ? item.count : 0)
    }

    await nextTick()
    if (requestChartRef.value) {
      requestChart = echarts.init(requestChartRef.value)
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
          type: 'line',
          smooth: true,
          data: counts,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
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
  } catch (e) {}
}

const handleResize = () => {
  countryChart && countryChart.resize()
  provinceChart && provinceChart.resize()
  requestChart && requestChart.resize()
}

onMounted(() => {
  loadStats()
  loadGroupCount()
  loadRequesterCount()
  initCountryChart()
  initProvinceChart()
  initRequestChart()
  window.addEventListener('resize', handleResize)
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.icon-total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.icon-available {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.icon-group {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.icon-requester {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.chart-row {
  margin-bottom: 20px;
}

.chart {
  height: 300px;
}

.request-chart {
  height: 350px;
}

.card-header {
  font-weight: 600;
}
</style>
