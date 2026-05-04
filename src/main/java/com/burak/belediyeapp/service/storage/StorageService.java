package com.burak.belediyeapp.service.storage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

/**
 * Cloudflare R2 / AWS S3 Dosya depolama servisi.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StorageService {

    private final S3Client s3Client;

    @Value("${app.storage.s3.bucket-name}")
    private String bucketName;

    @Value("${app.storage.s3.public-url}")
    private String publicUrl;

    /**
     * Dosyayı R2 bucket'ına yükler ve erişim URL'ini döner.
     */
    public String uploadFile(MultipartFile file, String folder) {
        String fileName = folder + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileName)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            log.info("Dosya yüklendi: {}", fileName);
            return publicUrl + "/" + fileName;

        } catch (IOException e) {
            log.error("Dosya yükleme hatası: {}", fileName, e);
            throw new RuntimeException("Dosya yüklenemedi", e);
        }
    }

    public void deleteFile(String fileUrl) {
        try {
            String key = fileUrl.replace(publicUrl + "/", "");
            s3Client.deleteObject(builder -> builder.bucket(bucketName).key(key));
            log.info("Dosya silindi: {}", key);
        } catch (Exception e) {
            log.warn("Dosya silinirken hata oluştu (önemsiz olabilir): {}", fileUrl);
        }
    }
}
