package com.qi.ipmanage.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.qi.ipmanage.common.PageResult;
import com.qi.ipmanage.entity.ProxyIp;
import com.qi.ipmanage.entity.ProxyIpGroup;
import com.qi.ipmanage.mapper.ProxyIpMapper;
import com.qi.ipmanage.mapper.ProxyIpGroupMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ProxyIpService extends ServiceImpl<ProxyIpMapper, ProxyIp> {

    @Autowired
    private ProxyIpGroupMapper proxyIpGroupMapper;

    public PageResult<ProxyIp> page(Integer pageNum, Integer pageSize, String keyword, Integer status, String supplier, String protocol) {
        LambdaQueryWrapper<ProxyIp> wrapper = new LambdaQueryWrapper<>();
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.and(w -> w.like(ProxyIp::getIp, keyword)
                    .or().like(ProxyIp::getLocation, keyword)
                    .or().like(ProxyIp::getSupplier, keyword));
        }
        if (status != null) {
            wrapper.eq(ProxyIp::getStatus, status);
        }
        if (supplier != null && !supplier.isEmpty()) {
            wrapper.like(ProxyIp::getSupplier, supplier);
        }
        if (protocol != null && !protocol.isEmpty()) {
            wrapper.eq(ProxyIp::getProtocol, protocol);
        }
        wrapper.orderByDesc(ProxyIp::getUpdateTime);
        IPage<ProxyIp> page = this.page(new Page<>(pageNum, pageSize), wrapper);
        return PageResult.of(page);
    }

    public List<ProxyIp> getRandomIps(Integer limit) {
        return baseMapper.selectRandom(limit);
    }

    public List<ProxyIp> getRandomIpsByGroup(Long groupId, Integer limit) {
        return baseMapper.selectRandomByGroupId(groupId, limit);
    }

    public List<ProxyIp> getRandomIpsByGroups(List<Long> groupIds, Integer limit) {
        return baseMapper.selectRandomByGroupIds(groupIds, limit);
    }

    public ProxyIp getRandomOne() {
        List<ProxyIp> list = baseMapper.selectRandom(1);
        return list.isEmpty() ? null : list.get(0);
    }

    public ProxyIp getRandomOneByGroup(Long groupId) {
        List<ProxyIp> list = baseMapper.selectRandomByGroupId(groupId, 1);
        return list.isEmpty() ? null : list.get(0);
    }

    public void incrementUseCount(Long id, boolean success) {
        ProxyIp proxyIp = this.getById(id);
        if (proxyIp != null) {
            proxyIp.setUseCount(proxyIp.getUseCount() + 1);
            if (success) {
                proxyIp.setSuccessCount(proxyIp.getSuccessCount() + 1);
                proxyIp.setLastSuccessTime(LocalDateTime.now());
            } else {
                proxyIp.setFailCount(proxyIp.getFailCount() + 1);
            }
            this.updateById(proxyIp);
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public void updateStatus(Long id, Integer status) {
        ProxyIp proxyIp = new ProxyIp();
        proxyIp.setId(id);
        proxyIp.setStatus(status);
        proxyIp.setLastCheckTime(LocalDateTime.now());
        if (status == 1) {
            if (this.getById(id).getSurviveDate() == null) {
                proxyIp.setSurviveDate(LocalDate.now());
            }
        }
        this.updateById(proxyIp);
    }

    @Transactional(rollbackFor = Exception.class)
    public boolean saveWithGroups(ProxyIp proxyIp, List<Long> groupIds) {
        boolean result = this.saveOrUpdate(proxyIp);
        if (result) {
            proxyIpGroupMapper.delete(new LambdaQueryWrapper<ProxyIpGroup>()
                    .eq(ProxyIpGroup::getProxyIpId, proxyIp.getId()));
            if (groupIds != null && !groupIds.isEmpty()) {
                for (Long groupId : groupIds) {
                    ProxyIpGroup pig = new ProxyIpGroup();
                    pig.setProxyIpId(proxyIp.getId());
                    pig.setGroupId(groupId);
                    proxyIpGroupMapper.insert(pig);
                }
            }
        }
        return result;
    }

    public List<Long> getGroupIdsByProxyIpId(Long proxyIpId) {
        return proxyIpGroupMapper.selectGroupIdsByProxyIpId(proxyIpId);
    }

    @Transactional(rollbackFor = Exception.class)
    public void batchUpdateStatus(List<Long> ids, Integer status) {
        for (Long id : ids) {
            updateStatus(id, status);
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public void batchAddToGroup(List<Long> proxyIpIds, List<Long> groupIds) {
        for (Long proxyIpId : proxyIpIds) {
            for (Long groupId : groupIds) {
                ProxyIpGroup pig = new ProxyIpGroup();
                pig.setProxyIpId(proxyIpId);
                pig.setGroupId(groupId);
                try {
                    proxyIpGroupMapper.insert(pig);
                } catch (Exception ignored) {
                }
            }
        }
    }
}
