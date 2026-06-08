package com.ba.ipmanage.service;

import com.ba.ipmanage.entity.RequestLog;
import com.ba.ipmanage.mapper.RequestLogMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class RequestLogService {

    @Autowired
    private RequestLogMapper requestLogMapper;

    public void logRequest(String requesterIp, String requesterDomain, Long proxyIpId, String proxyIp, String apiType, boolean success) {
        RequestLog log = new RequestLog();
        log.setRequesterIp(requesterIp);
        log.setRequesterDomain(requesterDomain);
        log.setProxyIpId(proxyIpId);
        log.setProxyIp(proxyIp);
        log.setApiType(apiType);
        log.setRequestTime(LocalDateTime.now());
        log.setResponseStatus(success ? 1 : 0);
        requestLogMapper.insert(log);
    }

    public List<Map<String, Object>> getDailyRequestCount(LocalDateTime startTime, LocalDateTime endTime) {
        return requestLogMapper.selectDailyRequestCount(startTime, endTime);
    }

    public List<Map<String, Object>> getRequesterDistribution(LocalDateTime startTime, LocalDateTime endTime, int limit) {
        return requestLogMapper.selectRequesterDistribution(startTime, endTime, limit);
    }

    public List<Map<String, Object>> getProxyIpDistribution(LocalDateTime startTime, LocalDateTime endTime, int limit) {
        return requestLogMapper.selectProxyIpDistribution(startTime, endTime, limit);
    }
}
