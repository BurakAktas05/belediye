package com.burak.belediyeapp.mapper;

import com.burak.belediyeapp.dto.request.report.CreateReportRequest;
import com.burak.belediyeapp.dto.response.report.ReportListResponse;
import com.burak.belediyeapp.dto.response.report.ReportResponse;
import com.burak.belediyeapp.entity.Report;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface IReportMapper {

    // ==========================================
    // 1. Entity → ReportResponse (detay görünüm)
    // ==========================================
    @Mapping(target = "categoryName", source = "category.name")
    @Mapping(target = "reporterFullName",
            expression = "java(report.getReporter() != null ? report.getReporter().getFirstName() + ' ' + report.getReporter().getLastName() : null)")
    @Mapping(target = "assigneeFullName",
            expression = "java(report.getAssignee() != null ? report.getAssignee().getFirstName() + ' ' + report.getAssignee().getLastName() : null)")
    @Mapping(target = "latitude", source = "location.y")
    @Mapping(target = "longitude", source = "location.x")
    @Mapping(target = "status", source = "reportStatus")
    ReportResponse toResponse(Report report);

    // ==========================================
    // 2. Entity → ReportListResponse (liste görünüm)
    // ==========================================
    @Mapping(target = "categoryName", source = "category.name")
    @Mapping(target = "latitude", source = "location.y")
    @Mapping(target = "longitude", source = "location.x")
    @Mapping(target = "status", source = "reportStatus")
    ReportListResponse toListResponse(Report report);

    // ==========================================
    // 3. CreateReportRequest → Entity
    // ==========================================
    @Mapping(target = "reportStatus", ignore = true)
    @Mapping(target = "reporter", ignore = true)
    @Mapping(target = "assignee", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "mediaList", ignore = true)
    @Mapping(target = "historyList", ignore = true)
    @Mapping(target = "location", source = "request", qualifiedByName = "coordinatesToPoint")
    Report toEntity(CreateReportRequest request);

    // ==========================================
    // 4. Custom: Koordinat → JTS Point
    // ==========================================
    @Named("coordinatesToPoint")
    default Point mapCoordinatesToPoint(CreateReportRequest request) {
        if (request.latitude() == null || request.longitude() == null) {
            return null;
        }
        // 4326 = WGS84 GPS koordinat sistemi
        // DİKKAT: Coordinate(x=boylam, y=enlem) sıralaması
        GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
        return geometryFactory.createPoint(new Coordinate(request.longitude(), request.latitude()));
    }
}