package com.burak.belediyeapp.repository;

import com.burak.belediyeapp.entity.ReportHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IReportHistoryRepository extends JpaRepository<ReportHistory, String> {

    /**
     * Rapor ID'sine göre tüm geçmişi kronolojik sırayla getirir.
     */
    List<ReportHistory> findByReportIdOrderByCreatedAtDesc(String reportId);
}
