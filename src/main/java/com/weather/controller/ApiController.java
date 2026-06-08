package com.weather.controller;

import com.weather.dto.*;
import com.weather.model.User;
import com.weather.repository.UserRepository;
import com.weather.service.WeatherService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api")
public class ApiController {

    private final UserRepository userRepository;
    private final WeatherService weatherService;
    private final PasswordEncoder passwordEncoder;

    public ApiController(UserRepository userRepository,
                         WeatherService weatherService,
                         PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.weatherService = weatherService;
        this.passwordEncoder = passwordEncoder;
    }

    // ── 注册 POST /api/register ────────────────────────
    @PostMapping("/register")
    public ApiResponse register(@RequestBody RegisterRequest req) {
        String username = req.getUsername();
        String password = req.getPassword();
        String confirm = req.getConfirm();

        // 校验
        String err = validateUsername(username);
        if (err != null) return ApiResponse.fail(err);
        err = validatePassword(password);
        if (err != null) return ApiResponse.fail(err);
        if (!password.equals(confirm)) return ApiResponse.fail("两次密码不一致");
        if (userRepository.existsByUsername(username)) return ApiResponse.fail("用户名已存在");

        // 创建用户
        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(password));
        userRepository.save(user);

        return ApiResponse.ok(Map.of("username", username), "注册成功");
    }

    // ── 登录 POST /api/login ──────────────────────────
    @PostMapping("/login")
    public ApiResponse login(@RequestBody LoginRequest req) {
        String username = req.getUsername();
        String password = req.getPassword();

        String err = validateUsername(username);
        if (err != null) return ApiResponse.fail(err);
        err = validatePassword(password);
        if (err != null) return ApiResponse.fail(err);

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return ApiResponse.fail("账号不存在，请检查后重试");
        if (!passwordEncoder.matches(password, user.getPasswordHash()))
            return ApiResponse.fail("密码错误，请重新输入");

        String token = user.generateToken();
        userRepository.save(user);

        return ApiResponse.ok(Map.of("token", token, "username", username), "登录成功");
    }

    // ── 登出 POST /api/logout ─────────────────────────
    @PostMapping("/logout")
    public ApiResponse logout(HttpServletRequest request) {
        User user = (User) request.getAttribute("user");
        user.setToken(null);
        user.setTokenExpires(null);
        userRepository.save(user);
        return ApiResponse.ok(null, "已退出");
    }

    // ── 当前用户 GET /api/user ────────────────────────
    @GetMapping("/user")
    public ApiResponse user(HttpServletRequest request) {
        User user = (User) request.getAttribute("user");
        Map<String, Object> data = Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "created_at", user.getCreatedAt().toString()
        );
        return ApiResponse.ok(data);
    }

    // ── 天气查询 GET /api/weather ──────────────────────
    @GetMapping("/weather")
    public ApiResponse weather(
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String district) {

        WeatherResult result;
        if (district != null && !district.isEmpty()) {
            result = weatherService.getDistrictWeather(district);
        } else if (city != null && !city.isEmpty()) {
            result = weatherService.getCityWeather(city);
        } else if (province != null && !province.isEmpty()) {
            result = weatherService.getProvinceWeather(province);
        } else {
            result = weatherService.getWuhanWeather();
        }

        return ApiResponse.ok(result.toApiData());
    }

    // ── 省份列表 GET /api/provinces ────────────────────
    @GetMapping("/provinces")
    public ApiResponse provinces() {
        return ApiResponse.ok(Map.of("provinces", weatherService.getProvinces()));
    }

    // ── 城市列表 GET /api/cities ───────────────────────
    @GetMapping("/cities")
    public ApiResponse cities(@RequestParam("province") String province) {
        return ApiResponse.ok(Map.of("cities", weatherService.getCities(province)));
    }

    // ── 区县列表 GET /api/districts ────────────────────
    @GetMapping("/districts")
    public ApiResponse districts(@RequestParam("city") String city) {
        return ApiResponse.ok(Map.of("districts", weatherService.getDistricts(city)));
    }

    // ── 校验方法 ─────────────────────────────────────

    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9]+$");
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^[a-zA-Z0-9]+$");

    private String validateUsername(String username) {
        if (username == null || username.isEmpty()) return "请输入账号";
        if (username.length() != 8) return "账号必须为 8 位";
        if (!Pattern.compile("[a-zA-Z]").matcher(username).find()) return "账号必须包含字母";
        if (!Pattern.compile("\\d").matcher(username).find()) return "账号必须包含数字";
        if (!USERNAME_PATTERN.matcher(username).matches()) return "账号只能包含字母和数字";
        return null;
    }

    private String validatePassword(String password) {
        if (password == null || password.isEmpty()) return "请输入密码";
        if (password.length() < 5) return "密码长度不够，至少5位";
        if (!Pattern.compile("[a-zA-Z]").matcher(password).find()) return "密码必须包含字母";
        if (!Pattern.compile("\\d").matcher(password).find()) return "密码必须包含数字";
        if (!PASSWORD_PATTERN.matcher(password).matches()) return "密码只能包含字母和数字";
        return null;
    }
}
