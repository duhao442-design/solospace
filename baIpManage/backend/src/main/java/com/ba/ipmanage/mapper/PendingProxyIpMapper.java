package com.ba.ipmanage.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ba.ipmanage.entity.PendingProxyIp;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface PendingProxyIpMapper extends BaseMapper<PendingProxyIp> {

    @Select("SELECT * FROM pending_proxy_ip WHERE status = 0 ORDER BY id ASC LIMIT #{limit}")
    List<PendingProxyIp> selectPendingList(@Param("limit") Integer limit);

    @Update("UPDATE pending_proxy_ip SET status = 1 WHERE id = #{id}")
    int updateStatusValidating(@Param("id") Long id);

    @Update("UPDATE pending_proxy_ip SET status = 2 WHERE id = #{id}")
    int updateStatusCompleted(@Param("id") Long id);
}
