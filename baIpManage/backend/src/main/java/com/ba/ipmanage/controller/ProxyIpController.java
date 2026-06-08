package com.ba.ipmanage.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ba.ipmanage.common.Result;
import com.ba.ipmanage.entity.ProxyIp;
import com.ba.ipmanage.service.IpCheckService;
import com.ba.ipmanage.service.IpGroupService;
import com.ba.ipmanage.service.ProxyIpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/ip")
@CrossOrigin
public class ProxyIpController {

    @Autowired
    private ProxyIpService proxyIpService;

    @Autowired
    private IpCheckService ipCheckService;

    @Autowired
    private IpGroupService ipGroupService;

    @GetMapping("/page")
    public Result<Page<ProxyIp>> page(@RequestParam(defaultValue = "1") int current,
                                       @RequestParam(defaultValue = "20") int size,
                                       @RequestParam(required = false) String keyword,
                                       @RequestParam(required = false) Integer status,
                                       @RequestParam(required = false) String protocol) {
        return Result.success(proxyIpService.page(current, size, keyword, status, protocol));
    }

    @GetMapping("/{id}")
    public Result<ProxyIp> getById(@PathVariable Long id) {
        return Result.success(proxyIpService.getById(id));
    }

    @PostMapping
    public Result<?> save(@RequestBody ProxyIp proxyIp) {
        boolean success = proxyIpService.save(proxyIp);
        return success ? Result.success() : Result.error("保存失败");
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        ipGroupService.removeIpFromAllGroups(id);
        boolean success = proxyIpService.deleteById(id);
        return success ? Result.success() : Result.error("删除失败");
    }

    @PostMapping("/check/{id}")
    public Result<Boolean> check(@PathVariable Long id) {
        ProxyIp ip = proxyIpService.getById(id);
        if (ip == null) {
            return Result.error("IP不存在");
        }
        boolean available = ipCheckService.checkProxyIp(ip);
        return Result.success(available);
    }

    @PostMapping("/checkAll")
    public Result<?> checkAll() {
        new Thread(() -> ipCheckService.checkAllIps()).start();
        return Result.success("已开始批量检查");
    }

    @GetMapping("/distribution/country")
    public Result<List<Map<String, Object>>> getCountryDistribution() {
        return Result.success(proxyIpService.getCountryDistribution());
    }

    @GetMapping("/distribution/province")
    public Result<List<Map<String, Object>>> getProvinceDistribution() {
        return Result.success(proxyIpService.getProvinceDistribution());
    }

    @GetMapping("/stats")
    public Result<Map<String, Object>> getStats() {
        Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("total", proxyIpService.countTotal());
        stats.put("available", proxyIpService.countAvailable());
        return Result.success(stats);
    }

    @PostMapping("/batchDelete")
    public Result<?> batchDelete(@RequestBody List<Long> ids) {
        for (Long id : ids) {
            ipGroupService.removeIpFromAllGroups(id);
            proxyIpService.deleteById(id);
        }
        return Result.success();
    }
}
