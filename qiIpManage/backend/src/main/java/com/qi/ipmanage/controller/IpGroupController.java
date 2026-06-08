package com.qi.ipmanage.controller;

import com.qi.ipmanage.common.PageResult;
import com.qi.ipmanage.common.Result;
import com.qi.ipmanage.entity.IpGroup;
import com.qi.ipmanage.service.IpGroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ip-group")
public class IpGroupController {

    @Autowired
    private IpGroupService ipGroupService;

    @GetMapping("/page")
    public Result<PageResult<IpGroup>> page(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) String keyword) {
        return Result.success(ipGroupService.page(pageNum, pageSize, keyword));
    }

    @GetMapping("/list")
    public Result<List<IpGroup>> list() {
        return Result.success(ipGroupService.listAll());
    }

    @GetMapping("/{id}")
    public Result<IpGroup> getById(@PathVariable Long id) {
        return Result.success(ipGroupService.getById(id));
    }

    @PostMapping
    public Result<Boolean> save(@RequestBody IpGroup ipGroup) {
        return Result.success(ipGroupService.saveOrUpdate(ipGroup));
    }

    @DeleteMapping("/{id}")
    public Result<Boolean> delete(@PathVariable Long id) {
        return Result.success(ipGroupService.removeById(id));
    }

    @DeleteMapping("/batch")
    public Result<Boolean> batchDelete(@RequestBody List<Long> ids) {
        return Result.success(ipGroupService.removeByIds(ids));
    }
}
