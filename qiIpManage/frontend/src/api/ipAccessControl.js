import request from '@/utils/request'

export function getIpAccessControlPage(params) {
  return request({
    url: '/api/ip-access-control/page',
    method: 'get',
    params
  })
}

export function getIpAccessControlByProxyIpId(proxyIpId) {
  return request({
    url: `/api/ip-access-control/proxy-ip/${proxyIpId}`,
    method: 'get'
  })
}

export function saveIpAccessControl(data) {
  return request({
    url: '/api/ip-access-control',
    method: 'post',
    data
  })
}

export function deleteIpAccessControl(id) {
  return request({
    url: `/api/ip-access-control/${id}`,
    method: 'delete'
  })
}

export function batchDeleteIpAccessControl(ids) {
  return request({
    url: '/api/ip-access-control/batch',
    method: 'delete',
    data: ids
  })
}

export function updateIpAccessControlStatus(id, status) {
  return request({
    url: `/api/ip-access-control/status/${id}/${status}`,
    method: 'put'
  })
}
