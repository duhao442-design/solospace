import request from '@/utils/request'

export function getIpGroupList() {
  return request({
    url: '/api/ip-group/list',
    method: 'get'
  })
}

export function getIpGroupPage(params) {
  return request({
    url: '/api/ip-group/page',
    method: 'get',
    params
  })
}

export function saveIpGroup(data) {
  return request({
    url: '/api/ip-group',
    method: 'post',
    data
  })
}

export function deleteIpGroup(id) {
  return request({
    url: `/api/ip-group/${id}`,
    method: 'delete'
  })
}

export function batchDeleteIpGroup(ids) {
  return request({
    url: '/api/ip-group/batch',
    method: 'delete',
    data: ids
  })
}
