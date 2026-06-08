package com.qi.ipmanage.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.qi.ipmanage.common.PageResult;
import com.qi.ipmanage.entity.IpLocationApi;
import com.qi.ipmanage.mapper.IpLocationApiMapper;
import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.json.JSONUtil;
import com.jayway.jsonpath.JsonPath;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class IpLocationApiService extends ServiceImpl<IpLocationApiMapper, IpLocationApi> {

    public PageResult<IpLocationApi> page(Integer pageNum, Integer pageSize, String keyword, Integer status) {
        LambdaQueryWrapper<IpLocationApi> wrapper = new LambdaQueryWrapper<>();
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.like(IpLocationApi::getApiName, keyword);
        }
        if (status != null) {
            wrapper.eq(IpLocationApi::getStatus, status);
        }
        wrapper.orderByDesc(IpLocationApi::getPriority);
        IPage<IpLocationApi> page = this.page(new Page<>(pageNum, pageSize), wrapper);
        return PageResult.of(page);
    }

    public List<IpLocationApi> getEnabledList() {
        return baseMapper.selectEnabledList();
    }

    public JSONObject getIpLocation(String ip) {
        List<IpLocationApi> apiList = getEnabledList();
        for (IpLocationApi api : apiList) {
            if (!checkDailyLimit(api)) {
                continue;
            }
            try {
                JSONObject result = callApi(api, ip);
                if (result != null) {
                    incrementUsage(api.getId());
                    return result;
                }
            } catch (Exception e) {
                continue;
            }
        }
        return null;
    }

    private boolean checkDailyLimit(IpLocationApi api) {
        LocalDate today = LocalDate.now();
        if (api.getLastResetDate() == null || !api.getLastResetDate().equals(today)) {
            api.setTodayUsed(0);
            api.setLastResetDate(today);
            this.updateById(api);
        }
        return api.getTodayUsed() < api.getDailyLimit();
    }

    private void incrementUsage(Long id) {
        IpLocationApi api = this.getById(id);
        if (api != null) {
            api.setTodayUsed(api.getTodayUsed() + 1);
            this.updateById(api);
        }
    }

    private JSONObject callApi(IpLocationApi api, String ip) {
        String url = api.getApiUrl().replace("{ip}", ip);
        HttpRequest request;
        if ("POST".equalsIgnoreCase(api.getRequestMethod())) {
            request = HttpRequest.post(url);
            if (api.getRequestParams() != null && !api.getRequestParams().isEmpty()) {
                String params = api.getRequestParams().replace("{ip}", ip);
                request.body(params);
            }
        } else {
            request = HttpRequest.get(url);
        }

        if (api.getRequestHeaders() != null && !api.getRequestHeaders().isEmpty()) {
            JSONObject headers = JSON.parseObject(api.getRequestHeaders());
            for (String key : headers.keySet()) {
                request.header(key, headers.getString(key));
            }
        }

        try (HttpResponse response = request.timeout(5000).execute()) {
            if (response.isOk()) {
                String body = response.body();
                JSONObject result = new JSONObject();
                Object document = com.alibaba.fastjson2.JSON.parse(body);

                if (api.getLocationPath() != null && !api.getLocationPath().isEmpty()) {
                    String location = extractValue(document, api.getLocationPath());
                    result.put("location", location);
                }
                if (api.getProvincePath() != null && !api.getProvincePath().isEmpty()) {
                    String province = extractValue(document, api.getProvincePath());
                    result.put("province", province);
                }
                if (api.getCityPath() != null && !api.getCityPath().isEmpty()) {
                    String city = extractValue(document, api.getCityPath());
                    result.put("city", city);
                }
                if (api.getIspPath() != null && !api.getIspPath().isEmpty()) {
                    String isp = extractValue(document, api.getIspPath());
                    result.put("isp", isp);
                }

                if (result.isEmpty()) {
                    return null;
                }
                result.put("ip", ip);
                return result;
            }
        }
        return null;
    }

    private String extractValue(Object document, String path) {
        if (path == null || path.isEmpty()) {
            return null;
        }
        try {
            if (path.contains("+")) {
                String[] paths = path.split("\\+");
                StringBuilder sb = new StringBuilder();
                for (String p : paths) {
                    String val = JsonPath.read(document, p.trim());
                    if (val != null) {
                        sb.append(val);
                    }
                }
                return sb.toString();
            } else {
                Object val = JsonPath.read(document, path);
                return val != null ? val.toString() : null;
            }
        } catch (Exception e) {
            return null;
        }
    }
}
