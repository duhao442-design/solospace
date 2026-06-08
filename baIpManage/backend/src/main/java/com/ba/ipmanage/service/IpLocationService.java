package com.ba.ipmanage.service;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.ba.ipmanage.entity.IpLocationApi;
import com.ba.ipmanage.entity.ProxyIp;
import com.ba.ipmanage.mapper.IpLocationApiMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class IpLocationService {

    private static final Logger log = LoggerFactory.getLogger(IpLocationService.class);

    @Autowired
    private IpLocationApiMapper ipLocationApiMapper;

    public void resetDailyUsageIfNeeded() {
        LocalDate today = LocalDate.now();
        ipLocationApiMapper.resetDailyUsage(today);
    }

    public IpLocationApi selectAvailableApi() {
        resetDailyUsageIfNeeded();
        List<IpLocationApi> apis = ipLocationApiMapper.selectAllActive();
        if (apis.isEmpty()) {
            return null;
        }

        for (IpLocationApi api : apis) {
            if (api.getDailyQuota() == null || api.getDailyQuota() == 0) {
                return api;
            }
            if (api.getUsedCountToday() < api.getDailyQuota()) {
                return api;
            }
        }

        return apis.get(0);
    }

    public Map<String, String> getIpLocation(String ip) {
        IpLocationApi api = selectAvailableApi();
        if (api == null) {
            return null;
        }

        try {
            String url = api.getApiUrl().replace("{ip}", ip);
            HttpRequest request = HttpRequest.get(url).timeout(5000);

            if (api.getRequestParams() != null && !api.getRequestParams().isEmpty()) {
                JSONObject params = JSON.parseObject(api.getRequestParams());
                for (String key : params.keySet()) {
                    String value = params.getString(key).replace("{ip}", ip);
                    request.form(key, value);
                }
            }

            HttpResponse response = request.execute();
            if (!response.isOk()) {
                log.warn("获取IP归属地失败, API: {}, IP: {}, HTTP状态: {}", api.getApiName(), ip, response.getStatus());
                return null;
            }

            JSONObject json = JSON.parseObject(response.body());
            Map<String, String> result = parseLocationResult(json, api);

            incrementApiUsage(api.getId());
            return result;

        } catch (Exception e) {
            log.error("获取IP归属地异常, API: {}, IP: {}", api.getApiName(), ip, e);
            return null;
        }
    }

    private Map<String, String> parseLocationResult(JSONObject json, IpLocationApi api) {
        Map<String, String> result = new HashMap<>();

        if (api.getCountryField() != null && !api.getCountryField().isEmpty()) {
            String country = getNestedValue(json, api.getCountryField());
            result.put("country", country);
        }

        if (api.getProvinceField() != null && !api.getProvinceField().isEmpty()) {
            String province = getNestedValue(json, api.getProvinceField());
            result.put("province", province);
        }

        if (api.getCityField() != null && !api.getCityField().isEmpty()) {
            String city = getNestedValue(json, api.getCityField());
            result.put("city", city);
        }

        if (api.getLocationField() != null && !api.getLocationField().isEmpty()) {
            String[] fields = api.getLocationField().split(",");
            StringBuilder location = new StringBuilder();
            for (String field : fields) {
                String value = getNestedValue(json, field.trim());
                if (value != null && !value.isEmpty()) {
                    if (location.length() > 0) {
                        location.append(" ");
                    }
                    location.append(value);
                }
            }
            result.put("location", location.toString());
        } else {
            StringBuilder location = new StringBuilder();
            if (result.get("country") != null) location.append(result.get("country"));
            if (result.get("province") != null) {
                if (location.length() > 0) location.append(" ");
                location.append(result.get("province"));
            }
            if (result.get("city") != null) {
                if (location.length() > 0) location.append(" ");
                location.append(result.get("city"));
            }
            result.put("location", location.toString());
        }

        return result;
    }

    private String getNestedValue(JSONObject json, String path) {
        if (path == null || path.isEmpty()) {
            return null;
        }
        String[] keys = path.split("\\.");
        Object current = json;
        for (String key : keys) {
            if (current instanceof JSONObject) {
                current = ((JSONObject) current).get(key);
            } else {
                return null;
            }
        }
        return current != null ? current.toString() : null;
    }

    public void incrementApiUsage(Long apiId) {
        IpLocationApi api = ipLocationApiMapper.selectById(apiId);
        if (api != null) {
            api.setUsedCountToday(api.getUsedCountToday() + 1);
            ipLocationApiMapper.updateById(api);
        }
    }

    public List<IpLocationApi> list() {
        return ipLocationApiMapper.selectList(null);
    }

    public boolean save(IpLocationApi api) {
        if (api.getId() == null) {
            return ipLocationApiMapper.insert(api) > 0;
        } else {
            return ipLocationApiMapper.updateById(api) > 0;
        }
    }

    public boolean deleteById(Long id) {
        return ipLocationApiMapper.deleteById(id) > 0;
    }

    public void fillIpLocation(ProxyIp proxyIp) {
        if (proxyIp.getLocation() != null && !proxyIp.getLocation().isEmpty()) {
            return;
        }

        Map<String, String> location = getIpLocation(proxyIp.getIp());
        if (location != null) {
            if (location.get("location") != null) {
                proxyIp.setLocation(location.get("location"));
            }
            if (location.get("country") != null) {
                proxyIp.setCountry(location.get("country"));
            }
            if (location.get("province") != null) {
                proxyIp.setProvince(location.get("province"));
            }
            if (location.get("city") != null) {
                proxyIp.setCity(location.get("city"));
            }
        }
    }
}
