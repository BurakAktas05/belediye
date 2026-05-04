package com.burak.belediyeapp.service.geo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * GPS noktasının düştüğü ilçe adını PostGIS ile çözer.
 * Veri {@code district_boundaries} tablosundan gelir (Flyway V12).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DistrictResolutionService {

    private final JdbcTemplate jdbcTemplate;

    public Optional<String> resolveDistrict(double latitude, double longitude) {
        String sql = """
                SELECT name FROM district_boundaries
                WHERE ST_Contains(boundary, ST_SetSRID(ST_MakePoint(?, ?), 4326))
                ORDER BY name
                LIMIT 1
                """;
        try {
            List<String> names = jdbcTemplate.query(sql, (rs, row) -> rs.getString(1), longitude, latitude);
            return names.stream().findFirst();
        } catch (Exception e) {
            log.warn("İlçe çözümlemesi başarısız: {}", e.getMessage());
            return Optional.empty();
        }
    }
}
