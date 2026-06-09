package com.ba.ipmanage.service;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.ba.ipmanage.entity.IpLocationApi;
import com.ba.ipmanage.entity.ProxyIp;
import com.ba.ipmanage.mapper.IpLocationApiMapper;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class IpLocationService {

    private static final Logger log = LoggerFactory.getLogger(IpLocationService.class);

    private static final Pattern JSONP_PATTERN = Pattern.compile("\\((\\{.*\\})\\)\\s*;?\\s*$");

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
        resetDailyUsageIfNeeded();
        List<IpLocationApi> apis = ipLocationApiMapper.selectAllActive();
        if (apis.isEmpty()) {
            return null;
        }

        for (IpLocationApi api : apis) {
            if (api.getDailyQuota() != null && api.getDailyQuota() > 0
                    && api.getUsedCountToday() >= api.getDailyQuota()) {
                continue;
            }

            try {
                Map<String, String> result = queryApi(api, ip);
                if (result != null && result.get("location") != null
                        && !result.get("location").isEmpty()) {
                    incrementApiUsage(api.getId());
                    return result;
                }
            } catch (Exception e) {
                log.warn("API {} 查询失败: {}", api.getApiName(), e.getMessage());
            }
        }

        return null;
    }

    private Map<String, String> queryApi(IpLocationApi api, String ip) {
        String url = api.getApiUrl().replace("{ip}", ip);
        String method = api.getRequestMethod() != null ? api.getRequestMethod() : "GET";

        HttpRequest request;
        if ("POST".equalsIgnoreCase(method)) {
            request = HttpRequest.post(url);
        } else {
            request = HttpRequest.get(url);
        }

        request.timeout(8000);
        request.header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");

        if (api.getRequestParams() != null && !api.getRequestParams().isEmpty()) {
            try {
                JSONObject params = JSON.parseObject(api.getRequestParams());
                for (String key : params.keySet()) {
                    String value = params.getString(key).replace("{ip}", ip);
                    request.form(key, value);
                }
            } catch (Exception e) {
                log.warn("解析请求参数失败: {}", e.getMessage());
            }
        }

        HttpResponse response = request.execute();
        if (!response.isOk()) {
            log.debug("API {} HTTP状态: {}", api.getApiName(), response.getStatus());
            return null;
        }

        byte[] bodyBytes = response.bodyBytes();
        if (bodyBytes == null || bodyBytes.length == 0) {
            return null;
        }

        String body = decodeBody(bodyBytes);
        if (body == null || body.isEmpty()) {
            return null;
        }

        JSONObject json = parseResponseBody(body);
        if (json == null) {
            return null;
        }

        return parseLocationResult(json, api);
    }

    private String decodeBody(byte[] bodyBytes) {
        String utf8Body = new String(bodyBytes, StandardCharsets.UTF_8);
        
        if (isValidJson(utf8Body) && !containsGarbled(utf8Body)) {
            return utf8Body;
        }

        try {
            String gbkBody = new String(bodyBytes, Charset.forName("GBK"));
            if (isValidJson(gbkBody)) {
                return gbkBody;
            }
            
            if (containsGarbled(utf8Body) && !containsGarbled(gbkBody)) {
                return gbkBody;
            }
        } catch (Exception e) {
            log.debug("GBK解码失败: {}", e.getMessage());
        }

        return utf8Body;
    }

    private boolean isValidJson(String str) {
        if (str == null || str.isEmpty()) {
            return false;
        }
        String trimmed = str.trim();
        return (trimmed.startsWith("{") && trimmed.contains("}"))
                || (trimmed.startsWith("[") && trimmed.contains("]"))
                || trimmed.contains("{") ;
    }

    private boolean containsGarbled(String str) {
        if (str == null || str.isEmpty()) {
            return false;
        }
        int garbledCount = 0;
        for (char c : str.toCharArray()) {
            if (c == '\uFFFD' || (c >= 0x80 && c <= 0x9F)) {
                garbledCount++;
            }
        }
        return garbledCount > 3;
    }

    private JSONObject parseResponseBody(String body) {
        body = body.trim();

        if (body.startsWith("{") || body.startsWith("[")) {
            try {
                return JSON.parseObject(body);
            } catch (Exception e) {
                try {
                    JSONArray arr = JSON.parseArray(body);
                    if (!arr.isEmpty()) {
                        return arr.getJSONObject(0);
                    }
                } catch (Exception ex) {
                    log.debug("JSON解析失败: {}", body.substring(0, Math.min(200, body.length())));
                }
            }
        }

        Matcher matcher = JSONP_PATTERN.matcher(body);
        if (matcher.find()) {
            String jsonStr = matcher.group(1);
            try {
                return JSON.parseObject(jsonStr);
            } catch (Exception e) {
                log.debug("JSONP解析失败: {}", e.getMessage());
            }
        }

        if (body.contains("{")) {
            int start = body.indexOf('{');
            int end = body.lastIndexOf('}');
            if (start >= 0 && end > start) {
                String jsonStr = body.substring(start, end + 1);
                try {
                    return JSON.parseObject(jsonStr);
                } catch (Exception e) {
                    log.debug("提取JSON失败: {}", e.getMessage());
                }
            }
        }

        return null;
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
            if (result.get("country") != null) {
                location.append(result.get("country"));
            }
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

        if (result.get("location") == null || result.get("location").isEmpty()) {
            String addr = findFirstStringValue(json);
            if (addr != null && !addr.isEmpty()) {
                result.put("location", addr);
            }
        }

        return result;
    }

    private String getNestedValue(JSONObject json, String path) {
        if (path == null || path.isEmpty() || json == null) {
            return null;
        }
        String[] keys = path.split("\\.");
        Object current = json;
        for (String key : keys) {
            if (current instanceof JSONObject) {
                current = ((JSONObject) current).get(key);
            } else if (current instanceof JSONArray) {
                JSONArray arr = (JSONArray) current;
                if (!arr.isEmpty()) {
                    current = arr.get(0);
                    if (current instanceof JSONObject) {
                        current = ((JSONObject) current).get(key);
                    } else {
                        return null;
                    }
                } else {
                    return null;
                }
            } else {
                return null;
            }
            if (current == null) {
                return null;
            }
        }
        return current != null ? current.toString() : null;
    }

    private String findFirstStringValue(JSONObject json) {
        if (json == null) return null;

        String[] knownFields = {"addr", "address", "location", "area", "place",
                "ipLocation", "ip_location", "info", "data"};

        for (String field : knownFields) {
            Object value = json.get(field);
            if (value instanceof String && !((String) value).isEmpty()) {
                return (String) value;
            }
        }

        for (String key : json.keySet()) {
            Object value = json.get(key);
            if (value instanceof String) {
                String str = (String) value;
                if (str.length() > 2 && str.length() < 100
                        && (str.contains("省") || str.contains("市") || str.contains("区") || str.contains("县"))) {
                    return str;
                }
            }
        }

        for (String key : json.keySet()) {
            Object value = json.get(key);
            if (value instanceof JSONObject) {
                String nested = findFirstStringValue((JSONObject) value);
                if (nested != null) return nested;
            }
        }

        return null;
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
