package com.weather.service;

import com.weather.dto.WeatherItem;
import com.weather.dto.WeatherResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;

/**
 * 天气查询服务 — 对应 Python 的 weather_api.py
 * Open-Meteo 主 + wttr.in 后备，使用 ThreadPoolExecutor 并发请求
 */
@Service
public class WeatherService {

    private static final String FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
    private static final int MAX_WORKERS = 6;
    private static final Duration TIMEOUT = Duration.ofSeconds(8);

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();

    // ── WMO Weather Code → 中文描述 ─────────────────────
    private static final Map<Integer, String> WMO_CODES = Map.ofEntries(
        Map.entry(0, "晴"), Map.entry(1, "晴"), Map.entry(2, "多云"), Map.entry(3, "阴"),
        Map.entry(45, "雾"), Map.entry(48, "雾凇"),
        Map.entry(51, "小雨"), Map.entry(53, "小雨"), Map.entry(55, "中雨"),
        Map.entry(56, "冻雨"), Map.entry(57, "冻雨"),
        Map.entry(61, "小雨"), Map.entry(63, "中雨"), Map.entry(65, "大雨"),
        Map.entry(66, "冻雨"), Map.entry(67, "冻雨"),
        Map.entry(71, "小雪"), Map.entry(73, "中雪"), Map.entry(75, "大雪"), Map.entry(77, "雪粒"),
        Map.entry(80, "阵雨"), Map.entry(81, "阵雨"), Map.entry(82, "暴雨"),
        Map.entry(85, "小雪"), Map.entry(86, "大雪"),
        Map.entry(95, "雷暴"), Map.entry(96, "雷暴伴冰雹"), Map.entry(99, "雷暴伴大冰雹")
    );

    // ── 公开方法 ──────────────────────────────────────

    /** 获取武汉随机N个区天气 */
    public WeatherResult getRandomWuhanWeather(int count) {
        List<String> keys = new ArrayList<>(ChinaCitiesData.WUHAN_DISTRICTS.keySet());
        Collections.shuffle(keys);
        Map<String, double[]> selected = new LinkedHashMap<>();
        for (int i = 0; i < Math.min(count, keys.size()); i++) {
            String k = keys.get(i);
            selected.put(k, ChinaCitiesData.WUHAN_DISTRICTS.get(k));
        }
        return fetchAll(selected, "random", "武汉市(随机" + count + "区)");
    }

    /** 获取武汉各区天气（默认） */
    public WeatherResult getWuhanWeather() {
        return fetchAll(ChinaCitiesData.WUHAN_DISTRICTS, "default", "武汉市");
    }

    /** 获取指定区县天气 */
    public WeatherResult getDistrictWeather(String districtName) {
        for (var province : ChinaCitiesData.getRegions()) {
            for (var city : province.cities()) {
                if (city.hasDistricts() && city.districts().containsKey(districtName)) {
                    double[] coords = city.districts().get(districtName);
                    var item = fetchOne(coords[0], coords[1], districtName);
                    List<WeatherItem> list = item != null ? List.of(item) : List.of();
                    return new WeatherResult("district", districtName, list);
                }
            }
        }
        return new WeatherResult("district", districtName, List.of());
    }

    /** 获取指定城市天气 */
    public WeatherResult getCityWeather(String cityName) {
        for (var province : ChinaCitiesData.getRegions()) {
            for (var city : province.cities()) {
                if (!city.name().equals(cityName)) continue;

                if (city.hasDistricts()) {
                    return fetchAll(city.districts(), "city", cityName);
                }
                var item = fetchOne(city.coords()[0], city.coords()[1], cityName);
                List<WeatherItem> list = item != null ? List.of(item) : List.of();
                return new WeatherResult("city", cityName, list);
            }
        }
        return new WeatherResult("city", cityName, List.of());
    }

    /** 获取指定省份天气（取省会城市） */
    public WeatherResult getProvinceWeather(String provinceName) {
        for (var province : ChinaCitiesData.getRegions()) {
            if (!province.name().equals(provinceName)) continue;
            if (province.cities().isEmpty()) break;
            return getCityWeather(province.cities().get(0).name());
        }
        return new WeatherResult("province", provinceName, List.of());
    }

    // ── 省份/城市/区县列表查询 ─────────────────────────

    public List<Map<String, String>> getProvinces() {
        return ChinaCitiesData.getRegions().stream()
                .map(p -> Map.of("name", p.name()))
                .toList();
    }

    public List<Map<String, Object>> getCities(String provinceName) {
        for (var p : ChinaCitiesData.getRegions()) {
            if (p.name().equals(provinceName)) {
                return p.cities().stream()
                        .map(c -> Map.<String, Object>of(
                                "name", c.name(),
                                "has_districts", c.hasDistricts()
                        ))
                        .toList();
            }
        }
        return List.of();
    }

    public List<String> getDistricts(String cityName) {
        for (var p : ChinaCitiesData.getRegions()) {
            for (var c : p.cities()) {
                if (c.name().equals(cityName) && c.hasDistricts()) {
                    return new ArrayList<>(c.districts().keySet());
                }
            }
        }
        return List.of();
    }

    // ── 内部方法 ──────────────────────────────────────

    /** 并发获取多个地点天气 */
    private WeatherResult fetchAll(Map<String, double[]> tasks, String type, String name) {
        if (tasks.isEmpty()) {
            return new WeatherResult(type, name, List.of());
        }

        // 只有一个任务，直接调用
        if (tasks.size() == 1) {
            var entry = tasks.entrySet().iterator().next();
            var item = fetchOne(entry.getValue()[0], entry.getValue()[1], entry.getKey());
            List<WeatherItem> list = item != null ? List.of(item) : List.of();
            return new WeatherResult(type, name, list);
        }

        // 并发请求
        List<WeatherItem> results = new ArrayList<>();
        int workers = Math.min(MAX_WORKERS, tasks.size());
        var executor = Executors.newFixedThreadPool(workers);
        try {
            List<CompletableFuture<WeatherItem>> futures = new ArrayList<>();
            for (var entry : tasks.entrySet()) {
                futures.add(CompletableFuture.supplyAsync(
                        () -> fetchOne(entry.getValue()[0], entry.getValue()[1], entry.getKey()),
                        executor
                ));
            }
            for (var future : futures) {
                try {
                    WeatherItem item = future.get();
                    if (item != null) results.add(item);
                } catch (Exception ignored) { }
            }
        } finally {
            executor.shutdown();
        }
        return new WeatherResult(type, name, results);
    }

    /** 获取单个地点天气：优先 Open-Meteo，失败则用 wttr.in */
    private WeatherItem fetchOne(double lat, double lon, String name) {
        WeatherItem item = fetchOpenMeteo(lat, lon, name);
        if (item != null) return item;
        return fetchWttr(name);
    }

    /** Open-Meteo 天气查询（最多重试2次） */
    private WeatherItem fetchOpenMeteo(double lat, double lon, String name) {
        for (int attempt = 0; attempt < 2; attempt++) {
            try {
                String url = String.format(
                        "%s?latitude=%s&longitude=%s&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,relative_humidity_2m_max&timezone=Asia/Shanghai&forecast_days=1",
                        FORECAST_URL, lat, lon);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .timeout(TIMEOUT)
                        .header("User-Agent", "WeatherApp-Java/1.0")
                        .GET()
                        .build();

                HttpResponse<String> resp = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (resp.statusCode() != 200) continue;

                JsonNode root = mapper.readTree(resp.body());
                JsonNode daily = root.get("daily");
                if (daily == null) continue;

                int code = daily.get("weather_code").get(0).asInt();
                WeatherItem item = new WeatherItem();
                item.setName(name);
                item.setWeather(WMO_CODES.getOrDefault(code, "未知(" + code + ")"));
                item.setWeatherCode(code);
                item.setSunny(code == 0 || code == 1);
                item.setTempMax(daily.get("temperature_2m_max").get(0).asDouble());
                item.setTempMin(daily.get("temperature_2m_min").get(0).asDouble());
                item.setHumidity(safeDouble(daily, "relative_humidity_2m_max", 0));
                item.setWindSpeed(safeDouble(daily, "wind_speed_10m_max", 0));
                item.setPrecipProb(safeInt(daily, "precipitation_probability_max", 0));
                return item;

            } catch (Exception e) {
                if (attempt == 0) {
                    try { Thread.sleep(500); } catch (InterruptedException ignored) { }
                }
            }
        }
        return null;
    }

    /** wttr.in 后备天气查询 */
    private WeatherItem fetchWttr(String cityName) {
        try {
            String url = "https://wttr.in/" + cityName + "?format=j1";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(TIMEOUT)
                    .header("User-Agent", "WeatherApp-Java/1.0")
                    .GET()
                    .build();

            HttpResponse<String> resp = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) return null;

            JsonNode root = mapper.readTree(resp.body());
            JsonNode cc = root.path("current_condition").path(0);
            if (cc.isMissingNode()) return null;

            String weatherText = cc.path("weatherDesc").path(0).path("value").asText("未知");
            String tempC = cc.path("temp_C").asText("--");
            String humidity = cc.path("humidity").asText("--");
            String feelsLike = cc.path("FeelsLikeC").asText("--");

            WeatherItem item = new WeatherItem();
            item.setName(cityName);
            item.setWeather(weatherText);
            item.setWeatherCode(-1);
            item.setSunny(weatherText.contains("晴") || weatherText.contains("Sunny") || weatherText.contains("Clear"));
            item.setTempMax(cc.has("maxtempC") ? cc.get("maxtempC").asText() : tempC);
            item.setTempMin(cc.has("mintempC") ? cc.get("mintempC").asText() : feelsLike);
            item.setHumidity(humidity);
            item.setWindSpeed(cc.path("windspeedKmph").asText("--"));
            item.setPrecipProb(0);
            return item;

        } catch (Exception e) {
            return null;
        }
    }

    // ── JSON 辅助方法 ─────────────────────────────────

    private Object safeDouble(JsonNode node, String field, int index) {
        try {
            JsonNode arr = node.get(field);
            if (arr != null && arr.isArray() && arr.size() > index) {
                JsonNode val = arr.get(index);
                if (val.isNull()) return "--";
                return val.asDouble();
            }
        } catch (Exception ignored) { }
        return "--";
    }

    private int safeInt(JsonNode node, String field, int index) {
        try {
            JsonNode arr = node.get(field);
            if (arr != null && arr.isArray() && arr.size() > index && !arr.get(index).isNull()) {
                return arr.get(index).asInt();
            }
        } catch (Exception ignored) { }
        return 0;
    }
}
