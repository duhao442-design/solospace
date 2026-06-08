package com.qi.ipmanage.controller;

import com.qi.ipmanage.common.PageResult;
import com.qi.ipmanage.common.Result;
import com.qi.ipmanage.entity.PendingProxyIp;
import com.qi.ipmanage.service.PendingProxyIpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pending-proxy-ip")
public class PendingProxyIpController {

    @Autowired
    private PendingProxyIpService pendingProxyIpService;

    @GetMapping("/page")
    public Result<PageResult<PendingProxyIp>> page(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String source) {
        return Result.success(pendingProxyIpService.page(pageNum, pageSize, status, source));
    }

    @PostMapping
    public Result<Boolean> add(@RequestBody PendingProxyIp pendingProxyIp) {
        return Result.success(pendingProxyIpService.save(pendingProxyIp));
    }

    @DeleteMapping("/{id}")
    public Result<Boolean> delete(@PathVariable Long id) {
        return Result.success(pendingProxyIpService.removeById(id));
    }

    @DeleteMapping("/batch")
    public Result<Boolean> batchDelete(@RequestBody List<Long> ids) {
        return Result.success(pendingProxyIpService.removeByIds(ids));
    }

    @DeleteMapping("/clear-verified")
    public Result<Boolean> clearVerified() {
        return Result.success(pendingProxyIpService.remove(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<PendingProxyIp>()
                        .in(PendingProxyIp::getStatus, 1, 2)));
    }
}
