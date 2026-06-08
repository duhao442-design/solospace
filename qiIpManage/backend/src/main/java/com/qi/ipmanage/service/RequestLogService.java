package com.qi.ipmanage.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.qi.ipmanage.common.PageResult;
import com.qi.ipmanage.entity.RequestLog;
import com.qi.ipmanage.mapper.RequestLogMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class RequestLogService extends ServiceImpl<RequestLogMapper, RequestLog> {

    public PageResult<RequestLog> page(Integer pageNum, Integer pageSize, String proxyIp, String requesterIp, Integer success) {
        LambdaQueryWrapper<RequestLog> wrapper = new LambdaQueryWrapper<>();
        if (proxyIp != null && !proxyIp.isEmpty()) {
            wrapper.like(RequestLog::getProxyIp, proxyIp);
        }
        if (requesterIp != null && !requesterIp.isEmpty()) {
            wrapper.like(RequestLog::getRequesterIp, requesterIp);
        }
        if (success != null) {
            wrapper.eq(RequestLog::getSuccess, success);
        }
        wrapper.orderByDesc(RequestLog::getCreateTime);
        IPage<RequestLog> page = this.page(new Page<>(pageNum, pageSize), wrapper);
        return PageResult.of(page);
    }

    public List<Map<String, Object>> getDailyRequestCount(LocalDateTime startTime, LocalDateTime endTime) {
        return baseMapper.selectDailyRequestCount(startTime, endTime);
    }

    public List<Map<String, Object>> getTopRequesterIps(LocalDateTime startTime, LocalDateTime endTime, Integer limit) {
        return baseMapper.selectTopRequesterIps(startTime, endTime, limit);
    }

    public List<Map<String, Object>> getTopProxyIps(LocalDateTime startTime, LocalDateTime endTime, Integer limit) {
        return baseMapper.selectTopProxyIps(startTime, endTime, limit);
    }

    public List<Map<String, Object>> getLocationDistribution(LocalDateTime startTime, LocalDateTime endTime, Integer limit) {
        return baseMapper.selectLocationDistribution(startTime, endTime, limit);
    }

    public void addLog(Long proxyIpId, String proxyIp, String requesterIp, String requesterDomain,
                       String requestPath, String requestMethod, Integer responseStatus,
                       Integer responseTime, boolean success, String errorMsg) {
        RequestLog log = new RequestLog();
        log.setProxyIpId(proxyIpId);
        log.setProxyIp(proxyIp);
        log.setRequesterIp(requesterIp);
        log.setRequesterDomain(requesterDomain);
        log.setRequestPath(requestPath);
        log.setRequestMethod(requestMethod);
        log.setResponseStatus(responseStatus);
        log.setResponseTime(responseTime);
        log.setSuccess(success ? 1 : 0);
        log.setErrorMsg(errorMsg);
        log.setCreateTime(LocalDateTime.now());
        this.save(log);
    }
}
