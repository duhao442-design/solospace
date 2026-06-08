package com.ba.ipmanage.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ba.ipmanage.entity.ProxyIp;
import com.ba.ipmanage.mapper.ProxyIpMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class ProxyIpService {

    @Autowired
    private ProxyIpMapper proxyIpMapper;

    public Page<ProxyIp> page(int current, int size, String keyword, Integer status, String protocol) {
        LambdaQueryWrapper<ProxyIp> wrapper = new LambdaQueryWrapper<>();
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.like(ProxyIp::getIp, keyword)
                    .or().like(ProxyIp::getLocation, keyword)
                    .or().like(ProxyIp::getSupplier, keyword);
        }
        if (status != null) {
            wrapper.eq(ProxyIp::getStatus, status);
        }
        if (protocol != null && !protocol.isEmpty()) {
            wrapper.eq(ProxyIp::getProtocol, protocol);
        }
        wrapper.orderByDesc(ProxyIp::getCreatedTime);
        return proxyIpMapper.selectPage(new Page<>(current, size), wrapper);
    }

    public ProxyIp getById(Long id) {
        return proxyIpMapper.selectById(id);
    }

    public boolean save(ProxyIp proxyIp) {
        if (proxyIp.getId() == null) {
            proxyIp.setCreatedTime(LocalDateTime.now());
            proxyIp.setUpdatedTime(LocalDateTime.now());
            if (proxyIp.getUseCount() == null) {
                proxyIp.setUseCount(0);
            }
            if (proxyIp.getStatus() == null) {
                proxyIp.setStatus(0);
            }
            return proxyIpMapper.insert(proxyIp) > 0;
        } else {
            proxyIp.setUpdatedTime(LocalDateTime.now());
            return proxyIpMapper.updateById(proxyIp) > 0;
        }
    }

    public boolean deleteById(Long id) {
        return proxyIpMapper.deleteById(id) > 0;
    }

    public List<ProxyIp> getRandomAvailable(int count) {
        return proxyIpMapper.selectRandomAvailable(count);
    }

    public List<ProxyIp> getRandomByGroup(Long groupId, int count) {
        return proxyIpMapper.selectRandomByGroupId(groupId, count);
    }

    public List<Map<String, Object>> getCountryDistribution() {
        return proxyIpMapper.selectCountryDistribution();
    }

    public List<Map<String, Object>> getProvinceDistribution() {
        return proxyIpMapper.selectProvinceDistribution();
    }

    public void incrementUseCount(Long id) {
        ProxyIp ip = proxyIpMapper.selectById(id);
        if (ip != null) {
            ip.setUseCount(ip.getUseCount() + 1);
            ip.setUpdatedTime(LocalDateTime.now());
            proxyIpMapper.updateById(ip);
        }
    }

    public long countAvailable() {
        return proxyIpMapper.selectCount(new LambdaQueryWrapper<ProxyIp>().eq(ProxyIp::getStatus, 1));
    }

    public long countTotal() {
        return proxyIpMapper.selectCount(null);
    }
}
