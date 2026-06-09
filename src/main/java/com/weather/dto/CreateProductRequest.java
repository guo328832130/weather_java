package com.weather.dto;

/**
 * 创建产品请求
 */
public class CreateProductRequest {
    private String productCode;
    private String name;
    private String images;
    private String trainingTarget;
    private String trainingSubject;
    private String trainingLocation;
    private String trainingType;
    private String trainingMode;
    private String grade;
    private String subject;
    private String position;
    private int courseCount;
    private String status;
    private String description;
    private String trainingObjective;

    public CreateProductRequest() {}

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
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getTrainingObjective() { return trainingObjective; }
    public void setTrainingObjective(String trainingObjective) { this.trainingObjective = trainingObjective; }
}
