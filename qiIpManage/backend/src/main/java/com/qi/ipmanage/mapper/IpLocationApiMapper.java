package com.qi.ipmanage.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qi.ipmanage.entity.IpLocationApi;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface IpLocationApiMapper extends BaseMapper<IpLocationApi> {

    @Select("SELECT * FROM ip_location_api WHERE status = 1 ORDER BY priority DESC")
    List<IpLocationApi> selectEnabledList();
}
