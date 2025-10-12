package com.glimpse.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GlimpseApplication {

    public static void main(String[] args) {
        System.setProperty("server.port", "3001");
        SpringApplication.run(GlimpseApplication.class, args);
    }
}