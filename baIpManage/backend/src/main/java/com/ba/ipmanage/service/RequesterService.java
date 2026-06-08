package com.ba.ipmanage.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ba.ipmanage.entity.PoolControl;
import com.ba.ipmanage.entity.Requester;
import com.ba.ipmanage.entity.RequesterControl;
import com.ba.ipmanage.mapper.PoolControlMapper;
import com.ba.ipmanage.mapper.RequesterControlMapper;
import com.ba.ipmanage.mapper.RequesterMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RequesterService {

    @Autowired
    private RequesterMapper requesterMapper;

    @Autowired
    private RequesterControlMapper requesterControlMapper;

    @Autowired
    private PoolControlMapper poolControlMapper;

    public Page<Requester> page(int current, int size, String keyword, Integer status) {
        LambdaQueryWrapper<Requester> wrapper = new LambdaQueryWrapper<>();
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.like(Requester::getRequesterKey, keyword)
                    .or().like(Requester::getName, keyword);
        }
        if (status != null) {
            wrapper.eq(Requester::getStatus, status);
        }
        wrapper.orderByDesc(Requester::getCreatedTime);
        return requesterMapper.selectPage(new Page<>(current, size), wrapper);
    }

    public Requester getById(Long id) {
        return requesterMapper.selectById(id);
    }

    public Requester getByKey(String key) {
        return requesterMapper.selectOne(new LambdaQueryWrapper<Requester>()
                .eq(Requester::getRequesterKey, key));
    }

    public boolean save(Requester requester) {
        if (requester.getId() == null) {
            requester.setCreatedTime(LocalDateTime.now());
            requester.setUpdatedTime(LocalDateTime.now());
            if (requester.getStatus() == null) {
                requester.setStatus(1);
            }
            if (requester.getRateLimit() == null) {
                requester.setRateLimit(0);
            }
            if (requester.getRateLimitDay() == null) {
                requester.setRateLimitDay(0);
            }
            return requesterMapper.insert(requester) > 0;
        } else {
            requester.setUpdatedTime(LocalDateTime.now());
            return requesterMapper.updateById(requester) > 0;
        }
    }

    @Transactional
    public boolean deleteById(Long id) {
        LambdaQueryWrapper<RequesterControl> rcWrapper = new LambdaQueryWrapper<>();
        rcWrapper.eq(RequesterControl::getRequesterId, id);
        requesterControlMapper.delete(rcWrapper);

        LambdaQueryWrapper<PoolControl> pcWrapper = new LambdaQueryWrapper<>();
        pcWrapper.eq(PoolControl::getRequesterId, id);
        poolControlMapper.delete(pcWrapper);

        return requesterMapper.deleteById(id) > 0;
    }

    public List<RequesterControl> getControls(Long requesterId, Integer controlType) {
        return requesterControlMapper.selectByRequesterAndType(requesterId, controlType);
    }

    @Transactional
    public boolean addControl(RequesterControl control) {
        control.setCreatedTime(LocalDateTime.now());
        return requesterControlMapper.insert(control) > 0;
    }

    @Transactional
    public boolean removeControl(Long controlId) {
        return requesterControlMapper.deleteById(controlId) > 0;
    }

    public List<PoolControl> getPoolControls(Long requesterId, Integer controlType) {
        return poolControlMapper.selectByRequesterAndType(requesterId, controlType);
    }

    @Transactional
    public boolean addPoolControl(PoolControl control) {
        control.setCreatedTime(LocalDateTime.now());
        return poolControlMapper.insert(control) > 0;
    }

    @Transactional
    public boolean removePoolControl(Long controlId) {
        return poolControlMapper.deleteById(controlId) > 0;
    }

    public boolean isTargetAllowed(Long requesterId, String target, Integer targetType) {
        List<RequesterControl> blacklist = requesterControlMapper.selectByRequesterAndType(requesterId, 1);
        List<RequesterControl> whitelist = requesterControlMapper.selectByRequesterAndType(requesterId, 2);

        if (!whitelist.isEmpty()) {
            return whitelist.stream().anyMatch(c ->
                    c.getTargetType().equals(targetType) && c.getTargetValue().equals(target)
            );
        }

        if (!blacklist.isEmpty()) {
            return blacklist.stream().noneMatch(c ->
                    c.getTargetType().equals(targetType) && c.getTargetValue().equals(target)
            );
        }

        return true;
    }
}
