package com.ba.ipmanage.controller;

import com.ba.ipmanage.common.Result;
import com.ba.ipmanage.entity.*;
import com.ba.ipmanage.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/public")
@CrossOrigin
public class PublicApiController {

    @Autowired
    private ProxyIpService proxyIpService;

    @Autowired
    private RateLimitService rateLimitService;

    @Autowired
    private RequesterService requesterService;

    @Autowired
    private IpGroupService ipGroupService;

    @Autowired
    private RequestLogService requestLogService;

    @Autowired
    private IpLocationService ipLocationService;

    @Autowired
    private SystemConfigService systemConfigService;

    @GetMapping("/ip/batch")
    public Result<?> getBatchIps(@RequestParam(defaultValue = "10") int count,
                                  @RequestParam(required = false) String protocol,
                                  @RequestParam(required = false) Long groupId,
                                  HttpServletRequest request) {
        String requesterIp = getClientIp(request);

        if (!rateLimitService.tryAcquireGlobal()) {
            return Result.error(429, "请求过于频繁，请稍后再试");
        }

        if (!rateLimitService.tryAcquire("batch:" + requesterIp, 10)) {
            return Result.error(429, "请求过于频繁，请稍后再试");
        }

        Requester requester = requesterService.getByKey(requesterIp);
        if (requester != null) {
            if (requester.getStatus() == 0) {
                return Result.error(403, "请求方已被禁用");
            }
            if (requester.getRateLimit() != null && requester.getRateLimit() > 0) {
                if (!rateLimitService.tryAcquire("requester:" + requester.getId(), requester.getRateLimit())) {
                    return Result.error(429, "请求过于频繁，请稍后再试");
                }
            }
            if (requester.getRateLimitDay() != null && requester.getRateLimitDay() > 0) {
                if (!rateLimitService.tryAcquireDaily("requester:day:" + requester.getId(), requester.getRateLimitDay())) {
                    return Result.error(429, "今日请求次数已达上限");
                }
            }
        }

        int maxCount = systemConfigService.getConfigInt("batch.max.count", 100);
        if (count > maxCount) {
            count = maxCount;
        }
        if (count < 1) {
            count = 1;
        }

        List<ProxyIp> ipList;
        if (groupId != null) {
            if (requester != null) {
                if (!isGroupAllowed(requester.getId(), groupId)) {
                    return Result.error(403, "无权访问该IP池");
                }
            }
            ipList = proxyIpService.getRandomByGroup(groupId, count);
        } else {
            ipList = getAccessibleIps(requester, count, protocol);
        }

        for (ProxyIp ip : ipList) {
            proxyIpService.incrementUseCount(ip.getId());
            requestLogService.logRequest(requesterIp, null, ip.getId(), ip.getIp(), "batch", true);
        }

        List<Map<String, Object>> result = ipList.stream().map(ip -> {
            Map<String, Object> map = new HashMap<>();
            map.put("ip", ip.getIp());
            map.put("port", ip.getPort());
            map.put("protocol", ip.getProtocol());
            map.put("location", ip.getLocation());
            map.put("responseTime", ip.getResponseTime());
            return map;
        }).collect(Collectors.toList());

        return Result.success(result);
    }

    @GetMapping("/ip/random")
    public Result<?> getRandomIp(@RequestParam(required = false) String protocol,
                                  @RequestParam(required = false) Long groupId,
                                  HttpServletRequest request) {
        String requesterIp = getClientIp(request);

        if (!rateLimitService.tryAcquireGlobal()) {
            return Result.error(429, "请求过于频繁，请稍后再试");
        }

        Requester requester = requesterService.getByKey(requesterIp);
        if (requester != null) {
            if (requester.getStatus() == 0) {
                return Result.error(403, "请求方已被禁用");
            }
            if (requester.getRateLimit() != null && requester.getRateLimit() > 0) {
                if (!rateLimitService.tryAcquire("requester:" + requester.getId(), requester.getRateLimit())) {
                    return Result.error(429, "请求过于频繁，请稍后再试");
                }
            }
        }

        List<ProxyIp> ipList;
        if (groupId != null) {
            if (requester != null) {
                if (!isGroupAllowed(requester.getId(), groupId)) {
                    return Result.error(403, "无权访问该IP池");
                }
            }
            ipList = proxyIpService.getRandomByGroup(groupId, 1);
        } else {
            ipList = getAccessibleIps(requester, 1, protocol);
        }

        if (ipList.isEmpty()) {
            requestLogService.logRequest(requesterIp, null, null, null, "single", false);
            return Result.error("暂无可用代理IP");
        }

        ProxyIp ip = ipList.get(0);
        proxyIpService.incrementUseCount(ip.getId());
        requestLogService.logRequest(requesterIp, null, ip.getId(), ip.getIp(), "single", true);

        Map<String, Object> result = new HashMap<>();
        result.put("ip", ip.getIp());
        result.put("port", ip.getPort());
        result.put("protocol", ip.getProtocol());
        result.put("location", ip.getLocation());
        result.put("responseTime", ip.getResponseTime());

        return Result.success(result);
    }

    @GetMapping("/ip/detail/{ip}")
    public Result<?> getIpDetail(@PathVariable String ip, HttpServletRequest request) {
        String requesterIp = getClientIp(request);

        if (!rateLimitService.tryAcquireGlobal()) {
            return Result.error(429, "请求过于频繁，请稍后再试");
        }

        if (!rateLimitService.tryAcquire("detail:" + requesterIp, 5)) {
            return Result.error(429, "请求过于频繁，请稍后再试");
        }

        Map<String, String> location = ipLocationService.getIpLocation(ip);

        requestLogService.logRequest(requesterIp, null, null, ip, "detail", location != null);

        Map<String, Object> result = new HashMap<>();
        result.put("ip", ip);
        if (location != null) {
            result.putAll(location);
        }

        return Result.success(result);
    }

    private boolean isGroupAllowed(Long requesterId, Long groupId) {
        List<PoolControl> allowList = requesterService.getPoolControls(requesterId, 1);
        List<PoolControl> denyList = requesterService.getPoolControls(requesterId, 2);

        if (!allowList.isEmpty()) {
            return allowList.stream().anyMatch(pc -> pc.getGroupId().equals(groupId));
        }

        if (!denyList.isEmpty()) {
            return denyList.stream().noneMatch(pc -> pc.getGroupId().equals(groupId));
        }

        return true;
    }

    private List<ProxyIp> getAccessibleIps(Requester requester, int count, String protocol) {
        if (requester == null) {
            return proxyIpService.getRandomAvailable(count);
        }

        List<PoolControl> allowList = requesterService.getPoolControls(requester.getId(), 1);
        List<PoolControl> denyList = requesterService.getPoolControls(requester.getId(), 2);

        Set<Long> allowedGroupIds = new HashSet<>();

        if (!allowList.isEmpty()) {
            for (PoolControl pc : allowList) {
                allowedGroupIds.add(pc.getGroupId());
            }
        } else if (!denyList.isEmpty()) {
            Set<Long> deniedGroupIds = new HashSet<>();
            for (PoolControl pc : denyList) {
                deniedGroupIds.add(pc.getGroupId());
            }
            List<IpGroup> allGroups = ipGroupService.list();
            for (IpGroup group : allGroups) {
                if (!deniedGroupIds.contains(group.getId())) {
                    allowedGroupIds.add(group.getId());
                }
            }
        } else {
            return proxyIpService.getRandomAvailable(count);
        }

        Set<Long> ipIds = new HashSet<>();
        for (Long groupId : allowedGroupIds) {
            List<Long> groupIpIds = ipGroupService.getIpIdsByGroupId(groupId);
            ipIds.addAll(groupIpIds);
        }

        List<ProxyIp> allIps = new ArrayList<>();
        List<Long> ipIdList = new ArrayList<>(ipIds);
        Collections.shuffle(ipIdList);
        int takeCount = Math.min(count, ipIdList.size());
        for (int i = 0; i < takeCount; i++) {
            ProxyIp ip = proxyIpService.getById(ipIdList.get(i));
            if (ip != null && ip.getStatus() == 1) {
                if (protocol == null || protocol.isEmpty() || protocol.equalsIgnoreCase(ip.getProtocol())) {
                    allIps.add(ip);
                }
            }
        }

        return allIps;
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
