package com.burak.belediyeapp.service.department;

import com.burak.belediyeapp.audit.AuditAction;
import com.burak.belediyeapp.dto.request.department.CreateDepartmentRequest;
import com.burak.belediyeapp.dto.request.department.UpdateDepartmentRequest;
import com.burak.belediyeapp.dto.response.department.DepartmentResponse;
import com.burak.belediyeapp.entity.Department;
import com.burak.belediyeapp.exception.BusinessException;
import com.burak.belediyeapp.exception.ResourceNotFoundException;
import com.burak.belediyeapp.repository.IDepartmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DepartmentService {

    private final IDepartmentRepository departmentRepository;

    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    @AuditAction(action = "DEPARTMENT_CREATE", description = "Yeni departman oluşturuldu")
    public DepartmentResponse createDepartment(CreateDepartmentRequest request) {
        if (departmentRepository.existsByName(request.name())) {
            throw new BusinessException("Bu departman adı zaten mevcut: " + request.name(), "DEPARTMENT_ALREADY_EXISTS");
        }

        Department department = Department.builder()
                .name(request.name())
                .description(request.description())
                .isActive(true)
                .build();

        Department saved = departmentRepository.save(department);
        log.info("Departman oluşturuldu: {}", saved.getName());
        return mapToResponse(saved);
    }

    @Transactional
    @AuditAction(action = "DEPARTMENT_UPDATE", description = "Departman güncellendi")
    public DepartmentResponse updateDepartment(String departmentId, UpdateDepartmentRequest request) {
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Departman", "id", departmentId));

        if (!department.getName().equals(request.name()) && departmentRepository.existsByName(request.name())) {
            throw new BusinessException("Bu departman adı zaten kullanımda: " + request.name(), "DEPARTMENT_NAME_EXISTS");
        }

        department.setName(request.name());
        department.setDescription(request.description());
        if (request.isActive() != null) {
            department.setActive(request.isActive());
        }

        Department saved = departmentRepository.save(department);
        log.info("Departman güncellendi: {}", saved.getName());
        return mapToResponse(saved);
    }

    @Transactional
    @AuditAction(action = "DEPARTMENT_DELETE", description = "Departman devre dışı bırakıldı")
    public void deleteDepartment(String departmentId) {
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Departman", "id", departmentId));
        department.setActive(false);
        departmentRepository.save(department);
        log.info("Departman devre dışı bırakıldı: {}", department.getName());
    }

    private DepartmentResponse mapToResponse(Department dept) {
        return new DepartmentResponse(
                dept.getId(),
                dept.getName(),
                dept.getDescription(),
                dept.isActive()
        );
    }
}
