package com.qi.ipmanage.controller;

import com.qi.ipmanage.common.PageResult;
import com.qi.ipmanage.common.Result;
import com.qi.ipmanage.entity.IpAccessControl;
import com.qi.ipmanage.service.IpAccessControlService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ip-access-control")
public class IpAccessControlController {

    @Autowired
    private IpAccessControlService ipAccessControlService;

    @GetMapping("/page")
    public Result<PageResult<IpAccessControl>> page(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) Long proxyIpId,
            @RequestParam(required = false) Integer controlTargetType,
            @RequestParam(required = false) Integer controlType) {
        return Result.success(ipAccessControlService.page(pageNum, pageSize, proxyIpId, controlTargetType, controlType));
    }

    @GetMapping("/proxy-ip/{proxyIpId}")
    public Result<List<IpAccessControl>> getByProxyIpId(@PathVariable Long proxyIpId) {
        return Result.success(ipAccessControlService.getByProxyIpId(proxyIpId));
    }

    @PostMapping
    public Result<Boolean> save(@RequestBody IpAccessControl ipAccessControl) {
        return Result.success(ipAccessControlService.saveOrUpdate(ipAccessControl));
    }

    @DeleteMapping("/{id}")
    public Result<Boolean> delete(@PathVariable Long id) {
        return Result.success(ipAccessControlService.removeById(id));
    }

    @DeleteMapping("/batch")
    public Result<Boolean> batchDelete(@RequestBody List<Long> ids) {
        return Result.success(ipAccessControlService.removeByIds(ids));
    }

    @PutMapping("/status/{id}/{status}")
    public Result<Boolean> updateStatus(@PathVariable Long id, @PathVariable Integer status) {
        IpAccessControl control = new IpAccessControl();
        control.setId(id);
        control.setStatus(status);
        return Result.success(ipAccessControlService.updateById(control));
    }
}
