package com.qi.ipmanage.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.qi.ipmanage.common.PageResult;
import com.qi.ipmanage.entity.IpGroup;
import com.qi.ipmanage.mapper.IpGroupMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class IpGroupService extends ServiceImpl<IpGroupMapper, IpGroup> {

    public PageResult<IpGroup> page(Integer pageNum, Integer pageSize, String keyword) {
        LambdaQueryWrapper<IpGroup> wrapper = new LambdaQueryWrapper<>();
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.and(w -> w.like(IpGroup::getGroupName, keyword)
                    .or().like(IpGroup::getGroupCode, keyword));
        }
        wrapper.orderByAsc(IpGroup::getSortOrder);
        IPage<IpGroup> page = this.page(new Page<>(pageNum, pageSize), wrapper);
        return PageResult.of(page);
    }

    public List<IpGroup> listAll() {
        return this.list(new LambdaQueryWrapper<IpGroup>().orderByAsc(IpGroup::getSortOrder));
    }

    public IpGroup getByCode(String groupCode) {
        return this.getOne(new LambdaQueryWrapper<IpGroup>().eq(IpGroup::getGroupCode, groupCode));
    }
}
