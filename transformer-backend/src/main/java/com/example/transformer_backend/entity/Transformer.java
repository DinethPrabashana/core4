package com.example.transformer_backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Transformer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String number;
    private String pole;
    private String region;
    private String type;
    private String location;
    private String baselineImagePath;
    private LocalDateTime baselineUploadDate;
    private String weather;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNumber() { return number; }
    public void setNumber(String number) { this.number = number; }
    public String getPole() { return pole; }
    public void setPole(String pole) { this.pole = pole; }
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getBaselineImagePath() { return baselineImagePath; }
    public void setBaselineImagePath(String baselineImagePath) { this.baselineImagePath = baselineImagePath; }
    public LocalDateTime getBaselineUploadDate() { return baselineUploadDate; }
    public void setBaselineUploadDate(LocalDateTime baselineUploadDate) { this.baselineUploadDate = baselineUploadDate; }
    public String getWeather() { return weather; }
    public void setWeather(String weather) { this.weather = weather; }
}
