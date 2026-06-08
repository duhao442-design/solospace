package com.qi.ipmanage.controller;

import com.qi.ipmanage.common.PageResult;
import com.qi.ipmanage.common.Result;
import com.qi.ipmanage.entity.IpLocationApi;
import com.qi.ipmanage.service.IpLocationApiService;
import com.alibaba.fastjson2.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ip-location-api")
public class IpLocationApiController {

    @Autowired
    private IpLocationApiService ipLocationApiService;

    @GetMapping("/page")
    public Result<PageResult<IpLocationApi>> page(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status) {
        return Result.success(ipLocationApiService.page(pageNum, pageSize, keyword, status));
    }

    @GetMapping("/list")
    public Result<List<IpLocationApi>> list() {
        return Result.success(ipLocationApiService.getEnabledList());
    }

    @GetMapping("/{id}")
    public Result<IpLocationApi> getById(@PathVariable Long id) {
        return Result.success(ipLocationApiService.getById(id));
    }

    @PostMapping
    public Result<Boolean> save(@RequestBody IpLocationApi ipLocationApi) {
        return Result.success(ipLocationApiService.saveOrUpdate(ipLocationApi));
    }

    @DeleteMapping("/{id}")
    public Result<Boolean> delete(@PathVariable Long id) {
        return Result.success(ipLocationApiService.removeById(id));
    }

    @PutMapping("/status/{id}/{status}")
    public Result<Boolean> updateStatus(@PathVariable Long id, @PathVariable Integer status) {
        IpLocationApi api = new IpLocationApi();
        api.setId(id);
        api.setStatus(status);
        return Result.success(ipLocationApiService.updateById(api));
    }

    @GetMapping("/test/{ip}")
    public Result<JSONObject> testApi(@PathVariable String ip) {
        JSONObject result = ipLocationApiService.getIpLocation(ip);
        return Result.success(result);
    }
}
