package com.qi.ipmanage.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qi.ipmanage.entity.RequestLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Mapper
public interface RequestLogMapper extends BaseMapper<RequestLog> {

    @Select("SELECT DATE(create_time) as date, COUNT(*) as count FROM request_log " +
            "WHERE create_time >= #{startTime} AND create_time <= #{endTime} " +
            "GROUP BY DATE(create_time) ORDER BY date")
    List<Map<String, Object>> selectDailyRequestCount(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    @Select("SELECT requester_ip as requester, COUNT(*) as count FROM request_log " +
            "WHERE create_time >= #{startTime} AND create_time <= #{endTime} " +
            "GROUP BY requester_ip ORDER BY count DESC LIMIT #{limit}")
    List<Map<String, Object>> selectTopRequesterIps(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime, @Param("limit") Integer limit);

    @Select("SELECT proxy_ip, COUNT(*) as count FROM request_log " +
            "WHERE create_time >= #{startTime} AND create_time <= #{endTime} " +
            "GROUP BY proxy_ip ORDER BY count DESC LIMIT #{limit}")
    List<Map<String, Object>> selectTopProxyIps(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime, @Param("limit") Integer limit);

    @Select("SELECT pi.location as location, COUNT(*) as count FROM request_log rl " +
            "LEFT JOIN proxy_ip pi ON rl.proxy_ip_id = pi.id " +
            "WHERE rl.create_time >= #{startTime} AND rl.create_time <= #{endTime} " +
            "AND pi.location IS NOT NULL " +
            "GROUP BY pi.location ORDER BY count DESC LIMIT #{limit}")
    List<Map<String, Object>> selectLocationDistribution(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime, @Param("limit") Integer limit);
}
