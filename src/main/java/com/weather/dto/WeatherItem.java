package com.weather.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * 单条天气数据，对应前端表格中的一行
 */
public class WeatherItem {
    private String name;
    private String weather;
    @JsonProperty("weather_code")
    private int weatherCode;
    @JsonProperty("is_sunny")
    private boolean isSunny;
    @JsonProperty("temp_max")
    private Object tempMax;     // number or "--"
    @JsonProperty("temp_min")
    private Object tempMin;     // number or "--"
    private Object humidity;    // number or "--"
    @JsonProperty("wind_speed")
    private Object windSpeed;
    @JsonProperty("precip_prob")
    private int precipProb;

    public WeatherItem() {}

    // Getters & Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getWeather() { return weather; }
    public void setWeather(String weather) { this.weather = weather; }
    public int getWeatherCode() { return weatherCode; }
    public void setWeatherCode(int weatherCode) { this.weatherCode = weatherCode; }
    public boolean isSunny() { return isSunny; }
    public void setSunny(boolean sunny) { isSunny = sunny; }
    public Object getTempMax() { return tempMax; }
    public void setTempMax(Object tempMax) { this.tempMax = tempMax; }
    public Object getTempMin() { return tempMin; }
    public void setTempMin(Object tempMin) { this.tempMin = tempMin; }
    public Object getHumidity() { return humidity; }
    public void setHumidity(Object humidity) { this.humidity = humidity; }
    public Object getWindSpeed() { return windSpeed; }
    public void setWindSpeed(Object windSpeed) { this.windSpeed = windSpeed; }
    public int getPrecipProb() { return precipProb; }
    public void setPrecipProb(int precipProb) { this.precipProb = precipProb; }
}
