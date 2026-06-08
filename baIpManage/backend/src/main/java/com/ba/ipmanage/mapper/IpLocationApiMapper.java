package com.ba.ipmanage.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ba.ipmanage.entity.IpLocationApi;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface IpLocationApiMapper extends BaseMapper<IpLocationApi> {

    @Select("SELECT * FROM ip_location_api WHERE status = 1 ORDER BY priority DESC")
    List<IpLocationApi> selectAllActive();

    @Update("UPDATE ip_location_api SET used_count_today = 0, last_reset_date = #{date} WHERE last_reset_date IS NULL OR last_reset_date < #{date}")
    int resetDailyUsage(LocalDate date);
}
