package com.ba.ipmanage.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ba.ipmanage.entity.IpGroupRelation;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface IpGroupRelationMapper extends BaseMapper<IpGroupRelation> {

    @Delete("DELETE FROM ip_group_relation WHERE group_id = #{groupId} AND proxy_ip_id = #{proxyIpId}")
    int deleteByGroupAndIp(@Param("groupId") Long groupId, @Param("proxyIpId") Long proxyIpId);

    @Select("SELECT proxy_ip_id FROM ip_group_relation WHERE group_id = #{groupId}")
    List<Long> selectIpIdsByGroupId(@Param("groupId") Long groupId);

    @Delete("DELETE FROM ip_group_relation WHERE proxy_ip_id = #{proxyIpId}")
    int deleteByIpId(@Param("proxyIpId") Long proxyIpId);
}
