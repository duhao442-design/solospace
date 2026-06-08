import request from '@/utils/request'

export function getLocationApiList() {
  return request({
    url: '/admin/locationApi/list',
    method: 'get'
  })
}

export function saveLocationApi(data) {
  return request({
    url: '/admin/locationApi',
    method: 'post',
    data
  })
}

export function deleteLocationApi(id) {
  return request({
    url: '/admin/locationApi/' + id,
    method: 'delete'
  })
}

export function testLocationApi(ip) {
  return request({
    url: '/admin/locationApi/test/' + ip,
    method: 'get'
  })
}

export function getCrawlSourceList() {
  return request({
    url: '/admin/crawlSource/list',
    method: 'get'
  })
}

export function saveCrawlSource(data) {
  return request({
    url: '/admin/crawlSource',
    method: 'post',
    data
  })
}

export function deleteCrawlSource(id) {
  return request({
    url: '/admin/crawlSource/' + id,
    method: 'delete'
  })
}

export function runCrawlNow() {
  return request({
    url: '/admin/crawlSource/runNow',
    method: 'post'
  })
}

export function getConfigList() {
  return request({
    url: '/admin/config/list',
    method: 'get'
  })
}

export function updateConfig(data) {
  return request({
    url: '/admin/config',
    method: 'post',
    data
  })
}

export function getConfigByKey(key) {
  return request({
    url: '/admin/config/' + key,
    method: 'get'
  })
}
