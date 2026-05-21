package com.lyston.smartseat;

import com.lyston.smartseat.reservation.ReservationRuleProperties;
import com.lyston.smartseat.seat.AutoSeatSlotPublishProperties;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@MapperScan("com.lyston.smartseat")
@EnableScheduling
@EnableConfigurationProperties({ReservationRuleProperties.class, AutoSeatSlotPublishProperties.class})
@SpringBootApplication
public class SmartSeatApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartSeatApplication.class, args);
    }
}
