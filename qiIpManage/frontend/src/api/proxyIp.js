import request from '@/utils/request'

export function getProxyIpPage(params) {
  return request({
    url: '/api/proxy-ip/page',
    method: 'get',
    params
  })
}

export function getProxyIpById(id) {
  return request({
    url: `/api/proxy-ip/${id}`,
    method: 'get'
  })
}

export function saveProxyIp(data) {
  return request({
    url: '/api/proxy-ip',
    method: 'post',
    data
  })
}

export function saveProxyIpWithGroups(data) {
  return request({
    url: '/api/proxy-ip/save-with-groups',
    method: 'post',
    data
  })
}

export function deleteProxyIp(id) {
  return request({
    url: `/api/proxy-ip/${id}`,
    method: 'delete'
  })
}

export function batchDeleteProxyIp(ids) {
  return request({
    url: '/api/proxy-ip/batch',
    method: 'delete',
    data: ids
  })
}

export function updateProxyIpStatus(id, status) {
  return request({
    url: `/api/proxy-ip/status/${id}/${status}`,
    method: 'put'
  })
}

export function batchUpdateProxyIpStatus(ids, status) {
  return request({
    url: '/api/proxy-ip/batch-status',
    method: 'put',
    data: { ids, status }
  })
}

export function batchAddToGroup(proxyIpIds, groupIds) {
  return request({
    url: '/api/proxy-ip/batch-add-group',
    method: 'post',
    data: { proxyIpIds, groupIds }
  })
}

export function getProxyIpGroups(id) {
  return request({
    url: `/api/proxy-ip/groups/${id}`,
    method: 'get'
  })
}
