package com.burak.belediyeapp.service.user;

import com.burak.belediyeapp.dto.request.user.CreateStaffRequest;
import com.burak.belediyeapp.dto.request.user.UpdateUserRolesRequest;
import com.burak.belediyeapp.dto.response.user.UserResponse;
import com.burak.belediyeapp.entity.AppUser;
import com.burak.belediyeapp.entity.Department;
import com.burak.belediyeapp.entity.Role;
import com.burak.belediyeapp.exception.BusinessException;
import com.burak.belediyeapp.exception.ResourceNotFoundException;
import com.burak.belediyeapp.repository.IAppUserRepository;
import com.burak.belediyeapp.repository.IDepartmentRepository;
import com.burak.belediyeapp.repository.IRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final IAppUserRepository userRepository;
    private final IRoleRepository roleRepository;
    private final IDepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserResponse getUserProfile(AppUser currentUser) {
        return mapToResponse(currentUser);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Admin tarafından personel oluşturma.
     * Vatandaş kaydından farklı olarak belirli roller ve departman atanabilir.
     */
    @Transactional
    public UserResponse createStaff(CreateStaffRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException("Bu email adresi zaten kullanımda: " + request.email(), "EMAIL_ALREADY_EXISTS");
        }

        AppUser user = new AppUser();
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setPhoneNumber(request.phoneNumber());

        // Rolleri ata
        if (request.roleNames() != null && !request.roleNames().isEmpty()) {
            Set<Role> roles = new HashSet<>();
            for (String roleName : request.roleNames()) {
                Role role = roleRepository.findByName(roleName)
                        .orElseThrow(() -> new ResourceNotFoundException("Rol", "name", roleName));
                roles.add(role);
            }
            user.setRoles(roles);
        } else {
            // Varsayılan olarak CITIZEN rolü ata
            Role citizenRole = roleRepository.findByName("ROLE_CITIZEN")
                    .orElseThrow(() -> new ResourceNotFoundException("Sistem rolü bulunamadı"));
            user.setRoles(Set.of(citizenRole));
        }
        // Departman ata
        if (request.departmentId() != null && !request.departmentId().isBlank()) {
            Department dept = departmentRepository.findById(request.departmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Departman", "id", request.departmentId()));
            user.setDepartment(dept);
        }

        // İlçe ata
        user.setDistrict(request.district());

        AppUser saved = userRepository.save(user);
        log.info("Yeni personel oluşturuldu: {} ({})", saved.getFullName(), saved.getEmail());
        return mapToResponse(saved);
    }

    /**
     * Kullanıcı rollerini güncelle.
     */
    @Transactional
    public UserResponse updateUserRoles(String userId, UpdateUserRolesRequest request) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı", "id", userId));

        Set<Role> roles = new HashSet<>();
        for (String roleName : request.roleNames()) {
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new ResourceNotFoundException("Rol", "name", roleName));
            roles.add(role);
        }
        user.setRoles(roles);

        AppUser saved = userRepository.save(user);
        log.info("Kullanıcı rolleri güncellendi: {} → {}", userId, request.roleNames());
        return mapToResponse(saved);
    }

    /**
     * Kullanıcı hesabını aktif/pasif yap.
     */
    @Transactional
    public UserResponse toggleUserEnabled(String userId) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı", "id", userId));

        user.setEnabled(!user.isEnabled());
        AppUser saved = userRepository.save(user);
        log.info("Kullanıcı durumu değiştirildi: {} → enabled={}", userId, saved.isEnabled());
        return mapToResponse(saved);
    }

    @Transactional
    public void updateFcmToken(String userId, String token) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı", "id", userId));
        user.setFcmToken(token);
        userRepository.save(user);
    }

    private UserResponse mapToResponse(AppUser user) {
        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getRoles().stream().map(Role::getName).collect(Collectors.toList()),
                user.getDistrict()
        );
    }
}
