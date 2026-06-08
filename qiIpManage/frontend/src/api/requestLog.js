import request from '@/utils/request'

export function getRequestLogPage(params) {
  return request({
    url: '/api/request-log/page',
    method: 'get',
    params
  })
}

export function getDailyRequestCount(params) {
  return request({
    url: '/api/request-log/daily-count',
    method: 'get',
    params
  })
}

export function getTopRequesterIps(params) {
  return request({
    url: '/api/request-log/top-requester',
    method: 'get',
    params
  })
}

export function getTopProxyIps(params) {
  return request({
    url: '/api/request-log/top-proxy',
    method: 'get',
    params
  })
}

export function getLocationDistribution(params) {
  return request({
    url: '/api/request-log/location-distribution',
    method: 'get',
    params
  })
}
