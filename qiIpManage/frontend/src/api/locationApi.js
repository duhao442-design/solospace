import request from '@/utils/request'

export function getLocationApiList() {
  return request({
    url: '/api/ip-location-api/list',
    method: 'get'
  })
}

export function getLocationApiPage(params) {
  return request({
    url: '/api/ip-location-api/page',
    method: 'get',
    params
  })
}

export function saveLocationApi(data) {
  return request({
    url: '/api/ip-location-api',
    method: 'post',
    data
  })
}

export function deleteLocationApi(id) {
  return request({
    url: `/api/ip-location-api/${id}`,
    method: 'delete'
  })
}

export function updateLocationApiStatus(id, status) {
  return request({
    url: `/api/ip-location-api/status/${id}/${status}`,
    method: 'put'
  })
}

export function testLocationApi(ip) {
  return request({
    url: `/api/ip-location-api/test/${ip}`,
    method: 'get'
  })
}
