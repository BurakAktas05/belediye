package com.burak.belediyeapp.controller;

import com.burak.belediyeapp.dto.request.report.AssignReportRequest;
import com.burak.belediyeapp.dto.request.report.CreateReportRequest;
import com.burak.belediyeapp.dto.request.report.UpdateReportStatusRequest;
import com.burak.belediyeapp.dto.response.common.ApiResponse;
import com.burak.belediyeapp.dto.response.report.ReportListResponse;
import com.burak.belediyeapp.dto.response.report.ReportResponse;
import com.burak.belediyeapp.entity.AppUser;
import com.burak.belediyeapp.entity.ReportStatus;
import com.burak.belediyeapp.service.report.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Tag(name = "Raporlar", description = "Vatandaş şikayet raporları yönetimi")
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    @Operation(summary = "Yeni rapor oluştur (Vatandaş)")
    public ResponseEntity<ApiResponse<ReportResponse>> createReport(
            @Valid @RequestBody CreateReportRequest request,
            @AuthenticationPrincipal AppUser currentUser) {

        ReportResponse response = reportService.createReport(request, currentUser);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Raporunuz alındı, teşekkürler!", response));
    }

    @GetMapping("/my")
    @Operation(summary = "Kendi raporlarım (Vatandaş)")
    public ResponseEntity<ApiResponse<Page<ReportListResponse>>> getMyReports(
            @AuthenticationPrincipal AppUser currentUser,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {

        Page<ReportListResponse> page = reportService.getMyReports(currentUser, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping
    @Operation(summary = "Tüm raporlar (Saha Ekibi ve üzeri)")
    public ResponseEntity<ApiResponse<Page<ReportListResponse>>> getAllReports(
            @RequestParam(required = false) ReportStatus status,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {

        Page<ReportListResponse> page = (status != null)
                ? reportService.getReportsByStatus(status, pageable)
                : reportService.getAllReports(pageable);

        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/{reportId}")
    @Operation(summary = "Rapor detayı")
    public ResponseEntity<ApiResponse<ReportResponse>> getReportById(
            @PathVariable String reportId,
            @AuthenticationPrincipal AppUser currentUser) {

        ReportResponse response = reportService.getReportById(reportId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{reportId}/status")
    @Operation(summary = "Rapor durumunu güncelle (Saha Ekibi ve üzeri)")
    public ResponseEntity<ApiResponse<ReportResponse>> updateStatus(
            @PathVariable String reportId,
            @Valid @RequestBody UpdateReportStatusRequest request,
            @AuthenticationPrincipal AppUser currentUser) {

        ReportResponse response = reportService.updateStatus(reportId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Durum güncellendi", response));
    }

    @PostMapping("/{reportId}/assign")
    @Operation(summary = "Saha ekibi ata (Birim Müdürü ve üzeri)")
    public ResponseEntity<ApiResponse<ReportResponse>> assignReport(
            @PathVariable String reportId,
            @Valid @RequestBody AssignReportRequest request,
            @AuthenticationPrincipal AppUser currentUser) {

        ReportResponse response = reportService.assignReport(reportId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Rapor atandı", response));
    }

    @GetMapping("/nearby")
    @Operation(summary = "Yakındaki raporlar — PostGIS spatial sorgu (Saha Ekibi)")
    public ResponseEntity<ApiResponse<List<ReportListResponse>>> getNearbyReports(
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam(defaultValue = "1000") @Min(100) @Max(50000) double radiusMeters) {

        List<ReportListResponse> result = reportService.getNearbyReports(latitude, longitude, radiusMeters);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
