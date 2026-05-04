package com.burak.belediyeapp.service.notification;

import com.burak.belediyeapp.entity.AppUser;
import com.burak.belediyeapp.entity.Notification;
import com.burak.belediyeapp.entity.Report;
import com.burak.belediyeapp.repository.INotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Uygulama içi bildirim servisi.
 * Rapor durum değişikliği ve atama olaylarında otomatik bildirim üretir.
 * Async çalışır — ana iş akışını yavaşlatmaz.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final INotificationRepository notificationRepository;

    /**
     * Rapor durumu değiştiğinde vatandaşa bildirim gönderir.
     */
    @Async
    @Transactional
    public void notifyReportStatusChanged(Report report) {
        String statusText = switch (report.getReportStatus()) {
            case PROCESSING -> "incelemeye alındı";
            case RESOLVED -> "çözüme kavuşturuldu";
            case REJECTED -> "reddedildi";
            default -> "güncellendi";
        };

        Notification notification = Notification.builder()
                .user(report.getReporter())
                .title("Raporunuz " + statusText + "!")
                .body(String.format("'%s' başlıklı raporunuz %s.", report.getTitle(), statusText))
                .type("REPORT_STATUS_CHANGED")
                .reportId(report.getId())
                .build();

        notificationRepository.save(notification);
        log.debug("Bildirim gönderildi: Kullanıcı={}, Rapor={}", report.getReporter().getEmail(), report.getId());
    }

    /**
     * Rapor atandığında saha görevlisine bildirim gönderir.
     */
    @Async
    @Transactional
    public void notifyReportAssigned(Report report, AppUser assignee) {
        Notification notification = Notification.builder()
                .user(assignee)
                .title("Yeni rapor atandı")
                .body(String.format("'%s' başlıklı rapor size atandı.", report.getTitle()))
                .type("REPORT_ASSIGNED")
                .reportId(report.getId())
                .build();

        notificationRepository.save(notification);
    }

    /**
     * Kullanıcının okunmamış bildirim sayısını döner.
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    /**
     * Kullanıcının bildirimlerini sayfalanmış getirir.
     */
    @Transactional(readOnly = true)
    public Page<Notification> getNotifications(String userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    /**
     * Tüm bildirimleri okundu olarak işaretle.
     */
    @Transactional
    public void markAllAsRead(String userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }
}
