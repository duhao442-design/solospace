import request from '@/utils/request'

export function getCrawlerSourcePage(params) {
  return request({
    url: '/api/crawler-source/page',
    method: 'get',
    params
  })
}

export function saveCrawlerSource(data) {
  return request({
    url: '/api/crawler-source',
    method: 'post',
    data
  })
}

export function deleteCrawlerSource(id) {
  return request({
    url: `/api/crawler-source/${id}`,
    method: 'delete'
  })
}

export function updateCrawlerSourceStatus(id, status) {
  return request({
    url: `/api/crawler-source/status/${id}/${status}`,
    method: 'put'
  })
}

export function crawlFromSource(id) {
  return request({
    url: `/api/crawler-source/crawl/${id}`,
    method: 'post'
  })
}
