package com.weather.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_code", length = 50)
    private String productCode;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 1000)
    private String images;

    @Column(name = "training_target", length = 500)
    private String trainingTarget;

    @Column(name = "training_subject", length = 500)
    private String trainingSubject;

    @Column(name = "training_location", length = 200)
    private String trainingLocation;

    @Column(name = "training_type", length = 50)
    private String trainingType;

    @Column(name = "training_mode", length = 50)
    private String trainingMode;

    @Column(length = 100)
    private String grade;

    @Column(length = 100)
    private String subject;

    @Column(length = 100)
    private String position;

    @Column(name = "course_count")
    private int courseCount;

    @Column(length = 30)
    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "training_objective", columnDefinition = "TEXT")
    private String trainingObjective;

    public Product() {}

    // ── Getters & Setters ──

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getTrainingObjective() { return trainingObjective; }
    public void setTrainingObjective(String trainingObjective) { this.trainingObjective = trainingObjective; }
}
