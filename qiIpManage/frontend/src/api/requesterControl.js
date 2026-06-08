import request from '@/utils/request'

export function getRequesterControlPage(params) {
  return request({
    url: '/api/requester-control/page',
    method: 'get',
    params
  })
}

export function getRequesterControlById(id) {
  return request({
    url: `/api/requester-control/${id}`,
    method: 'get'
  })
}

export function getRequesterGroupAccess(id) {
  return request({
    url: `/api/requester-control/${id}/group-access`,
    method: 'get'
  })
}

export function saveRequesterControl(data) {
  return request({
    url: '/api/requester-control',
    method: 'post',
    data
  })
}

export function saveRequesterWithAccess(data) {
  return request({
    url: '/api/requester-control/save-with-access',
    method: 'post',
    data
  })
}

export function deleteRequesterControl(id) {
  return request({
    url: `/api/requester-control/${id}`,
    method: 'delete'
  })
}

export function batchDeleteRequesterControl(ids) {
  return request({
    url: '/api/requester-control/batch',
    method: 'delete',
    data: ids
  })
}

export function updateRequesterStatus(id, status) {
  return request({
    url: `/api/requester-control/status/${id}/${status}`,
    method: 'put'
  })
}
