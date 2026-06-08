package com.ba.ipmanage.controller;

import com.ba.ipmanage.common.Result;
import com.ba.ipmanage.service.RequestLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/statistics")
@CrossOrigin
public class StatisticsController {

    @Autowired
    private RequestLogService requestLogService;

    @GetMapping("/dailyRequestCount")
    public Result<List<Map<String, Object>>> getDailyRequestCount(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime startTime,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime endTime) {
        return Result.success(requestLogService.getDailyRequestCount(startTime, endTime));
    }

    @GetMapping("/requesterDistribution")
    public Result<List<Map<String, Object>>> getRequesterDistribution(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime startTime,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime endTime,
            @RequestParam(defaultValue = "20") Integer limit) {
        return Result.success(requestLogService.getRequesterDistribution(startTime, endTime, limit));
    }

    @GetMapping("/proxyIpDistribution")
    public Result<List<Map<String, Object>>> getProxyIpDistribution(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime startTime,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime endTime,
            @RequestParam(defaultValue = "20") Integer limit) {
        return Result.success(requestLogService.getProxyIpDistribution(startTime, endTime, limit));
    }
}
