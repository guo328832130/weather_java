package com.weather.controller;

import com.weather.dto.*;
import com.weather.model.Product;
import com.weather.repository.ProductRepository;
import com.weather.service.WeatherService;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.criteria.Predicate;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * 菜单相关 API：首页随机天气、产品管理
 */
@RestController
@RequestMapping("/api")
public class MenuController {

    private static final String UPLOAD_DIR = "./uploads/";
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final WeatherService weatherService;
    private final ProductRepository productRepository;

    public MenuController(WeatherService weatherService, ProductRepository productRepository) {
        this.weatherService = weatherService;
        this.productRepository = productRepository;
    }

    // ── 首次启动时初始化示例数据 ──────────────────────
    @PostConstruct
    public void initSeedData() {
        if (productRepository.count() > 0) return;

        List<Product> seeds = new ArrayList<>();

        seeds.add(buildSeed("PROD-2025-001", "数字化领导力培养方案",
                "https://picsum.photos/seed/prod1/200/150、https://picsum.photos/seed/prod1b/200/150",
                "中高层管理者、技术负责人、部门经理",
                "数字化转型与管理创新",
                "武汉光谷培训基地",
                "集中培训", "线下",
                "大学", "综合", "管理岗",
                5, "published", "2025-06-15 09:00:00",
                "面向企业中高层的数字化领导力系统培养方案",
                "培养具有数字化转型视野的管理者"));

        seeds.add(buildSeed("PROD-2025-002", "全栈开发人才培养计划",
                "https://picsum.photos/seed/prod2/200/150、https://picsum.photos/seed/prod2b/200/150",
                "初级开发工程师、转行人员、应届毕业生",
                "Java全栈技术体系",
                "武汉软件新城",
                "混合培训", "线上+线下",
                "大学", "信息技术", "技术岗",
                8, "published", "2025-07-01 10:30:00",
                "从零到一培养全栈开发人才，涵盖前后端与运维",
                "从零基础到独立完成全栈项目开发"));

        seeds.add(buildSeed("PROD-2025-003", "AI技术应用创新方案",
                "https://picsum.photos/seed/prod3/200/150、https://picsum.photos/seed/prod3b/200/150",
                "技术骨干、算法工程师、产品经理",
                "人工智能与机器学习",
                "北京中关村培训中心",
                "集中培训", "线下",
                "大学", "信息技术", "技术岗",
                12, "published", "2025-08-10 14:00:00",
                "AI技术在企业场景中的落地应用方案",
                "掌握AI技术落地的核心方法论"));

        seeds.add(buildSeed("PROD-2025-004", "项目管理能力提升包",
                "https://picsum.photos/seed/prod4/200/150、https://picsum.photos/seed/prod4b/200/150",
                "项目经理、团队Leader",
                "项目管理与敏捷实践",
                "上海浦东培训基地",
                "在线学习", "线上",
                "高中", "综合", "管理岗",
                6, "unpublished", "2025-05-20 08:30:00",
                "PMP + 敏捷双重认证培训方案",
                "获得项目管理专业认证能力"));

        seeds.add(buildSeed("PROD-2025-005", "云计算运维体系",
                "https://picsum.photos/seed/prod5/200/150、https://picsum.photos/seed/prod5b/200/150",
                "运维工程师、DevOps工程师",
                "云原生与DevOps",
                "深圳南山科技园",
                "集中培训", "线下",
                "大学", "信息技术", "运营岗",
                10, "published", "2025-09-01 09:00:00",
                "云原生架构下的运维体系培养方案",
                "独立管理云原生运维体系"));

        seeds.add(buildSeed("PROD-2025-006", "网络安全培训体系",
                "https://picsum.photos/seed/prod6/200/150、https://picsum.photos/seed/prod6b/200/150",
                "信息安全人员、IT管理人员",
                "网络安全与攻防",
                "成都高新区培训中心",
                "混合培训", "线上+线下",
                "大学", "信息技术", "技术岗",
                7, "published", "2025-07-15 11:00:00",
                "企业级网络安全防护体系培训",
                "具备网络安全攻防实战能力"));

        productRepository.saveAll(seeds);
    }

    private Product buildSeed(String code, String name, String images,
                              String target, String subject, String location,
                              String type, String mode,
                              String grade, String subj, String position,
                              int hours, String status, String createdAtStr,
                              String desc, String objective) {
        Product p = new Product();
        p.setProductCode(code);
        p.setName(name);
        p.setImages(images);
        p.setTrainingTarget(target);
        p.setTrainingSubject(subject);
        p.setTrainingLocation(location);
        p.setTrainingType(type);
        p.setTrainingMode(mode);
        p.setGrade(grade);
        p.setSubject(subj);
        p.setPosition(position);
        p.setCourseCount(hours);
        p.setStatus(status);
        p.setCreatedAt(LocalDateTime.parse(createdAtStr, DATE_FMT));
        p.setDescription(desc);
        p.setTrainingObjective(objective);
        return p;
    }

    // ── 首页随机5个武汉区域天气 GET /api/home-weather ──
    @GetMapping("/home-weather")
    public ApiResponse homeWeather(@RequestParam(defaultValue = "5") int count) {
        WeatherResult result = weatherService.getRandomWuhanWeather(Math.min(count, 10));
        return ApiResponse.ok(result.toApiData());
    }

    // ── 产品列表 GET /api/products（按创建时间降序）──
    @GetMapping("/products")
    public ApiResponse products() {
        List<Product> all = productRepository.findAllByOrderByCreatedAtDesc();
        List<Map<String, Object>> productMaps = new ArrayList<>();
        for (Product p : all) {
            productMaps.add(toProductMap(p));
        }
        return ApiResponse.ok(Map.of("products", productMaps, "total", productMaps.size()));
    }

    // ── 产品筛选 POST /api/products/search（JSON body）──
    @PostMapping("/products/search")
    public ApiResponse searchProducts(@RequestBody ProductFilterRequest filter) {

        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            String name = filter.getName();
            if (name != null && !name.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%"));
            }
            String code = filter.getCode();
            if (code != null && !code.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("productCode")), "%" + code.toLowerCase() + "%"));
            }
            String trainType = filter.getTrainType();
            if (trainType != null && !trainType.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("trainingType")), "%" + trainType.toLowerCase() + "%"));
            }
            String trainMode = filter.getTrainMode();
            if (trainMode != null && !trainMode.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("trainingMode")), "%" + trainMode.toLowerCase() + "%"));
            }
            String trainSubject = filter.getTrainSubject();
            if (trainSubject != null && !trainSubject.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("trainingSubject")), "%" + trainSubject.toLowerCase() + "%"));
            }
            String grade = filter.getGrade();
            if (grade != null && !grade.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("grade")), "%" + grade.toLowerCase() + "%"));
            }
            String subject = filter.getSubject();
            if (subject != null && !subject.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("subject")), "%" + subject.toLowerCase() + "%"));
            }
            String position = filter.getPosition();
            if (position != null && !position.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("position")), "%" + position.toLowerCase() + "%"));
            }
            String trainTarget = filter.getTrainTarget();
            if (trainTarget != null && !trainTarget.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("trainingTarget")), "%" + trainTarget.toLowerCase() + "%"));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<Product> all = productRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Map<String, Object>> productMaps = new ArrayList<>();
        for (Product p : all) {
            productMaps.add(toProductMap(p));
        }
        return ApiResponse.ok(Map.of("products", productMaps, "total", productMaps.size()));
    }

    // ── 新增产品 POST /api/products ──────────────────
    @PostMapping("/products")
    public ApiResponse createProduct(@RequestBody CreateProductRequest req) {
        // 自动生成产品编号（格式: cp + 年月日时分秒）
        String code = req.getProductCode();
        if (code == null || code.isEmpty()) {
            code = "cp" + LocalDateTime.now()
                    .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        }

        Product p = new Product();
        p.setProductCode(code);
        p.setName(req.getName());
        p.setImages(req.getImages());
        p.setTrainingTarget(req.getTrainingTarget());
        p.setTrainingSubject(req.getTrainingSubject());
        p.setTrainingLocation(req.getTrainingLocation());
        p.setTrainingType(req.getTrainingType());
        p.setTrainingMode(req.getTrainingMode());
        p.setGrade(req.getGrade());
        p.setSubject(req.getSubject());
        p.setPosition(req.getPosition());
        p.setCourseCount(req.getCourseCount());
        p.setStatus(req.getStatus() != null ? req.getStatus() : "unpublished");
        p.setCreatedAt(LocalDateTime.now());
        p.setDescription(req.getDescription());
        p.setTrainingObjective(req.getTrainingObjective());

        Product saved = productRepository.save(p);
        return ApiResponse.ok(Map.of("product", toProductMap(saved)), "产品创建成功");
    }

    // ── 更新产品 PUT /api/products/{id} ──────────
    @PutMapping("/products/{id}")
    public ApiResponse updateProduct(@PathVariable Long id, @RequestBody CreateProductRequest req) {
        Optional<Product> opt = productRepository.findById(id);
        if (opt.isEmpty()) {
            return ApiResponse.fail("产品不存在", 404);
        }

        Product p = opt.get();
        p.setName(req.getName());
        p.setImages(req.getImages());
        p.setTrainingType(req.getTrainingType());
        p.setTrainingMode(req.getTrainingMode());
        p.setTrainingSubject(req.getTrainingSubject());
        p.setTrainingLocation(req.getTrainingLocation());
        p.setTrainingTarget(req.getTrainingTarget());
        p.setGrade(req.getGrade());
        p.setSubject(req.getSubject());
        p.setPosition(req.getPosition());
        p.setCourseCount(req.getCourseCount());
        p.setStatus(req.getStatus() != null ? req.getStatus() : "unpublished");
        p.setDescription(req.getDescription());
        p.setTrainingObjective(req.getTrainingObjective());

        Product saved = productRepository.save(p);
        return ApiResponse.ok(Map.of("product", toProductMap(saved)), "产品更新成功");
    }

    // ── 删除产品 DELETE /api/products/{id} ──────────
    @DeleteMapping("/products/{id}")
    public ApiResponse deleteProduct(@PathVariable Long id) {
        if (!productRepository.existsById(id)) {
            return ApiResponse.fail("产品不存在", 404);
        }
        productRepository.deleteById(id);
        return ApiResponse.ok(null, "产品已删除");
    }

    // ── 文件上传 POST /api/upload ──────────────────
    @PostMapping("/upload")
    public ApiResponse upload(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ApiResponse.fail("请选择文件", 400);
        }

        // 校验文件类型
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ApiResponse.fail("只允许上传图片文件", 400);
        }

        // 校验文件大小（最大10MB）
        if (file.getSize() > 10 * 1024 * 1024) {
            return ApiResponse.fail("图片大小不能超过10MB", 400);
        }

        try {
            // 确保上传目录存在
            File uploadDir = new File(UPLOAD_DIR);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            // 生成唯一文件名
            String originalName = file.getOriginalFilename();
            String ext = "";
            if (originalName != null && originalName.contains(".")) {
                ext = originalName.substring(originalName.lastIndexOf("."));
            }
            String filename = UUID.randomUUID().toString() + ext;
            Path filePath = Paths.get(UPLOAD_DIR, filename).normalize().toAbsolutePath();
            Files.createDirectories(filePath.getParent());
            Files.write(filePath, file.getBytes());

            String url = "/api/files/" + filename;
            return ApiResponse.ok(Map.of("url", url, "name", originalName), "上传成功");
        } catch (IOException e) {
            return ApiResponse.fail("文件上传失败: " + e.getMessage(), 500);
        }
    }

    // ── 文件访问 GET /api/files/{filename} ──────────
    @GetMapping("/files/{filename}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(UPLOAD_DIR, filename).normalize().toAbsolutePath();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                // 根据扩展名决定 Content-Type
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) contentType = "application/octet-stream";
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            }
        } catch (MalformedURLException ignored) {
        } catch (IOException ignored) {
        }
        return ResponseEntity.notFound().build();
    }

    // ── 工具方法 ──────────────────────────────────────

    /** 将 Product 实体转为前端需要的 Map */
    private Map<String, Object> toProductMap(Product p) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", p.getId());
        map.put("productCode", p.getProductCode());
        map.put("name", p.getName());
        map.put("images", p.getImages());
        map.put("trainingTarget", p.getTrainingTarget());
        map.put("trainingSubject", p.getTrainingSubject());
        map.put("trainingLocation", p.getTrainingLocation());
        map.put("trainingType", p.getTrainingType());
        map.put("trainingMode", p.getTrainingMode());
        map.put("grade", p.getGrade());
        map.put("subject", p.getSubject());
        map.put("position", p.getPosition());
        map.put("courseCount", p.getCourseCount());
        map.put("status", p.getStatus());
        map.put("createdAt", p.getCreatedAt() != null ? p.getCreatedAt().format(DATE_FMT) : null);
        map.put("description", p.getDescription());
        map.put("trainingObjective", p.getTrainingObjective());
        return map;
    }
}
