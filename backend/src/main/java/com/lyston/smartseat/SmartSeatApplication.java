package com.lyston.smartseat;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@MapperScan("com.lyston.smartseat")
@SpringBootApplication
public class SmartSeatApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartSeatApplication.class, args);
    }
}
