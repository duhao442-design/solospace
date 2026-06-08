package com.ba.ipmanage.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ba.ipmanage.entity.RequestLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Mapper
public interface RequestLogMapper extends BaseMapper<RequestLog> {

    @Select("SELECT DATE(request_time) as date, COUNT(*) as count FROM request_log " +
            "WHERE request_time >= #{startTime} AND request_time <= #{endTime} " +
            "GROUP BY DATE(request_time) ORDER BY date")
    List<Map<String, Object>> selectDailyRequestCount(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    @Select("SELECT requester_ip, COUNT(*) as count FROM request_log " +
            "WHERE request_time >= #{startTime} AND request_time <= #{endTime} " +
            "GROUP BY requester_ip ORDER BY count DESC LIMIT #{limit}")
    List<Map<String, Object>> selectRequesterDistribution(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime, @Param("limit") Integer limit);

    @Select("SELECT proxy_ip, COUNT(*) as count FROM request_log " +
            "WHERE request_time >= #{startTime} AND request_time <= #{endTime} AND proxy_ip IS NOT NULL " +
            "GROUP BY proxy_ip ORDER BY count DESC LIMIT #{limit}")
    List<Map<String, Object>> selectProxyIpDistribution(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime, @Param("limit") Integer limit);
}
