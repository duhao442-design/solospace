package com.qi.ipmanage.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.qi.ipmanage.common.PageResult;
import com.qi.ipmanage.entity.RequesterControl;
import com.qi.ipmanage.entity.RequesterGroupAccess;
import com.qi.ipmanage.mapper.RequesterControlMapper;
import com.qi.ipmanage.mapper.RequesterGroupAccessMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RequesterControlService extends ServiceImpl<RequesterControlMapper, RequesterControl> {

    @Autowired
    private RequesterGroupAccessMapper requesterGroupAccessMapper;

    public PageResult<RequesterControl> page(Integer pageNum, Integer pageSize, Integer requesterType, String keyword, Integer status) {
        LambdaQueryWrapper<RequesterControl> wrapper = new LambdaQueryWrapper<>();
        if (requesterType != null) {
            wrapper.eq(RequesterControl::getRequesterType, requesterType);
        }
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.like(RequesterControl::getRequesterValue, keyword);
        }
        if (status != null) {
            wrapper.eq(RequesterControl::getStatus, status);
        }
        wrapper.orderByDesc(RequesterControl::getCreateTime);
        IPage<RequesterControl> page = this.page(new Page<>(pageNum, pageSize), wrapper);
        return PageResult.of(page);
    }

    public RequesterControl getByRequester(Integer requesterType, String requesterValue) {
        return this.getOne(new LambdaQueryWrapper<RequesterControl>()
                .eq(RequesterControl::getRequesterType, requesterType)
                .eq(RequesterControl::getRequesterValue, requesterValue));
    }

    @Transactional(rollbackFor = Exception.class)
    public boolean saveWithGroups(RequesterControl requesterControl, List<RequesterGroupAccess> accessList) {
        boolean result = this.saveOrUpdate(requesterControl);
        if (result) {
            requesterGroupAccessMapper.delete(new LambdaQueryWrapper<RequesterGroupAccess>()
                    .eq(RequesterGroupAccess::getRequesterId, requesterControl.getId()));
            if (accessList != null && !accessList.isEmpty()) {
                for (RequesterGroupAccess access : accessList) {
                    access.setRequesterId(requesterControl.getId());
                    requesterGroupAccessMapper.insert(access);
                }
            }
        }
        return result;
    }

    public List<RequesterGroupAccess> getGroupAccessList(Long requesterId) {
        return requesterGroupAccessMapper.selectList(new LambdaQueryWrapper<RequesterGroupAccess>()
                .eq(RequesterGroupAccess::getRequesterId, requesterId));
    }
}
