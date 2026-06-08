package com.weather.controller;

import com.weather.dto.*;
import com.weather.service.WeatherService;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 菜单相关 API：首页随机天气、产品管理
 */
@RestController
@RequestMapping("/api")
public class MenuController {

    private final WeatherService weatherService;

    public MenuController(WeatherService weatherService) {
        this.weatherService = weatherService;
    }

    // ── 首页随机5个武汉区域天气 GET /api/home-weather ──
    @GetMapping("/home-weather")
    public ApiResponse homeWeather(@RequestParam(defaultValue = "5") int count) {
        WeatherResult result = weatherService.getRandomWuhanWeather(Math.min(count, 10));
        return ApiResponse.ok(result.toApiData());
    }

    // ── 产品列表 GET /api/products ─────────────────────
    @GetMapping("/products")
    public ApiResponse products() {
        return ApiResponse.ok(Map.of("products", getMockProducts(), "total", getMockProducts().size()));
    }

    // ── Mock 数据 ──────────────────────────────────────

    private static List<ProductItem> getMockProducts() {
        List<ProductItem> list = new ArrayList<>();

        list.add(new ProductItem(1, "PROD-2025-001", "数字化领导力培养方案",
                "https://picsum.photos/seed/prod1/80/60",
                "中高层管理者、技术负责人、部门经理",
                "数字化转型与管理创新",
                "武汉光谷培训基地",
                "集中培训", "线下",
                5, "active", "2025-06-15 09:00:00",
                "面向企业中高层的数字化领导力系统培养方案"));

        list.add(new ProductItem(2, "PROD-2025-002", "全栈开发人才培养计划",
                "https://picsum.photos/seed/prod2/80/60",
                "初级开发工程师、转行人员、应届毕业生",
                "Java全栈技术体系",
                "武汉软件新城",
                "混合培训", "线上+线下",
                8, "active", "2025-07-01 10:30:00",
                "从零到一培养全栈开发人才，涵盖前后端与运维"));

        list.add(new ProductItem(3, "PROD-2025-003", "AI技术应用创新方案",
                "https://picsum.photos/seed/prod3/80/60",
                "技术骨干、算法工程师、产品经理",
                "人工智能与机器学习",
                "北京中关村培训中心",
                "集中培训", "线下",
                12, "active", "2025-08-10 14:00:00",
                "AI技术在企业场景中的落地应用方案"));

        list.add(new ProductItem(4, "PROD-2025-004", "项目管理能力提升包",
                "https://picsum.photos/seed/prod4/80/60",
                "项目经理、团队Leader",
                "项目管理与敏捷实践",
                "上海浦东培训基地",
                "在线学习", "线上",
                6, "inactive", "2025-05-20 08:30:00",
                "PMP + 敏捷双重认证培训方案"));

        list.add(new ProductItem(5, "PROD-2025-005", "云计算运维体系",
                "https://picsum.photos/seed/prod5/80/60",
                "运维工程师、DevOps工程师",
                "云原生与DevOps",
                "深圳南山科技园",
                "集中培训", "线下",
                10, "active", "2025-09-01 09:00:00",
                "云原生架构下的运维体系培养方案"));

        list.add(new ProductItem(6, "PROD-2025-006", "网络安全培训体系",
                "https://picsum.photos/seed/prod6/80/60",
                "信息安全人员、IT管理人员",
                "网络安全与攻防",
                "成都高新区培训中心",
                "混合培训", "线上+线下",
                7, "active", "2025-07-15 11:00:00",
                "企业级网络安全防护体系培训"));

        return list;
    }
}
