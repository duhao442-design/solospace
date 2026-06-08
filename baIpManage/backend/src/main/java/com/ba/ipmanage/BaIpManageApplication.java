package com.ba.ipmanage;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@MapperScan("com.ba.ipmanage.mapper")
public class BaIpManageApplication {

    public static void main(String[] args) {
        SpringApplication.run(BaIpManageApplication.class, args);
    }
}
