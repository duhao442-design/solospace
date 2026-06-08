package com.ba.ipmanage.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ba.ipmanage.common.Result;
import com.ba.ipmanage.entity.IpGroup;
import com.ba.ipmanage.entity.ProxyIp;
import com.ba.ipmanage.service.IpGroupService;
import com.ba.ipmanage.service.ProxyIpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/group")
@CrossOrigin
public class IpGroupController {

    @Autowired
    private IpGroupService ipGroupService;

    @Autowired
    private ProxyIpService proxyIpService;

    @GetMapping("/page")
    public Result<Page<IpGroup>> page(@RequestParam(defaultValue = "1") int current,
                                       @RequestParam(defaultValue = "20") int size,
                                       @RequestParam(required = false) String keyword) {
        return Result.success(ipGroupService.page(current, size, keyword));
    }

    @GetMapping("/list")
    public Result<List<IpGroup>> list() {
        return Result.success(ipGroupService.list());
    }

    @GetMapping("/{id}")
    public Result<IpGroup> getById(@PathVariable Long id) {
        return Result.success(ipGroupService.getById(id));
    }

    @PostMapping
    public Result<?> save(@RequestBody IpGroup ipGroup) {
        boolean success = ipGroupService.save(ipGroup);
        return success ? Result.success() : Result.error("保存失败");
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        boolean success = ipGroupService.deleteById(id);
        return success ? Result.success() : Result.error("删除失败");
    }

    @PostMapping("/{groupId}/addIp/{ipId}")
    public Result<?> addIp(@PathVariable Long groupId, @PathVariable Long ipId) {
        boolean success = ipGroupService.addIpToGroup(groupId, ipId);
        return success ? Result.success() : Result.error("添加失败");
    }

    @PostMapping("/{groupId}/batchAdd")
    public Result<?> batchAddIp(@PathVariable Long groupId, @RequestBody List<Long> ipIds) {
        boolean success = ipGroupService.batchAddIpToGroup(groupId, ipIds);
        return success ? Result.success() : Result.error("添加失败");
    }

    @DeleteMapping("/{groupId}/removeIp/{ipId}")
    public Result<?> removeIp(@PathVariable Long groupId, @PathVariable Long ipId) {
        boolean success = ipGroupService.removeIpFromGroup(groupId, ipId);
        return success ? Result.success() : Result.error("移除失败");
    }

    @GetMapping("/{groupId}/ips")
    public Result<List<ProxyIp>> getIpsByGroup(@PathVariable Long groupId) {
        List<Long> ipIds = ipGroupService.getIpIdsByGroupId(groupId);
        List<ProxyIp> ips = new java.util.ArrayList<>();
        for (Long id : ipIds) {
            ProxyIp ip = proxyIpService.getById(id);
            if (ip != null) {
                ips.add(ip);
            }
        }
        return Result.success(ips);
    }
}
