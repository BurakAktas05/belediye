package com.burak.belediyeapp.audit;

import com.burak.belediyeapp.entity.AppUser;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Aspect
@Component
@Slf4j
public class AuditAspect {

    @AfterReturning(pointcut = "@annotation(auditAction)", returning = "result")
    public void logAudit(JoinPoint joinPoint, AuditAction auditAction, Object result) {
        String username = "Anonymous";
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        
        if (principal instanceof AppUser) {
            username = ((AppUser) principal).getEmail();
        } else if (principal instanceof String) {
            username = (String) principal;
        }

        log.info("[AUDIT] User: {} | Action: {} | Method: {} | Description: {}", 
                username, auditAction.action(), joinPoint.getSignature().getName(), auditAction.description());
        
        // Buraya bir AuditLog tablosuna kaydetme mantığı da eklenebilir.
    }
}
