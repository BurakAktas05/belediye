package com.burak.belediyeapp.config;

import com.burak.belediyeapp.security.JwtAuthFilter;
import com.burak.belediyeapp.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Spring Security ana konfigürasyonu.
 *
 * Mimari kararlar:
 * - Stateless (JWT) session — sunucuda session tutulmaz
 * - CSRF devre dışı — REST API + JWT ile CSRF riski yoktur
 * - @EnableMethodSecurity ile @PreAuthorize kullanımı aktif
 * - Rol bazlı URL erişim kontrolü + method level güvenlik birlikte
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity           // @PreAuthorize, @PostAuthorize aktif
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsServiceImpl userDetailsService;
    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // CORS aktif — CorsConfig bean'inden alır
            .cors(cors -> cors.configurationSource(corsConfigurationSource))

            // REST API için CSRF kapalı
            .csrf(AbstractHttpConfigurer::disable)

            // Stateless: JWT tabanlı, session tutulmaz
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // URL erişim kuralları
            .authorizeHttpRequests(auth -> auth

                // ── Herkese açık ──────────────────────────────
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/categories/**").permitAll()

                // ── Swagger UI (geliştirme) ───────────────────
                .requestMatchers(
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/v3/api-docs/**"
                ).permitAll()

                // ── Dashboard istatistik endpoint ─────────────
                .requestMatchers("/api/v1/dashboard/**")
                    .hasAnyRole("DEPT_MANAGER", "ADMIN", "SUPER_ADMIN")

                // ── Vatandaş işlemleri ────────────────────────
                .requestMatchers(HttpMethod.POST, "/api/v1/reports").hasRole("CITIZEN")
                .requestMatchers(HttpMethod.GET, "/api/v1/reports/my").hasRole("CITIZEN")

                // ── Rapor detay — tüm oturum açmış kullanıcılar (method security kontrol eder)
                .requestMatchers(HttpMethod.GET, "/api/v1/reports/{reportId}")
                    .authenticated()

                // ── Saha ekibi & üzeri ───────────────────────
                .requestMatchers(HttpMethod.GET, "/api/v1/reports/**")
                    .hasAnyRole("FIELD_OFFICER", "DEPT_MANAGER", "ADMIN", "SUPER_ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/v1/reports/**")
                    .hasAnyRole("FIELD_OFFICER", "DEPT_MANAGER", "ADMIN", "SUPER_ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/v1/reports/*/assign")
                    .hasAnyRole("DEPT_MANAGER", "ADMIN", "SUPER_ADMIN")

                // ── Birim müdürü & üzeri ─────────────────────
                .requestMatchers("/api/v1/departments/**")
                    .hasAnyRole("DEPT_MANAGER", "ADMIN", "SUPER_ADMIN")

                // ── Admin & üzeri ─────────────────────────────
                .requestMatchers(HttpMethod.POST, "/api/v1/categories/**")
                    .hasAnyRole("ADMIN", "SUPER_ADMIN")
                .requestMatchers("/api/v1/users/**")
                    .hasAnyRole("DEPT_MANAGER", "ADMIN", "SUPER_ADMIN")

                // Geri kalan her şey kimlik doğrulama gerektirir
                .anyRequest().authenticated()
            )

            // JWT filter — UsernamePasswordAuthenticationFilter'dan önce çalışır
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
