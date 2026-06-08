package com.qi.ipmanage.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.qi.ipmanage.entity.SysConfig;
import com.qi.ipmanage.mapper.SysConfigMapper;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SysConfigService extends ServiceImpl<SysConfigMapper, SysConfig> {

    public String getConfigValue(String configKey) {
        SysConfig config = this.getOne(new LambdaQueryWrapper<SysConfig>().eq(SysConfig::getConfigKey, configKey));
        return config != null ? config.getConfigValue() : null;
    }

    public Integer getConfigInt(String configKey, Integer defaultValue) {
        String value = getConfigValue(configKey);
        if (value != null) {
            try {
                return Integer.parseInt(value);
            } catch (NumberFormatException e) {
                return defaultValue;
            }
        }
        return defaultValue;
    }

    public Map<String, String> getAllConfigs() {
        Map<String, String> configMap = new HashMap<>();
        List<SysConfig> configs = this.list();
        for (SysConfig config : configs) {
            configMap.put(config.getConfigKey(), config.getConfigValue());
        }
        return configMap;
    }

    public boolean updateConfig(String configKey, String configValue) {
        SysConfig config = this.getOne(new LambdaQueryWrapper<SysConfig>().eq(SysConfig::getConfigKey, configKey));
        if (config != null) {
            config.setConfigValue(configValue);
            return this.updateById(config);
        } else {
            SysConfig newConfig = new SysConfig();
            newConfig.setConfigKey(configKey);
            newConfig.setConfigValue(configValue);
            return this.save(newConfig);
        }
    }
}
