package com.burak.belediyeapp.audit;

import com.burak.belediyeapp.entity.AppUser;
import com.burak.belediyeapp.entity.AuditLog;
import com.burak.belediyeapp.repository.IAuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Denetim günlüğü Aspect'i.
 * @AuditAction ile işaretlenen tüm metodların çağrılarını
 * hem konsola hem de audit_logs tablosuna kaydeder.
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final IAuditLogRepository auditLogRepository;

    @AfterReturning(pointcut = "@annotation(auditAction)", returning = "result")
    public void logAudit(JoinPoint joinPoint, AuditAction auditAction, Object result) {
        String username = "Anonymous";
        String userId = null;

        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() != null) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof AppUser appUser) {
                username = appUser.getEmail();
                userId = appUser.getId();
            } else if (principal instanceof String s) {
                username = s;
            }
        }

        String ipAddress = resolveIpAddress();
        String methodName = joinPoint.getSignature().toShortString();

        // Kısa bir sonuç özeti oluştur
        String resultSummary = null;
        if (result != null) {
            String str = result.toString();
            resultSummary = str.length() > 500 ? str.substring(0, 500) + "..." : str;
        }

        // Konsol logu
        log.info("[AUDIT] User: {} | Action: {} | Method: {} | Description: {}",
                username, auditAction.action(), methodName, auditAction.description());

        // DB'ye kaydet
        try {
            AuditLog entry = AuditLog.builder()
                    .username(username)
                    .userId(userId)
                    .action(auditAction.action())
                    .description(auditAction.description())
                    .methodName(methodName)
                    .resultSummary(resultSummary)
                    .ipAddress(ipAddress)
                    .build();
            auditLogRepository.save(entry);
        } catch (Exception e) {
            log.warn("Audit log DB'ye kaydedilemedi: {}", e.getMessage());
        }
    }

    private String resolveIpAddress() {
        try {
            var attrs = RequestContextHolder.getRequestAttributes();
            if (attrs instanceof ServletRequestAttributes sra) {
                HttpServletRequest request = sra.getRequest();
                String xff = request.getHeader("X-Forwarded-For");
                if (xff != null && !xff.isBlank()) {
                    return xff.split(",")[0].trim();
                }
                return request.getRemoteAddr();
            }
        } catch (Exception ignored) {
        }
        return null;
    }
}
