import request from '@/utils/request'

export function getDailyRequestCount(startTime, endTime) {
  return request({
    url: '/admin/statistics/dailyRequestCount',
    method: 'get',
    params: { startTime, endTime }
  })
}

export function getRequesterDistribution(startTime, endTime, limit = 20) {
  return request({
    url: '/admin/statistics/requesterDistribution',
    method: 'get',
    params: { startTime, endTime, limit }
  })
}

export function getProxyIpDistribution(startTime, endTime, limit = 20) {
  return request({
    url: '/admin/statistics/proxyIpDistribution',
    method: 'get',
    params: { startTime, endTime, limit }
  })
}
