package com.ba.ipmanage.controller;

import com.ba.ipmanage.common.Result;
import com.ba.ipmanage.entity.IpLocationApi;
import com.ba.ipmanage.service.IpLocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/locationApi")
@CrossOrigin
public class IpLocationApiController {

    @Autowired
    private IpLocationService ipLocationService;

    @GetMapping("/list")
    public Result<List<IpLocationApi>> list() {
        return Result.success(ipLocationService.list());
    }

    @PostMapping
    public Result<?> save(@RequestBody IpLocationApi api) {
        boolean success = ipLocationService.save(api);
        return success ? Result.success() : Result.error("保存失败");
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        boolean success = ipLocationService.deleteById(id);
        return success ? Result.success() : Result.error("删除失败");
    }

    @GetMapping("/test/{ip}")
    public Result<Map<String, String>> test(@PathVariable String ip) {
        Map<String, String> result = ipLocationService.getIpLocation(ip);
        return Result.success(result);
    }
}
