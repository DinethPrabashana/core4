package com.example.transformer_backend.repository;

import com.example.transformer_backend.entity.Inspection;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InspectionRepository extends JpaRepository<Inspection, Long> {
    List<Inspection> findByTransformerId(Long transformerId);
}
