package com.burak.belediyeapp.repository;

import com.burak.belediyeapp.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface IAuditLogRepository extends JpaRepository<AuditLog, String> {

    /** Kullanıcıya göre denetim kayıtları */
    Page<AuditLog> findByUsernameOrderByCreatedAtDesc(String username, Pageable pageable);

    /** İşlem tipine göre denetim kayıtları */
    Page<AuditLog> findByActionOrderByCreatedAtDesc(String action, Pageable pageable);

    /** Tüm denetim kayıtları (en yeni önce) */
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /** Tarih aralığına göre denetim kayıtları */
    List<AuditLog> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);

    /** Kullanıcı + işlem tipine göre filtreleme */
    Page<AuditLog> findByUsernameAndActionOrderByCreatedAtDesc(String username, String action, Pageable pageable);
}
