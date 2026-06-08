package com.ba.ipmanage.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ba.ipmanage.entity.IpGroup;
import com.ba.ipmanage.entity.IpGroupRelation;
import com.ba.ipmanage.mapper.IpGroupMapper;
import com.ba.ipmanage.mapper.IpGroupRelationMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class IpGroupService {

    @Autowired
    private IpGroupMapper ipGroupMapper;

    @Autowired
    private IpGroupRelationMapper ipGroupRelationMapper;

    public Page<IpGroup> page(int current, int size, String keyword) {
        LambdaQueryWrapper<IpGroup> wrapper = new LambdaQueryWrapper<>();
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.like(IpGroup::getGroupName, keyword)
                    .or().like(IpGroup::getGroupCode, keyword);
        }
        wrapper.orderByDesc(IpGroup::getCreatedTime);
        return ipGroupMapper.selectPage(new Page<>(current, size), wrapper);
    }

    public List<IpGroup> list() {
        return ipGroupMapper.selectList(null);
    }

    public IpGroup getById(Long id) {
        return ipGroupMapper.selectById(id);
    }

    public boolean save(IpGroup ipGroup) {
        if (ipGroup.getId() == null) {
            ipGroup.setCreatedTime(LocalDateTime.now());
            ipGroup.setUpdatedTime(LocalDateTime.now());
            return ipGroupMapper.insert(ipGroup) > 0;
        } else {
            ipGroup.setUpdatedTime(LocalDateTime.now());
            return ipGroupMapper.updateById(ipGroup) > 0;
        }
    }

    @Transactional
    public boolean deleteById(Long id) {
        LambdaQueryWrapper<IpGroupRelation> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(IpGroupRelation::getGroupId, id);
        ipGroupRelationMapper.delete(wrapper);
        return ipGroupMapper.deleteById(id) > 0;
    }

    @Transactional
    public boolean addIpToGroup(Long groupId, Long ipId) {
        LambdaQueryWrapper<IpGroupRelation> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(IpGroupRelation::getGroupId, groupId)
                .eq(IpGroupRelation::getProxyIpId, ipId);
        if (ipGroupRelationMapper.selectCount(wrapper) > 0) {
            return true;
        }
        IpGroupRelation relation = new IpGroupRelation();
        relation.setGroupId(groupId);
        relation.setProxyIpId(ipId);
        relation.setCreatedTime(LocalDateTime.now());
        return ipGroupRelationMapper.insert(relation) > 0;
    }

    @Transactional
    public boolean batchAddIpToGroup(Long groupId, List<Long> ipIds) {
        for (Long ipId : ipIds) {
            addIpToGroup(groupId, ipId);
        }
        return true;
    }

    @Transactional
    public boolean removeIpFromGroup(Long groupId, Long ipId) {
        return ipGroupRelationMapper.deleteByGroupAndIp(groupId, ipId) > 0;
    }

    public List<Long> getIpIdsByGroupId(Long groupId) {
        return ipGroupRelationMapper.selectIpIdsByGroupId(groupId);
    }

    @Transactional
    public boolean removeIpFromAllGroups(Long ipId) {
        return ipGroupRelationMapper.deleteByIpId(ipId) > 0;
    }
}
