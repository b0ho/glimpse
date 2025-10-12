package com.glimpse.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.glimpse.server.repository")
@EntityScan(basePackages = "com.glimpse.server.entity")
@EnableJpaAuditing
public class GlimpseApplication {
    
    public static void main(String[] args) {
        System.setProperty("server.port", "3001");
        SpringApplication.run(GlimpseApplication.class, args);
    }
}