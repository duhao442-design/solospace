import request from '@/utils/request'

export function getAllSysConfig() {
  return request({
    url: '/api/sys-config/all',
    method: 'get'
  })
}

export function getSysConfigByKey(key) {
  return request({
    url: `/api/sys-config/${key}`,
    method: 'get'
  })
}

export function updateSysConfig(key, value) {
  return request({
    url: '/api/sys-config',
    method: 'post',
    data: { key, value }
  })
}

export function batchUpdateSysConfig(configs) {
  return request({
    url: '/api/sys-config/batch',
    method: 'post',
    data: configs
  })
}
