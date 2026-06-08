package com.qi.ipmanage.controller;

import com.qi.ipmanage.common.Result;
import com.qi.ipmanage.service.SysConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sys-config")
public class SysConfigController {

    @Autowired
    private SysConfigService sysConfigService;

    @GetMapping("/all")
    public Result<Map<String, String>> getAll() {
        return Result.success(sysConfigService.getAllConfigs());
    }

    @GetMapping("/{key}")
    public Result<String> getByKey(@PathVariable String key) {
        return Result.success(sysConfigService.getConfigValue(key));
    }

    @PostMapping
    public Result<Boolean> update(@RequestBody Map<String, String> params) {
        String key = params.get("key");
        String value = params.get("value");
        return Result.success(sysConfigService.updateConfig(key, value));
    }

    @PostMapping("/batch")
    public Result<Boolean> batchUpdate(@RequestBody Map<String, String> configs) {
        for (Map.Entry<String, String> entry : configs.entrySet()) {
            sysConfigService.updateConfig(entry.getKey(), entry.getValue());
        }
        return Result.success(true);
    }
}
