package com.weather.dto;

import java.util.List;
import java.util.Map;

/**
 * 天气查询结果包装
 */
public class WeatherResult {
    private final String type;
    private final String name;
    private final List<WeatherItem> weatherData;
    private final int total;

    public WeatherResult(String type, String name, List<WeatherItem> weatherData) {
        this.type = type;
        this.name = name;
        this.weatherData = weatherData;
        this.total = weatherData.size();
    }

    /** 返回给前端的数据格式 */
    public Map<String, Object> toApiData() {
        return Map.of(
            "weather_data", weatherData,
            "query_info", Map.of("type", type, "name", name),
            "total", total
        );
    }

    public String getType() { return type; }
    public String getName() { return name; }
    public List<WeatherItem> getWeatherData() { return weatherData; }
    public int getTotal() { return total; }
}
