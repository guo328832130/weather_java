package com.weather.repository;

import com.weather.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    /** 按创建时间降序排列（最新的在前） */
    List<Product> findAllByOrderByCreatedAtDesc();
}
