package com.burak.belediyeapp.service.export;

import com.burak.belediyeapp.entity.Report;
import com.burak.belediyeapp.repository.IReportRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final IReportRepository reportRepository;

    public byte[] exportReportsToExcel(String district) throws IOException {
        List<Report> reports;
        if (district != null) {
            reports = reportRepository.findByDistrict(district, org.springframework.data.domain.Pageable.unpaged()).getContent();
        } else {
            reports = reportRepository.findAll();
        }

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Raporlar");

            // Header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"ID", "Başlık", "Kategori", "İlçe", "Durum", "Oluşturulma Tarihi"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                CellStyle style = workbook.createCellStyle();
                Font font = workbook.createFont();
                font.setBold(true);
                style.setFont(font);
                cell.setCellStyle(style);
            }

            // Data rows
            int rowIdx = 1;
            for (Report report : reports) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(report.getId());
                row.createCell(1).setCellValue(report.getTitle());
                row.createCell(2).setCellValue(report.getCategory() != null ? report.getCategory().getName() : "");
                row.createCell(3).setCellValue(report.getDistrict() != null ? report.getDistrict() : "");
                row.createCell(4).setCellValue(report.getReportStatus() != null ? report.getReportStatus().toString() : "");
                row.createCell(5).setCellValue(report.getCreatedAt() != null ? report.getCreatedAt().toString() : "");
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }
}
