package com.burak.belediyeapp.service.dashboard;

import com.burak.belediyeapp.dto.response.dashboard.DashboardStatsResponse;
import com.burak.belediyeapp.entity.ReportStatus;
import com.burak.belediyeapp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Dashboard istatistik servisi.
 * Admin ve yöneticilere özet bilgi sunar.
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final IReportRepository reportRepository;
    private final IAppUserRepository userRepository;
    private final IDepartmentRepository departmentRepository;
    private final IReportCategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        return new DashboardStatsResponse(
                reportRepository.count(),
                reportRepository.countByReportStatus(ReportStatus.PENDING),
                reportRepository.countByReportStatus(ReportStatus.PROCESSING),
                reportRepository.countByReportStatus(ReportStatus.RESOLVED),
                reportRepository.countByReportStatus(ReportStatus.REJECTED),
                userRepository.count(),
                departmentRepository.count(),
                categoryRepository.count()
        );
    }
}
