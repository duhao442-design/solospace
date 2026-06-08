package com.qi.ipmanage.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.qi.ipmanage.common.PageResult;
import com.qi.ipmanage.entity.PendingProxyIp;
import com.qi.ipmanage.mapper.PendingProxyIpMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PendingProxyIpService extends ServiceImpl<PendingProxyIpMapper, PendingProxyIp> {

    public PageResult<PendingProxyIp> page(Integer pageNum, Integer pageSize, Integer status, String source) {
        LambdaQueryWrapper<PendingProxyIp> wrapper = new LambdaQueryWrapper<>();
        if (status != null) {
            wrapper.eq(PendingProxyIp::getStatus, status);
        }
        if (source != null && !source.isEmpty()) {
            wrapper.like(PendingProxyIp::getSource, source);
        }
        wrapper.orderByDesc(PendingProxyIp::getCreateTime);
        IPage<PendingProxyIp> page = this.page(new Page<>(pageNum, pageSize), wrapper);
        return PageResult.of(page);
    }

    public List<PendingProxyIp> getPendingList(Integer limit) {
        return this.list(new LambdaQueryWrapper<PendingProxyIp>()
                .eq(PendingProxyIp::getStatus, 0)
                .orderByAsc(PendingProxyIp::getCreateTime)
                .last("LIMIT " + limit));
    }

    public void markVerified(Long id, boolean success) {
        PendingProxyIp ip = this.getById(id);
        if (ip != null) {
            ip.setStatus(success ? 1 : 2);
            ip.setVerifyCount(ip.getVerifyCount() + 1);
            ip.setLastVerifyTime(LocalDateTime.now());
            this.updateById(ip);
        }
    }

    public boolean addPendingIp(String ip, Integer port, String protocol, String source, String supplier) {
        try {
            PendingProxyIp pendingIp = new PendingProxyIp();
            pendingIp.setIp(ip);
            pendingIp.setPort(port);
            pendingIp.setProtocol(protocol != null ? protocol : "http");
            pendingIp.setSource(source);
            pendingIp.setSupplier(supplier);
            pendingIp.setStatus(0);
            pendingIp.setVerifyCount(0);
            this.save(pendingIp);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
