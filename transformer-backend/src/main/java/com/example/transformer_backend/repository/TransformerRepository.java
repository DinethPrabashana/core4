package com.example.transformer_backend.repository;

import com.example.transformer_backend.entity.Transformer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransformerRepository extends JpaRepository<Transformer, Long> {
}
