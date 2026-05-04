package com.burak.belediyeapp.service.report;

import com.burak.belediyeapp.dto.request.report.AssignReportRequest;
import com.burak.belediyeapp.dto.request.report.CreateReportRequest;
import com.burak.belediyeapp.dto.request.report.UpdateReportStatusRequest;
import com.burak.belediyeapp.dto.response.report.ReportListResponse;
import com.burak.belediyeapp.dto.response.report.ReportResponse;
import com.burak.belediyeapp.entity.*;
import com.burak.belediyeapp.exception.BusinessException;
import com.burak.belediyeapp.exception.ResourceNotFoundException;
import com.burak.belediyeapp.mapper.IReportMapper;
import com.burak.belediyeapp.repository.IAppUserRepository;
import com.burak.belediyeapp.repository.IReportCategoryRepository;
import com.burak.belediyeapp.repository.IReportHistoryRepository;
import com.burak.belediyeapp.repository.IReportRepository;
import com.burak.belediyeapp.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Rapor iş mantığı servisi.
 * Her metodun kimin çağırabileceği @PreAuthorize ile tanımlanmıştır.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final IReportRepository reportRepository;
    private final IReportCategoryRepository categoryRepository;
    private final IAppUserRepository userRepository;
    private final IReportHistoryRepository historyRepository;
    private final IReportMapper reportMapper;
    private final NotificationService notificationService;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;
    private final com.burak.belediyeapp.service.ai.GeminiService geminiService;

    // ===================================================
    // VATANDAŞ: Rapor Oluşturma
    // ===================================================

    @Transactional
    @PreAuthorize("hasRole('ROLE_CITIZEN')")
    @com.burak.belediyeapp.audit.AuditAction(action = "REPORT_CREATE", description = "Yeni bir vatandaş raporu oluşturuldu")
    public ReportResponse createReport(CreateReportRequest request, AppUser reporter) {
        ReportCategory category = categoryRepository.findById(request.categoryId())
                .filter(ReportCategory::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Kategori", "id", request.categoryId()));

        Report report = reportMapper.toEntity(request);
        report.setCategory(category);
        report.setReporter(reporter);
        report.setDistrict(request.district());

        Report saved = reportRepository.save(report);

        // Medya linklerini kaydet
        if (request.mediaUrls() != null && !request.mediaUrls().isEmpty()) {
            List<ReportMedia> mediaList = request.mediaUrls().stream()
                    .map(url -> ReportMedia.builder()
                            .imageUrl(url)
                            .report(saved)
                            .build())
                    .toList();
            saved.getMediaList().addAll(mediaList);
            reportRepository.save(saved);
        }

        // Live Dashboard için WebSocket bildirimi gönder
        messagingTemplate.convertAndSend("/topic/reports", reportMapper.toResponse(saved));

        // AI Analizini başlat (Asenkron)
        performAiAnalysis(saved.getId());

        log.info("Yeni rapor oluşturuldu: {} — Kullanıcı: {}", saved.getId(), reporter.getEmail());

        return reportMapper.toResponse(saved);
    }

    // ===================================================
    // VATANDAŞ: Kendi Raporlarını Görüntüleme
    // ===================================================

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ROLE_CITIZEN')")
    public Page<ReportListResponse> getMyReports(AppUser user, Pageable pageable) {
        return reportRepository.findByReporterId(user.getId(), pageable)
                .map(reportMapper::toListResponse);
    }

    // ===================================================
    // SAHA EKİBİ / YÖNETİM: Rapor Listeleme
    // ===================================================

    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('ROLE_FIELD_OFFICER','ROLE_DEPT_MANAGER','ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    public Page<ReportListResponse> getAllReports(AppUser user, Pageable pageable) {
        if (user.getDistrict() != null && !user.hasRole("ROLE_SUPER_ADMIN")) {
            return reportRepository.findByDistrict(user.getDistrict(), pageable)
                    .map(reportMapper::toListResponse);
        }
        return reportRepository.findAll(pageable)
                .map(reportMapper::toListResponse);
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('ROLE_FIELD_OFFICER','ROLE_DEPT_MANAGER','ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    public Page<ReportListResponse> getReportsByStatus(ReportStatus status, AppUser user, Pageable pageable) {
        if (user.getDistrict() != null && !user.hasRole("ROLE_SUPER_ADMIN")) {
            return reportRepository.findByDistrictAndReportStatus(user.getDistrict(), status, pageable)
                    .map(reportMapper::toListResponse);
        }
        return reportRepository.findByReportStatus(status, pageable)
                .map(reportMapper::toListResponse);
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('ROLE_DEPT_MANAGER','ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    public Page<ReportListResponse> getReportsByDepartment(String departmentId, Pageable pageable) {
        return reportRepository.findByCategoryDepartmentId(departmentId, pageable)
                .map(reportMapper::toListResponse);
    }

    // ===================================================
    // RAPOR DETAYI
    // ===================================================

    @Transactional(readOnly = true)
    public ReportResponse getReportById(String reportId, AppUser currentUser) {
        Report report = findReportOrThrow(reportId);
        ensureCanViewReport(report, currentUser);
        return reportMapper.toResponse(report);
    }

    // ===================================================
    // SAHA EKİBİ / YÖNETİM: Durum Güncelleme
    // ===================================================

    @Transactional
    @PreAuthorize("hasAnyRole('ROLE_FIELD_OFFICER', 'ROLE_DEPT_MANAGER', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    @com.burak.belediyeapp.audit.AuditAction(action = "REPORT_STATUS_UPDATE", description = "Rapor durumu güncellendi")
    public ReportResponse updateReportStatus(String reportId, UpdateReportStatusRequest request, AppUser currentUser) {
        Report report = findReportOrThrow(reportId);

        // İş kuralı: RESOLVED ve REJECTED raporlar tekrar güncellenemez
        if (report.getReportStatus() == ReportStatus.RESOLVED
                || report.getReportStatus() == ReportStatus.REJECTED) {
            throw new BusinessException(
                    "Kapatılmış bir raporun durumu değiştirilemez",
                    "REPORT_ALREADY_CLOSED");
        }

        ReportStatus oldStatus = report.getReportStatus();
        report.setReportStatus(request.status());

        // Tarihçe kaydı
        ReportHistory history = ReportHistory.builder()
                .report(report)
                .oldStatus(oldStatus)
                .newStatus(request.status())
                .changedBy(updatedBy)
                .note(request.note())
                .build();
        historyRepository.save(history);

        Report saved = reportRepository.save(report);

        // Vatandaşa bildirim gönder
        notificationService.notifyReportStatusChanged(saved);

        log.info("Rapor durumu güncellendi: {} — {} → {}", reportId, oldStatus, request.status());
        return reportMapper.toResponse(saved);
    }

    // ===================================================
    // BİRİM MÜDÜRÜ: Saha Ekibi Atama
    // ===================================================

    @Transactional
    @PreAuthorize("hasAnyRole('ROLE_DEPT_MANAGER','ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    public ReportResponse assignReport(String reportId, AssignReportRequest request, AppUser assignedBy) {
        Report report = findReportOrThrow(reportId);

        AppUser assignee = userRepository.findById(request.assigneeId())
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı", "id", request.assigneeId()));

        // İş kuralı: sadece saha görevlisi atanabilir
        if (!assignee.hasRole("ROLE_FIELD_OFFICER")) {
            throw new BusinessException(
                    "Yalnızca saha görevlisi olan kullanıcılar atanabilir",
                    "INVALID_ASSIGNEE_ROLE");
        }

        report.setAssignee(assignee);

        // Rapor PENDING'den PROCESSING'e geçer
        if (report.getReportStatus() == ReportStatus.PENDING) {
            ReportStatus oldStatus = report.getReportStatus();
            report.setReportStatus(ReportStatus.PROCESSING);

            historyRepository.save(ReportHistory.builder()
                    .report(report)
                    .oldStatus(oldStatus)
                    .newStatus(ReportStatus.PROCESSING)
                    .changedBy(assignedBy)
                    .note("Saha görevlisi atandı: " + assignee.getFullName())
                    .build());
        }

        Report saved = reportRepository.save(report);

        // Saha görevlisine bildirim gönder
        notificationService.notifyReportAssigned(saved, assignee);

        log.info("Rapor atandı: {} → {}", reportId, assignee.getEmail());
        return reportMapper.toResponse(saved);
    }

    // ===================================================
    // COĞRAFİ SORGU: Yakın Raporlar (Saha Ekibi)
    // ===================================================

    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('ROLE_FIELD_OFFICER','ROLE_DEPT_MANAGER','ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    public List<ReportListResponse> getNearbyReports(double latitude, double longitude, double radiusMeters) {
        return reportRepository.findNearbyReports(latitude, longitude, radiusMeters)
                .stream()
                .map(reportMapper::toListResponse)
                .toList();
    }

    // ===================================================
    // Yardımcı Metodlar
    // ===================================================

    @Async
    @Transactional
    public void performAiAnalysis(String reportId) {
        Report report = findReportOrThrow(reportId);
        com.burak.belediyeapp.service.ai.GeminiService.AIAnalysisResult result = geminiService.analyzeReport(report);
        
        if (result != null) {
            report.setAiPriority(result.priority());
            report.setAiSummary(result.summary());
            reportRepository.save(report);
            log.info("AI Analizi tamamlandı: Rapor={}, Öncelik={}", reportId, result.priority());
        }
    }

    private Report findReportOrThrow(String reportId) {
        return reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Rapor", "id", reportId));
    }

    /**
     * Vatandaş yalnızca kendi raporunu görebilir.
     * Belediye personeli tüm raporları görebilir.
     */
    private void ensureCanViewReport(Report report, AppUser user) {
        boolean isCitizenOnly = user.hasRole("ROLE_CITIZEN")
                && !user.hasRole("ROLE_FIELD_OFFICER")
                && !user.hasRole("ROLE_DEPT_MANAGER")
                && !user.hasRole("ROLE_ADMIN")
                && !user.hasRole("ROLE_SUPER_ADMIN");

        if (isCitizenOnly && !report.getReporter().getId().equals(user.getId())) {
            throw new BusinessException("Bu rapora erişim yetkiniz yok", "ACCESS_DENIED");
        }
    }
}
