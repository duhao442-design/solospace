package com.qi.ipmanage.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qi.ipmanage.entity.ProxyIp;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface ProxyIpMapper extends BaseMapper<ProxyIp> {

    @Select("SELECT pi.* FROM proxy_ip pi " +
            "INNER JOIN proxy_ip_group pig ON pi.id = pig.proxy_ip_id " +
            "WHERE pi.status = 1 AND pig.group_id = #{groupId} " +
            "ORDER BY RAND() LIMIT #{limit}")
    List<ProxyIp> selectRandomByGroupId(@Param("groupId") Long groupId, @Param("limit") Integer limit);

    @Select("SELECT * FROM proxy_ip WHERE status = 1 ORDER BY RAND() LIMIT #{limit}")
    List<ProxyIp> selectRandom(@Param("limit") Integer limit);

    @Select("SELECT DISTINCT pi.* FROM proxy_ip pi " +
            "INNER JOIN proxy_ip_group pig ON pi.id = pig.proxy_ip_id " +
            "WHERE pi.status = 1 AND pig.group_id IN " +
            "<foreach collection='groupIds' item='groupId' open='(' separator=',' close=')'>" +
            "#{groupId}" +
            "</foreach> " +
            "ORDER BY RAND() LIMIT #{limit}")
    List<ProxyIp> selectRandomByGroupIds(@Param("groupIds") List<Long> groupIds, @Param("limit") Integer limit);
}
