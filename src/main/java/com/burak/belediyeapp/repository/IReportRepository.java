package com.burak.belediyeapp.repository;

import com.burak.belediyeapp.entity.Report;
import com.burak.belediyeapp.entity.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IReportRepository extends JpaRepository<Report, String> {

    /**
     * Vatandaşın kendi raporlarını sayfalanmış olarak getirir.
     */
    Page<Report> findByReporterId(String reporterId, Pageable pageable);

    /**
     * Belirli bir saha görevlisine atanmış raporları getirir.
     */
    Page<Report> findByAssigneeId(String assigneeId, Pageable pageable);

    /**
     * Duruma göre filtreli rapor listesi (admin paneli için).
     */
    Page<Report> findByReportStatus(ReportStatus status, Pageable pageable);

    /**
     * Departmana göre raporları getirir (birim müdürü görünümü).
     */
    Page<Report> findByCategoryDepartmentId(String departmentId, Pageable pageable);

    /**
     * PostGIS ile belirtilen koordinat merkezine belirli bir yarıçap (metre)
     * içindeki raporları getirir. Saha ekibinin yakındaki sorunları görmesi için.
     *
     * ST_DWithin fonksiyonu coğrafi (metre cinsinden) mesafe kontrolü yapar.
     */
    @Query(value = """
            SELECT r.* FROM reports r
            WHERE ST_DWithin(
                r.location::geography,
                ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
                :radiusInMeters
            )
            ORDER BY ST_Distance(
                r.location::geography,
                ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
            )
            """, nativeQuery = true)
    List<Report> findNearbyReports(
            @Param("latitude") double latitude,
            @Param("longitude") double longitude,
            @Param("radiusInMeters") double radiusInMeters
    );

    /**
     * Kategori bazlı istatistik — yönetim dashboard'u için.
     */
    long countByReportStatus(ReportStatus status);
}
