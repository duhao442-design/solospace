package com.qi.ipmanage;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@MapperScan("com.qi.ipmanage.mapper")
@EnableScheduling
public class IpManageApplication {

    public static void main(String[] args) {
        SpringApplication.run(IpManageApplication.class, args);
    }
}
