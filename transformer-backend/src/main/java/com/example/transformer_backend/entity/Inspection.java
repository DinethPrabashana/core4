package com.example.transformer_backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Inspection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "transformer_id")
    private Transformer transformer;
    private LocalDateTime date;
    private String inspector;
    private String notes;
    private String maintenanceImagePath;
    private LocalDateTime maintenanceUploadDate;
    private String maintenanceWeather;
    private String progressStatus;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Transformer getTransformer() { return transformer; }
    public void setTransformer(Transformer transformer) { this.transformer = transformer; }
    public LocalDateTime getDate() { return date; }
    public void setDate(LocalDateTime date) { this.date = date; }
    public String getInspector() { return inspector; }
    public void setInspector(String inspector) { this.inspector = inspector; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getMaintenanceImagePath() { return maintenanceImagePath; }
    public void setMaintenanceImagePath(String maintenanceImagePath) { this.maintenanceImagePath = maintenanceImagePath; }
    public LocalDateTime getMaintenanceUploadDate() { return maintenanceUploadDate; }
    public void setMaintenanceUploadDate(LocalDateTime maintenanceUploadDate) { this.maintenanceUploadDate = maintenanceUploadDate; }
    public String getMaintenanceWeather() { return maintenanceWeather; }
    public void setMaintenanceWeather(String maintenanceWeather) { this.maintenanceWeather = maintenanceWeather; }
    public String getProgressStatus() { return progressStatus; }
    public void setProgressStatus(String progressStatus) { this.progressStatus = progressStatus; }
}
