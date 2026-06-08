package com.ba.ipmanage.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ba.ipmanage.entity.RequesterControl;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface RequesterControlMapper extends BaseMapper<RequesterControl> {

    @Select("SELECT * FROM requester_control WHERE requester_id = #{requesterId} AND control_type = #{controlType}")
    List<RequesterControl> selectByRequesterAndType(@Param("requesterId") Long requesterId, @Param("controlType") Integer controlType);
}
