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
    public DashboardStatsResponse getStats(com.burak.belediyeapp.entity.AppUser user) {
        String district = user.getDistrict();
        boolean isSuperAdmin = user.hasRole("ROLE_SUPER_ADMIN");

        if (district != null && !isSuperAdmin) {
            return new DashboardStatsResponse(
                    reportRepository.countByDistrictAndReportStatus(district, ReportStatus.PENDING) +
                    reportRepository.countByDistrictAndReportStatus(district, ReportStatus.PROCESSING) +
                    reportRepository.countByDistrictAndReportStatus(district, ReportStatus.RESOLVED) +
                    reportRepository.countByDistrictAndReportStatus(district, ReportStatus.REJECTED),
                    reportRepository.countByDistrictAndReportStatus(district, ReportStatus.PENDING),
                    reportRepository.countByDistrictAndReportStatus(district, ReportStatus.PROCESSING),
                    reportRepository.countByDistrictAndReportStatus(district, ReportStatus.RESOLVED),
                    reportRepository.countByDistrictAndReportStatus(district, ReportStatus.REJECTED),
                    userRepository.count(), // Bu kısım hala genel kalabilir veya ilçeye göre filtrelenebilir
                    departmentRepository.count(),
                    categoryRepository.count()
            );
        }

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
