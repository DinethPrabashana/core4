package com.example.transformer_backend.controller;

import com.example.transformer_backend.entity.Inspection;
import com.example.transformer_backend.entity.Transformer;
import com.example.transformer_backend.repository.InspectionRepository;
import com.example.transformer_backend.repository.TransformerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/inspections")
public class InspectionController {

    @Autowired
    private InspectionRepository repository;

    @Autowired
    private TransformerRepository transformerRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    // GET all inspections
    @GetMapping
    public List<Inspection> getAll() {
        return repository.findAll();
    }

    // GET inspections for a specific transformer
    @GetMapping("/transformer/{transformerId}")
    public List<Inspection> getByTransformer(@PathVariable Long transformerId) {
        return repository.findByTransformerId(transformerId);
    }

    // POST create new inspection
    @PostMapping
    public ResponseEntity<Inspection> create(@RequestBody Inspection inspection) {
        Optional<Transformer> transformer = transformerRepository.findById(inspection.getTransformer().getId());
        if (transformer.isPresent()) {
            inspection.setTransformer(transformer.get());
            return ResponseEntity.ok(repository.save(inspection));
        }
        return ResponseEntity.badRequest().build();
    }

    // PUT update inspection
    @PutMapping("/{id}")
    public ResponseEntity<Inspection> update(@PathVariable Long id, @RequestBody Inspection updated) {
        Optional<Inspection> existing = repository.findById(id);
        if (existing.isPresent()) {
            Inspection i = existing.get();
            i.setDate(updated.getDate());
            i.setInspector(updated.getInspector());
            i.setNotes(updated.getNotes());
            i.setProgressStatus(updated.getProgressStatus());
            return ResponseEntity.ok(repository.save(i));
        }
        return ResponseEntity.notFound().build();
    }

    // DELETE inspection
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // POST upload maintenance image with weather
    @PostMapping("/{id}/upload-maintenance")
    public ResponseEntity<String> uploadMaintenance(@PathVariable Long id,
                                                   @RequestParam("file") MultipartFile file,
                                                   @RequestParam("weather") String weather) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }

        try {
            File dir = new File(uploadDir);
            if (!dir.exists()) dir.mkdirs();

            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            String filePath = uploadDir + "/" + fileName;
            file.transferTo(new File(filePath));
            Optional<Inspection> opt = repository.findById(id);
            if (opt.isPresent()) {
                Inspection i = opt.get();
                i.setMaintenanceImagePath("/uploads/" + fileName);
                i.setMaintenanceUploadDate(LocalDateTime.now());
                i.setMaintenanceWeather(weather);
                repository.save(i);
                return ResponseEntity.ok("Image uploaded successfully");
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Inspection not found");
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Upload failed: " + e.getMessage());
        }
        }
    }
