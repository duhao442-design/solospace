package com.qi.ipmanage.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.qi.ipmanage.common.PageResult;
import com.qi.ipmanage.entity.IpAccessControl;
import com.qi.ipmanage.mapper.IpAccessControlMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class IpAccessControlService extends ServiceImpl<IpAccessControlMapper, IpAccessControl> {

    public PageResult<IpAccessControl> page(Integer pageNum, Integer pageSize, Long proxyIpId, Integer controlTargetType, Integer controlType) {
        LambdaQueryWrapper<IpAccessControl> wrapper = new LambdaQueryWrapper<>();
        if (proxyIpId != null) {
            wrapper.eq(IpAccessControl::getProxyIpId, proxyIpId);
        }
        if (controlTargetType != null) {
            wrapper.eq(IpAccessControl::getControlTargetType, controlTargetType);
        }
        if (controlType != null) {
            wrapper.eq(IpAccessControl::getControlType, controlType);
        }
        wrapper.orderByDesc(IpAccessControl::getCreateTime);
        IPage<IpAccessControl> page = this.page(new Page<>(pageNum, pageSize), wrapper);
        return PageResult.of(page);
    }

    public List<IpAccessControl> getByProxyIpId(Long proxyIpId) {
        return this.list(new LambdaQueryWrapper<IpAccessControl>()
                .eq(IpAccessControl::getProxyIpId, proxyIpId)
                .eq(IpAccessControl::getStatus, 1));
    }
}
