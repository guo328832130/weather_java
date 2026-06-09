package com.weather.dto;

/**
 * 产品库数据项
 */
public class ProductItem {
    private int id;
    private String productCode;      // 产品编号
    private String name;             // 产品名称
    private String images;           // 产品图片URL（多张用、分隔）
    private String trainingTarget;   // 培训对象
    private String trainingSubject;  // 培训主题
    private String trainingLocation; // 培训地点
    private String trainingType;     // 培训类型：集中培训/在线学习/混合培训
    private String trainingMode;     // 培训模式：线上/线下/线上+线下
    private String grade;            // 适用学段：小学/初中/高中/大学/成人
    private String subject;          // 适用学科：语文/数学/英语/信息技术/综合
    private String position;         // 适用岗位：管理岗/技术岗/运营岗/销售岗/全员
    private int courseCount;         // 课程学时
    private String status;           // 产品状态: published / unpublished
    private String createdAt;        // 创建时间
    private String description;      // 产品描述
    private String trainingObjective; // 培训目标

    public ProductItem() {}

    public ProductItem(int id, String productCode, String name, String images,
                       String trainingTarget, String trainingSubject, String trainingLocation,
                       String trainingType, String trainingMode,
                       String grade, String subject, String position,
                       int courseCount, String status, String createdAt, String description,
                       String trainingObjective) {
        this.id = id;
        this.productCode = productCode;
        this.name = name;
        this.images = images;
        this.trainingTarget = trainingTarget;
        this.trainingSubject = trainingSubject;
        this.trainingLocation = trainingLocation;
        this.trainingType = trainingType;
        this.trainingMode = trainingMode;
        this.grade = grade;
        this.subject = subject;
        this.position = position;
        this.courseCount = courseCount;
        this.status = status;
        this.createdAt = createdAt;
        this.description = description;
        this.trainingObjective = trainingObjective;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getProductCode() { return productCode; }
    public void setProductCode(String productCode) { this.productCode = productCode; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getImages() { return images; }
    public void setImages(String images) { this.images = images; }
    public String getTrainingTarget() { return trainingTarget; }
    public void setTrainingTarget(String trainingTarget) { this.trainingTarget = trainingTarget; }
    public String getTrainingSubject() { return trainingSubject; }
    public void setTrainingSubject(String trainingSubject) { this.trainingSubject = trainingSubject; }
    public String getTrainingLocation() { return trainingLocation; }
    public void setTrainingLocation(String trainingLocation) { this.trainingLocation = trainingLocation; }
    public String getTrainingType() { return trainingType; }
    public void setTrainingType(String trainingType) { this.trainingType = trainingType; }
    public String getTrainingMode() { return trainingMode; }
    public void setTrainingMode(String trainingMode) { this.trainingMode = trainingMode; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }
    public int getCourseCount() { return courseCount; }
    public void setCourseCount(int courseCount) { this.courseCount = courseCount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getTrainingObjective() { return trainingObjective; }
    public void setTrainingObjective(String trainingObjective) { this.trainingObjective = trainingObjective; }
}
