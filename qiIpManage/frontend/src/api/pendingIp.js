import request from '@/utils/request'

export function getPendingIpPage(params) {
  return request({
    url: '/api/pending-proxy-ip/page',
    method: 'get',
    params
  })
}

export function addPendingIp(data) {
  return request({
    url: '/api/pending-proxy-ip',
    method: 'post',
    data
  })
}

export function deletePendingIp(id) {
  return request({
    url: `/api/pending-proxy-ip/${id}`,
    method: 'delete'
  })
}

export function batchDeletePendingIp(ids) {
  return request({
    url: '/api/pending-proxy-ip/batch',
    method: 'delete',
    data: ids
  })
}

export function clearVerifiedPendingIp() {
  return request({
    url: '/api/pending-proxy-ip/clear-verified',
    method: 'delete'
  })
}
