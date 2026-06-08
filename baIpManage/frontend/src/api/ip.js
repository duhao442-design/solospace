import request from '@/utils/request'

export function getIpPage(params) {
  return request({
    url: '/admin/ip/page',
    method: 'get',
    params
  })
}

export function getIpById(id) {
  return request({
    url: '/admin/ip/' + id,
    method: 'get'
  })
}

export function saveIp(data) {
  return request({
    url: '/admin/ip',
    method: 'post',
    data
  })
}

export function deleteIp(id) {
  return request({
    url: '/admin/ip/' + id,
    method: 'delete'
  })
}

export function batchDeleteIp(ids) {
  return request({
    url: '/admin/ip/batchDelete',
    method: 'post',
    data: ids
  })
}

export function checkIp(id) {
  return request({
    url: '/admin/ip/check/' + id,
    method: 'post'
  })
}

export function checkAllIps() {
  return request({
    url: '/admin/ip/checkAll',
    method: 'post'
  })
}

export function getCountryDistribution() {
  return request({
    url: '/admin/ip/distribution/country',
    method: 'get'
  })
}

export function getProvinceDistribution() {
  return request({
    url: '/admin/ip/distribution/province',
    method: 'get'
  })
}

export function getIpStats() {
  return request({
    url: '/admin/ip/stats',
    method: 'get'
  })
}
