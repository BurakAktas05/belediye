package com.burak.belediyeapp.dto.response.report;

import java.time.LocalDateTime;

public record ReportListResponse(
        Long id,
        String title,
        String status,
        String categoryName,
        Double latitude,
        Double longitude,
        LocalDateTime createdAt
) {}