package com.ba.ipmanage.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ba.ipmanage.common.Result;
import com.ba.ipmanage.entity.PoolControl;
import com.ba.ipmanage.entity.Requester;
import com.ba.ipmanage.entity.RequesterControl;
import com.ba.ipmanage.service.RequesterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/requester")
@CrossOrigin
public class RequesterController {

    @Autowired
    private RequesterService requesterService;

    @GetMapping("/page")
    public Result<Page<Requester>> page(@RequestParam(defaultValue = "1") int current,
                                        @RequestParam(defaultValue = "20") int size,
                                        @RequestParam(required = false) String keyword,
                                        @RequestParam(required = false) Integer status) {
        return Result.success(requesterService.page(current, size, keyword, status));
    }

    @GetMapping("/{id}")
    public Result<Requester> getById(@PathVariable Long id) {
        return Result.success(requesterService.getById(id));
    }

    @PostMapping
    public Result<?> save(@RequestBody Requester requester) {
        boolean success = requesterService.save(requester);
        return success ? Result.success() : Result.error("保存失败");
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        boolean success = requesterService.deleteById(id);
        return success ? Result.success() : Result.error("删除失败");
    }

    @GetMapping("/{requesterId}/controls")
    public Result<List<RequesterControl>> getControls(@PathVariable Long requesterId,
                                                       @RequestParam Integer controlType) {
        return Result.success(requesterService.getControls(requesterId, controlType));
    }

    @PostMapping("/control")
    public Result<?> addControl(@RequestBody RequesterControl control) {
        boolean success = requesterService.addControl(control);
        return success ? Result.success() : Result.error("添加失败");
    }

    @DeleteMapping("/control/{id}")
    public Result<?> removeControl(@PathVariable Long id) {
        boolean success = requesterService.removeControl(id);
        return success ? Result.success() : Result.error("删除失败");
    }

    @GetMapping("/{requesterId}/poolControls")
    public Result<List<PoolControl>> getPoolControls(@PathVariable Long requesterId,
                                                      @RequestParam Integer controlType) {
        return Result.success(requesterService.getPoolControls(requesterId, controlType));
    }

    @PostMapping("/poolControl")
    public Result<?> addPoolControl(@RequestBody PoolControl control) {
        boolean success = requesterService.addPoolControl(control);
        return success ? Result.success() : Result.error("添加失败");
    }

    @DeleteMapping("/poolControl/{id}")
    public Result<?> removePoolControl(@PathVariable Long id) {
        boolean success = requesterService.removePoolControl(id);
        return success ? Result.success() : Result.error("删除失败");
    }
}
