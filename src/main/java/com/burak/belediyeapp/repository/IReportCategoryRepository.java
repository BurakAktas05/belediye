package com.burak.belediyeapp.repository;

import com.burak.belediyeapp.entity.ReportCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IReportCategoryRepository extends JpaRepository<ReportCategory, String> {

    List<ReportCategory> findAllByActiveTrue();

    boolean existsByName(String name);
}
