import request from '@/utils/request'

export function getRequesterPage(params) {
  return request({
    url: '/admin/requester/page',
    method: 'get',
    params
  })
}

export function getRequesterById(id) {
  return request({
    url: '/admin/requester/' + id,
    method: 'get'
  })
}

export function saveRequester(data) {
  return request({
    url: '/admin/requester',
    method: 'post',
    data
  })
}

export function deleteRequester(id) {
  return request({
    url: '/admin/requester/' + id,
    method: 'delete'
  })
}

export function getRequesterControls(requesterId, controlType) {
  return request({
    url: `/admin/requester/${requesterId}/controls`,
    method: 'get',
    params: { controlType }
  })
}

export function addRequesterControl(data) {
  return request({
    url: '/admin/requester/control',
    method: 'post',
    data
  })
}

export function deleteRequesterControl(id) {
  return request({
    url: '/admin/requester/control/' + id,
    method: 'delete'
  })
}

export function getPoolControls(requesterId, controlType) {
  return request({
    url: `/admin/requester/${requesterId}/poolControls`,
    method: 'get',
    params: { controlType }
  })
}

export function addPoolControl(data) {
  return request({
    url: '/admin/requester/poolControl',
    method: 'post',
    data
  })
}

export function deletePoolControl(id) {
  return request({
    url: '/admin/requester/poolControl/' + id,
    method: 'delete'
  })
}
