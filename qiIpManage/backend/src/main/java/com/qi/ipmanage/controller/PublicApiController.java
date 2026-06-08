package com.qi.ipmanage.controller;

import com.alibaba.fastjson2.JSONObject;
import com.qi.ipmanage.common.RateLimiter;
import com.qi.ipmanage.common.Result;
import com.qi.ipmanage.entity.ProxyIp;
import com.qi.ipmanage.entity.RequesterControl;
import com.qi.ipmanage.entity.RequesterGroupAccess;
import com.qi.ipmanage.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/public-api")
public class PublicApiController {

    @Autowired
    private ProxyIpService proxyIpService;

    @Autowired
    private IpLocationApiService ipLocationApiService;

    @Autowired
    private RequestLogService requestLogService;

    @Autowired
    private RequesterControlService requesterControlService;

    @Autowired
    private RateLimiter rateLimiter;

    @Autowired
    private SysConfigService sysConfigService;

    @Autowired
    private IpGroupService ipGroupService;

    @GetMapping("/proxy/random")
    public Result<ProxyIp> getRandomProxy(HttpServletRequest request) {
        String requesterIp = getClientIp(request);
        int defaultLimit = sysConfigService.getConfigInt("api.rate.limit.default", 10);

        if (!rateLimiter.tryAcquire("public_api_random_" + requesterIp, defaultLimit)) {
            return Result.error(429, "请求过于频繁，请稍后再试");
        }

        RequesterControl control = requesterControlService.getByRequester(1, requesterIp);
        if (control != null && control.getStatus() == 1) {
            if (control.getControlType() == 1) {
                return Result.error(403, "您的IP已被禁止访问");
            }
            if (control.getRateLimit() != null) {
                if (!rateLimiter.tryAcquire("requester_" + requesterIp, control.getRateLimit())) {
                    return Result.error(429, "请求过于频繁，请稍后再试");
                }
            }
        }

        ProxyIp proxyIp = proxyIpService.getRandomOne();
        if (proxyIp == null) {
            return Result.error("暂无可用代理IP");
        }

        requestLogService.addLog(proxyIp.getId(), proxyIp.getIp(), requesterIp, null,
                "/public-api/proxy/random", "GET", 200, null, true, null);

        proxyIpService.incrementUseCount(proxyIp.getId(), true);

        return Result.success(proxyIp);
    }

    @GetMapping("/proxy/batch")
    public Result<List<ProxyIp>> getBatchProxy(
            @RequestParam(defaultValue = "10") Integer count,
            @RequestParam(required = false) String groupCode,
            HttpServletRequest request) {
        String requesterIp = getClientIp(request);
        int defaultLimit = sysConfigService.getConfigInt("api.rate.limit.default", 10);
        int maxBatch = sysConfigService.getConfigInt("ip.max.batch.get", 100);

        if (!rateLimiter.tryAcquire("public_api_batch_" + requesterIp, defaultLimit)) {
            return Result.error(429, "请求过于频繁，请稍后再试");
        }

        if (count > maxBatch) {
            count = maxBatch;
        }

        RequesterControl control = requesterControlService.getByRequester(1, requesterIp);
        if (control != null && control.getStatus() == 1) {
            if (control.getControlType() == 1) {
                return Result.error(403, "您的IP已被禁止访问");
            }
            if (control.getRateLimit() != null) {
                if (!rateLimiter.tryAcquire("requester_" + requesterIp, control.getRateLimit())) {
                    return Result.error(429, "请求过于频繁，请稍后再试");
                }
            }
        }

        List<ProxyIp> proxyIps;

        if (groupCode != null && !groupCode.isEmpty()) {
            com.qi.ipmanage.entity.IpGroup group = ipGroupService.getByCode(groupCode);
            if (group != null) {
                proxyIps = proxyIpService.getRandomIpsByGroup(group.getId(), count);
            } else {
                proxyIps = proxyIpService.getRandomIps(count);
            }
        } else {
            proxyIps = proxyIpService.getRandomIps(count);
        }

        for (ProxyIp proxyIp : proxyIps) {
            proxyIpService.incrementUseCount(proxyIp.getId(), true);
        }

        requestLogService.addLog(null, null, requesterIp, null,
                "/public-api/proxy/batch", "GET", 200, null, true,
                "获取" + proxyIps.size() + "个代理IP");

        return Result.success(proxyIps);
    }

    @GetMapping("/ip/info/{ip}")
    public Result<JSONObject> getIpInfo(@PathVariable String ip, HttpServletRequest request) {
        String requesterIp = getClientIp(request);
        int defaultLimit = sysConfigService.getConfigInt("api.rate.limit.default", 10);

        if (!rateLimiter.tryAcquire("public_api_ipinfo_" + requesterIp, defaultLimit)) {
            return Result.error(429, "请求过于频繁，请稍后再试");
        }

        JSONObject result = ipLocationApiService.getIpLocation(ip);
        if (result == null) {
            return Result.error("获取IP信息失败");
        }

        requestLogService.addLog(null, ip, requesterIp, null,
                "/public-api/ip/info/" + ip, "GET", 200, null, true, null);

        return Result.success(result);
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_CLIENT_IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_X_FORWARDED_FOR");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
