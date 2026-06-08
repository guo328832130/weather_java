package com.weather;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class WeatherApplication {

    private final Environment environment;

    public WeatherApplication(Environment environment) {
        this.environment = environment;
    }

    public static void main(String[] args) {
        SpringApplication.run(WeatherApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        String port = environment.getProperty("server.port", "8080");
        String contextPath = environment.getProperty("server.servlet.context-path", "");
        String url = "http://localhost:" + port + contextPath;

        System.out.println();
        System.out.println("========================================");
        System.out.println("  🚀 天气查询系统启动成功！");
        System.out.println("  访问地址: " + url);
        System.out.println("  H2 控制台: " + url + "/h2-console");
        System.out.println("========================================");
        System.out.println();
    }
}
