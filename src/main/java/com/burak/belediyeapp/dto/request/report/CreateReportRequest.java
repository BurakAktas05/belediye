package com.burak.belediyeapp.dto.request.report;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateReportRequest(
        @NotBlank(message = "Başlık boş bırakılamaz")
        @Size(min = 10, max = 150, message = "Başlık 10 ile 150 karakter arasında olmalıdır")
        String title,

        @NotBlank(message = "Açıklama boş bırakılamaz")
        String description,

        @NotNull(message = "Kategori seçilmelidir")
        Long categoryId,

        @NotNull(message = "Enlem (Latitude) gereklidir")
        Double latitude,

        @NotNull(message = "Boylam (Longitude) gereklidir")
        Double longitude

) {}