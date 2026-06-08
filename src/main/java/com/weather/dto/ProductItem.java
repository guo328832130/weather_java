package com.weather.dto;

/**
 * 产品库数据项
 */
public class ProductItem {
    private int id;
    private String productCode;      // 产品编号
    private String name;             // 产品名称
    private String image;            // 产品图片URL
    private String trainingTarget;   // 培训对象
    private String trainingSubject;  // 培训主题
    private String trainingLocation; // 培训地点
    private String trainingType;     // 培训类型：集中培训/在线学习/混合培训
    private String trainingMode;     // 培训模式：线上/线下/线上+线下
    private int courseCount;         // 课程数
    private String status;           // 产品状态: active / inactive
    private String createdAt;        // 创建时间
    private String description;      // 产品描述

    public ProductItem() {}

    public ProductItem(int id, String productCode, String name, String image,
                       String trainingTarget, String trainingSubject, String trainingLocation,
                       String trainingType, String trainingMode,
                       int courseCount, String status, String createdAt, String description) {
        this.id = id;
        this.productCode = productCode;
        this.name = name;
        this.image = image;
        this.trainingTarget = trainingTarget;
        this.trainingSubject = trainingSubject;
        this.trainingLocation = trainingLocation;
        this.trainingType = trainingType;
        this.trainingMode = trainingMode;
        this.courseCount = courseCount;
        this.status = status;
        this.createdAt = createdAt;
        this.description = description;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getProductCode() { return productCode; }
    public void setProductCode(String productCode) { this.productCode = productCode; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }
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
    public int getCourseCount() { return courseCount; }
    public void setCourseCount(int courseCount) { this.courseCount = courseCount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
