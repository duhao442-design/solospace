package com.qi.ipmanage.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qi.ipmanage.entity.ProxyIpGroup;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface ProxyIpGroupMapper extends BaseMapper<ProxyIpGroup> {

    @Select("SELECT group_id FROM proxy_ip_group WHERE proxy_ip_id = #{proxyIpId}")
    List<Long> selectGroupIdsByProxyIpId(@Param("proxyIpId") Long proxyIpId);

    @Select("SELECT proxy_ip_id FROM proxy_ip_group WHERE group_id = #{groupId}")
    List<Long> selectProxyIpIdsByGroupId(@Param("groupId") Long groupId);
}
