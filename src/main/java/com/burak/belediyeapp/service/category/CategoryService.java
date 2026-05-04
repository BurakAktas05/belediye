package com.burak.belediyeapp.service.category;

import com.burak.belediyeapp.dto.request.category.CreateCategoryRequest;
import com.burak.belediyeapp.dto.response.category.CategoryResponse;
import com.burak.belediyeapp.entity.Department;
import com.burak.belediyeapp.entity.ReportCategory;
import com.burak.belediyeapp.exception.BusinessException;
import com.burak.belediyeapp.exception.ResourceNotFoundException;
import com.burak.belediyeapp.repository.IDepartmentRepository;
import com.burak.belediyeapp.repository.IReportCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final IReportCategoryRepository categoryRepository;
    private final IDepartmentRepository departmentRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> getActiveCategories() {
        return categoryRepository.findAllByActiveTrue().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        if (categoryRepository.existsByName(request.name())) {
            throw new BusinessException("Bu kategori adı zaten mevcut: " + request.name(), "CATEGORY_ALREADY_EXISTS");
        }

        ReportCategory category = ReportCategory.builder()
                .name(request.name())
                .description(request.description())
                .iconCode(request.iconCode())
                .build();

        if (request.departmentId() != null && !request.departmentId().isBlank()) {
            Department dept = departmentRepository.findById(request.departmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Departman", "id", request.departmentId()));
            category.setDepartment(dept);
        }

        return mapToResponse(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(String categoryId) {
        ReportCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Kategori", "id", categoryId));
        category.setActive(false);
        categoryRepository.save(category);
    }

    private CategoryResponse mapToResponse(ReportCategory category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.getIconCode()
        );
    }
}
