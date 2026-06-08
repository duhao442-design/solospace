package com.qi.ipmanage.controller;

import com.qi.ipmanage.common.PageResult;
import com.qi.ipmanage.common.Result;
import com.qi.ipmanage.entity.RequesterControl;
import com.qi.ipmanage.entity.RequesterGroupAccess;
import com.qi.ipmanage.service.RequesterControlService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/requester-control")
public class RequesterControlController {

    @Autowired
    private RequesterControlService requesterControlService;

    @GetMapping("/page")
    public Result<PageResult<RequesterControl>> page(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) Integer requesterType,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status) {
        return Result.success(requesterControlService.page(pageNum, pageSize, requesterType, keyword, status));
    }

    @GetMapping("/{id}")
    public Result<RequesterControl> getById(@PathVariable Long id) {
        return Result.success(requesterControlService.getById(id));
    }

    @GetMapping("/{id}/group-access")
    public Result<List<RequesterGroupAccess>> getGroupAccess(@PathVariable Long id) {
        return Result.success(requesterControlService.getGroupAccessList(id));
    }

    @PostMapping
    public Result<Boolean> save(@RequestBody RequesterControl requesterControl) {
        return Result.success(requesterControlService.saveOrUpdate(requesterControl));
    }

    @PostMapping("/save-with-access")
    public Result<Boolean> saveWithAccess(@RequestBody Map<String, Object> params) {
        RequesterControl requesterControl = com.alibaba.fastjson2.JSONObject.parseObject(
                com.alibaba.fastjson2.JSONObject.toJSONString(params.get("requesterControl")), RequesterControl.class);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> accessListMap = (List<Map<String, Object>>) params.get("accessList");
        List<RequesterGroupAccess> accessList = new java.util.ArrayList<>();
        if (accessListMap != null) {
            for (Map<String, Object> map : accessListMap) {
                RequesterGroupAccess access = new RequesterGroupAccess();
                access.setGroupId(Long.valueOf(map.get("groupId").toString()));
                access.setAccessType(Integer.valueOf(map.get("accessType").toString()));
                accessList.add(access);
            }
        }
        return Result.success(requesterControlService.saveWithGroups(requesterControl, accessList));
    }

    @DeleteMapping("/{id}")
    public Result<Boolean> delete(@PathVariable Long id) {
        return Result.success(requesterControlService.removeById(id));
    }

    @DeleteMapping("/batch")
    public Result<Boolean> batchDelete(@RequestBody List<Long> ids) {
        return Result.success(requesterControlService.removeByIds(ids));
    }

    @PutMapping("/status/{id}/{status}")
    public Result<Boolean> updateStatus(@PathVariable Long id, @PathVariable Integer status) {
        RequesterControl control = new RequesterControl();
        control.setId(id);
        control.setStatus(status);
        return Result.success(requesterControlService.updateById(control));
    }
}
