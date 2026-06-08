package com.qi.ipmanage.controller;

import com.qi.ipmanage.common.PageResult;
import com.qi.ipmanage.common.Result;
import com.qi.ipmanage.entity.RequestLog;
import com.qi.ipmanage.service.RequestLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/request-log")
public class RequestLogController {

    @Autowired
    private RequestLogService requestLogService;

    @GetMapping("/page")
    public Result<PageResult<RequestLog>> page(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) String proxyIp,
            @RequestParam(required = false) String requesterIp,
            @RequestParam(required = false) Integer success) {
        return Result.success(requestLogService.page(pageNum, pageSize, proxyIp, requesterIp, success));
    }

    @GetMapping("/daily-count")
    public Result<List<Map<String, Object>>> dailyCount(
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime) {
        LocalDateTime start = startTime != null ? LocalDateTime.parse(startTime) : LocalDateTime.now().minusDays(7);
        LocalDateTime end = endTime != null ? LocalDateTime.parse(endTime) : LocalDateTime.now();
        return Result.success(requestLogService.getDailyRequestCount(start, end));
    }

    @GetMapping("/top-requester")
    public Result<List<Map<String, Object>>> topRequester(
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime,
            @RequestParam(defaultValue = "10") Integer limit) {
        LocalDateTime start = startTime != null ? LocalDateTime.parse(startTime) : LocalDateTime.now().minusDays(7);
        LocalDateTime end = endTime != null ? LocalDateTime.parse(endTime) : LocalDateTime.now();
        return Result.success(requestLogService.getTopRequesterIps(start, end, limit));
    }

    @GetMapping("/top-proxy")
    public Result<List<Map<String, Object>>> topProxy(
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime,
            @RequestParam(defaultValue = "10") Integer limit) {
        LocalDateTime start = startTime != null ? LocalDateTime.parse(startTime) : LocalDateTime.now().minusDays(7);
        LocalDateTime end = endTime != null ? LocalDateTime.parse(endTime) : LocalDateTime.now();
        return Result.success(requestLogService.getTopProxyIps(start, end, limit));
    }

    @GetMapping("/location-distribution")
    public Result<List<Map<String, Object>>> locationDistribution(
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime,
            @RequestParam(defaultValue = "10") Integer limit) {
        LocalDateTime start = startTime != null ? LocalDateTime.parse(startTime) : LocalDateTime.now().minusDays(7);
        LocalDateTime end = endTime != null ? LocalDateTime.parse(endTime) : LocalDateTime.now();
        return Result.success(requestLogService.getLocationDistribution(start, end, limit));
    }
}
