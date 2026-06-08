package com.qi.ipmanage.controller;

import com.qi.ipmanage.common.PageResult;
import com.qi.ipmanage.common.Result;
import com.qi.ipmanage.entity.ProxyIp;
import com.qi.ipmanage.service.ProxyIpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/proxy-ip")
public class ProxyIpController {

    @Autowired
    private ProxyIpService proxyIpService;

    @GetMapping("/page")
    public Result<PageResult<ProxyIp>> page(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String supplier,
            @RequestParam(required = false) String protocol) {
        return Result.success(proxyIpService.page(pageNum, pageSize, keyword, status, supplier, protocol));
    }

    @GetMapping("/{id}")
    public Result<ProxyIp> getById(@PathVariable Long id) {
        return Result.success(proxyIpService.getById(id));
    }

    @PostMapping
    public Result<Boolean> save(@RequestBody ProxyIp proxyIp) {
        return Result.success(proxyIpService.saveOrUpdate(proxyIp));
    }

    @PostMapping("/save-with-groups")
    public Result<Boolean> saveWithGroups(@RequestBody java.util.Map<String, Object> params) {
        ProxyIp proxyIp = com.alibaba.fastjson2.JSONObject.parseObject(
                com.alibaba.fastjson2.JSONObject.toJSONString(params.get("proxyIp")), ProxyIp.class);
        @SuppressWarnings("unchecked")
        List<Long> groupIds = (List<Long>) params.get("groupIds");
        return Result.success(proxyIpService.saveWithGroups(proxyIp, groupIds));
    }

    @DeleteMapping("/{id}")
    public Result<Boolean> delete(@PathVariable Long id) {
        return Result.success(proxyIpService.removeById(id));
    }

    @DeleteMapping("/batch")
    public Result<Boolean> batchDelete(@RequestBody List<Long> ids) {
        return Result.success(proxyIpService.removeByIds(ids));
    }

    @PutMapping("/status/{id}/{status}")
    public Result<Boolean> updateStatus(@PathVariable Long id, @PathVariable Integer status) {
        proxyIpService.updateStatus(id, status);
        return Result.success(true);
    }

    @PutMapping("/batch-status")
    public Result<Boolean> batchUpdateStatus(@RequestBody java.util.Map<String, Object> params) {
        @SuppressWarnings("unchecked")
        List<Long> ids = (List<Long>) params.get("ids");
        Integer status = (Integer) params.get("status");
        proxyIpService.batchUpdateStatus(ids, status);
        return Result.success(true);
    }

    @PostMapping("/batch-add-group")
    public Result<Boolean> batchAddToGroup(@RequestBody java.util.Map<String, Object> params) {
        @SuppressWarnings("unchecked")
        List<Long> proxyIpIds = (List<Long>) params.get("proxyIpIds");
        @SuppressWarnings("unchecked")
        List<Long> groupIds = (List<Long>) params.get("groupIds");
        proxyIpService.batchAddToGroup(proxyIpIds, groupIds);
        return Result.success(true);
    }

    @GetMapping("/groups/{id}")
    public Result<List<Long>> getGroupIds(@PathVariable Long id) {
        return Result.success(proxyIpService.getGroupIdsByProxyIpId(id));
    }
}
