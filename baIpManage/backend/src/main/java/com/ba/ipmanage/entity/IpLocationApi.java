package com.ba.ipmanage.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("ip_location_api")
public class IpLocationApi implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String apiName;

    private String apiUrl;

    private String requestMethod;

    private String requestParams;

    private String responseParsePath;

    private String locationField;

    private String countryField;

    private String provinceField;

    private String cityField;

    private Integer dailyQuota;

    private Integer usedCountToday;

    private LocalDate lastResetDate;

    private Integer status;

    private Integer priority;

    private LocalDateTime createdTime;

    private LocalDateTime updatedTime;
}
