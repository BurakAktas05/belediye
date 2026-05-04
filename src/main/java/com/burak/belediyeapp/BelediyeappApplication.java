package com.burak.belediyeapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * İBB Vatandaş Şikayet ve Takip Platformu
 *
 * @EnableAsync: NotificationService'in async metodları için gerekli
 */
@SpringBootApplication
@EnableAsync
@org.springframework.cache.annotation.EnableCaching
@org.springframework.scheduling.annotation.EnableScheduling
public class BelediyeappApplication {

    public static void main(String[] args) {
        SpringApplication.run(BelediyeappApplication.class, args);
    }
}
