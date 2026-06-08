import request from '@/utils/request'

export function getGroupList() {
  return request({
    url: '/admin/group/list',
    method: 'get'
  })
}

export function getGroupPage(params) {
  return request({
    url: '/admin/group/page',
    method: 'get',
    params
  })
}

export function saveGroup(data) {
  return request({
    url: '/admin/group',
    method: 'post',
    data
  })
}

export function deleteGroup(id) {
  return request({
    url: '/admin/group/' + id,
    method: 'delete'
  })
}

export function addIpToGroup(groupId, ipId) {
  return request({
    url: `/admin/group/${groupId}/addIp/${ipId}`,
    method: 'post'
  })
}

export function batchAddIpToGroup(groupId, ipIds) {
  return request({
    url: `/admin/group/${groupId}/batchAdd`,
    method: 'post',
    data: ipIds
  })
}

export function removeIpFromGroup(groupId, ipId) {
  return request({
    url: `/admin/group/${groupId}/removeIp/${ipId}`,
    method: 'delete'
  })
}

export function getIpsByGroup(groupId) {
  return request({
    url: `/admin/group/${groupId}/ips`,
    method: 'get'
  })
}
