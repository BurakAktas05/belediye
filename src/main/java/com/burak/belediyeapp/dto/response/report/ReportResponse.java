package com.burak.belediyeapp.dto.response.report;

import java.time.LocalDateTime;

public record ReportResponse(
        Long id,
        String title,
        String description,

        String status,

        String categoryName,

        String reporterFullName,

        Double latitude,
        Double longitude,

        LocalDateTime createdAt
) {}