package com.ba.ipmanage.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ba.ipmanage.entity.ProxyIp;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface ProxyIpMapper extends BaseMapper<ProxyIp> {

    @Select("SELECT p.* FROM proxy_ip p " +
            "INNER JOIN ip_group_relation r ON p.id = r.proxy_ip_id " +
            "WHERE r.group_id = #{groupId} AND p.status = 1 " +
            "ORDER BY RAND() LIMIT #{limit}")
    List<ProxyIp> selectRandomByGroupId(@Param("groupId") Long groupId, @Param("limit") Integer limit);

    @Select("SELECT * FROM proxy_ip WHERE status = 1 ORDER BY RAND() LIMIT #{limit}")
    List<ProxyIp> selectRandomAvailable(@Param("limit") Integer limit);

    @Select("SELECT country, COUNT(*) as count FROM proxy_ip WHERE status = 1 GROUP BY country")
    List<java.util.Map<String, Object>> selectCountryDistribution();

    @Select("SELECT province, COUNT(*) as count FROM proxy_ip WHERE status = 1 AND province IS NOT NULL GROUP BY province")
    List<java.util.Map<String, Object>> selectProvinceDistribution();
}
