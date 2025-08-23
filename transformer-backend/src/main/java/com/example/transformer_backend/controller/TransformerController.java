package com.example.transformer_backend.controller;

import com.example.transformer_backend.entity.Transformer;
import com.example.transformer_backend.repository.TransformerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/transformers")
public class TransformerController {

    @Autowired
    private TransformerRepository repository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @GetMapping
    public List<Transformer> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Transformer> getById(@PathVariable Long id) {
        Optional<Transformer> transformer = repository.findById(id);
        return transformer.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public Transformer create(@RequestBody Transformer transformer) {
        return repository.save(transformer);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Transformer> update(@PathVariable Long id, @RequestBody Transformer updated) {
        Optional<Transformer> existing = repository.findById(id);
        if (existing.isPresent()) {
            Transformer t = existing.get();
            t.setNumber(updated.getNumber());
            t.setPole(updated.getPole());
            t.setRegion(updated.getRegion());
            t.setType(updated.getType());
            t.setLocation(updated.getLocation());
            t.setWeather(updated.getWeather());
            return ResponseEntity.ok(repository.save(t));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/upload-baseline")
    public ResponseEntity<String> uploadBaseline(@PathVariable Long id,
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
            Optional<Transformer> opt = repository.findById(id);
            if (opt.isPresent()) {
                Transformer t = opt.get();
                t.setBaselineImagePath("/uploads/" + fileName);
                t.setBaselineUploadDate(LocalDateTime.now());
                t.setWeather(weather);
                repository.save(t);
                return ResponseEntity.ok("Image uploaded successfully");
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Transformer not found");
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Upload failed: " + e.getMessage());
        }
    }
}
