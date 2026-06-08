package com.ba.ipmanage.controller;

import com.ba.ipmanage.common.Result;
import com.ba.ipmanage.entity.SystemConfig;
import com.ba.ipmanage.service.SystemConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/config")
@CrossOrigin
public class SystemConfigController {

    @Autowired
    private SystemConfigService systemConfigService;

    @GetMapping("/list")
    public Result<List<SystemConfig>> list() {
        return Result.success(systemConfigService.list());
    }

    @PostMapping
    public Result<?> updateConfig(@RequestBody SystemConfig config) {
        boolean success = systemConfigService.updateConfig(config.getConfigKey(), config.getConfigValue());
        return success ? Result.success() : Result.error("更新失败");
    }

    @GetMapping("/{key}")
    public Result<String> getConfig(@PathVariable String key) {
        return Result.success(systemConfigService.getConfigValue(key));
    }
}
