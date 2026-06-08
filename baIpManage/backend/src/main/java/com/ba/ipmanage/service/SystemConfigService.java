package com.ba.ipmanage.service;

import com.ba.ipmanage.entity.SystemConfig;
import com.ba.ipmanage.mapper.SystemConfigMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SystemConfigService {

    @Autowired
    private SystemConfigMapper systemConfigMapper;

    public String getConfigValue(String key) {
        return systemConfigMapper.selectValueByKey(key);
    }

    public String getConfigValue(String key, String defaultValue) {
        String value = systemConfigMapper.selectValueByKey(key);
        return value != null ? value : defaultValue;
    }

    public int getConfigInt(String key, int defaultValue) {
        String value = getConfigValue(key);
        if (value == null || value.isEmpty()) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    public long getConfigLong(String key, long defaultValue) {
        String value = getConfigValue(key);
        if (value == null || value.isEmpty()) {
            return defaultValue;
        }
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    public boolean getConfigBoolean(String key, boolean defaultValue) {
        String value = getConfigValue(key);
        if (value == null || value.isEmpty()) {
            return defaultValue;
        }
        return Boolean.parseBoolean(value);
    }

    public double getConfigDouble(String key, double defaultValue) {
        String value = getConfigValue(key);
        if (value == null || value.isEmpty()) {
            return defaultValue;
        }
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    public List<SystemConfig> list() {
        return systemConfigMapper.selectList(null);
    }

    public boolean updateConfig(String key, String value) {
        SystemConfig config = systemConfigMapper.selectOne(new LambdaQueryWrapper<SystemConfig>().eq(SystemConfig::getConfigKey, key));
        if (config == null) {
            config = new SystemConfig();
            config.setConfigKey(key);
            config.setConfigValue(value);
            return systemConfigMapper.insert(config) > 0;
        } else {
            config.setConfigValue(value);
            return systemConfigMapper.updateById(config) > 0;
        }
    }
}
