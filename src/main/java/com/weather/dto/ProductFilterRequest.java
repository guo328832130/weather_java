package com.weather.dto;

/**
 * 产品筛选请求（JSON body）
 */
public class ProductFilterRequest {
    private String name;
    private String code;
    private String trainType;
    private String trainMode;
    private String trainSubject;
    private String grade;
    private String subject;
    private String position;
    private String trainTarget;

    public ProductFilterRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getTrainType() { return trainType; }
    public void setTrainType(String trainType) { this.trainType = trainType; }
    public String getTrainMode() { return trainMode; }
    public void setTrainMode(String trainMode) { this.trainMode = trainMode; }
    public String getTrainSubject() { return trainSubject; }
    public void setTrainSubject(String trainSubject) { this.trainSubject = trainSubject; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }
    public String getTrainTarget() { return trainTarget; }
    public void setTrainTarget(String trainTarget) { this.trainTarget = trainTarget; }
}
