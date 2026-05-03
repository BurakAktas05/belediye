package com.burak.belediyeapp.mapper;


import com.burak.belediyeapp.dto.request.report.CreateReportRequest;
import com.burak.belediyeapp.dto.response.report.ReportResponse;
import com.burak.belediyeapp.entity.Report;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

// componentModel = "spring" parametresi, bu mapper'ın Spring Context'ine
// bir @Component (Bean) olarak eklenmesini sağlar. Böylece servislerde DI (Dependency Injection) yapabiliriz.
@Mapper(componentModel = "spring")
public interface IReportMapper {

    // ==========================================
    // 1. Entity'den -> Response DTO'ya Dönüşüm
    // ==========================================
    @Mapping(target = "categoryName", source = "category.name")
    @Mapping(target = "reporterFullName", expression = "java(report.getReporter() != null ? report.getReporter().getFirstName() + ' ' + report.getReporter().getLastName() : null)")
    @Mapping(target = "latitude", source = "location.y")  // JTS Point nesnesinde Y ekseni Enlem'dir
    @Mapping(target = "longitude", source = "location.x") // JTS Point nesnesinde X ekseni Boylam'dır
    ReportResponse toResponse(Report report);


    // ==========================================
    // 2. Request DTO'dan -> Entity'ye Dönüşüm
    // ==========================================
    // Client'tan gelen istekte ID, durum, atanan kişi vb. olmaz. Bunları görmezden geliyoruz (ignore = true).
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "reportStatus", ignore = true)
    @Mapping(target = "reporter", ignore = true)
    @Mapping(target = "assignee", ignore = true)
    @Mapping(target = "category", ignore = true) // Kategori, service katmanında veritabanından bulunup setlenecek
    @Mapping(target = "mediaList", ignore = true)
    @Mapping(target = "location", source = "request", qualifiedByName = "coordinatesToPoint")
    Report toEntity(CreateReportRequest request);


    // ==========================================
    // 3. Custom Dönüşüm (Enlem/Boylam -> JTS Point)
    // ==========================================
    @Named("coordinatesToPoint")
    default Point mapCoordinatesToPoint(CreateReportRequest request) {
        if (request.latitude() == null || request.longitude() == null) {
            return null;
        }
        // 4326: WGS84 standart GPS koordinat sisteminin SRID değeridir
        GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

        // DİKKAT: Coordinate sınıfı (x, y) yani (Boylam, Enlem) sırasıyla parametre alır!
        return geometryFactory.createPoint(new Coordinate(request.longitude(), request.latitude()));
    }
}