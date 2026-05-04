-- ============================================================
-- V15: Seed Data (Sistem Başlangıç Verileri)
-- Rollerin, izinlerin, varsayılan adminin ve kategorilerin 
-- veritabanı kurulduğunda otomatik oluşturulmasını sağlar.
-- ============================================================

-- 1. Roller
INSERT INTO roles (id, name, description) VALUES
    ('uuid-role-citizen', 'ROLE_CITIZEN', 'Standart Vatandaş'),
    ('uuid-role-field', 'ROLE_FIELD_OFFICER', 'Saha Görevlisi'),
    ('uuid-role-dept', 'ROLE_DEPT_MANAGER', 'Birim Müdürü'),
    ('uuid-role-admin', 'ROLE_ADMIN', 'Sistem Yöneticisi'),
    ('uuid-role-super', 'ROLE_SUPER_ADMIN', 'Süper Yönetici')
ON CONFLICT (name) DO NOTHING;

-- 2. Departmanlar (Örnek)
INSERT INTO departments (id, name, description, active) VALUES
    ('uuid-dept-yol', 'Yol Bakım ve Onarım', 'Yollarla ilgili sorunlar', true),
    ('uuid-dept-cevre', 'Çevre Koruma', 'Çevre ve temizlik işleri', true),
    ('uuid-dept-su', 'Su ve Kanalizasyon (İSKİ)', 'Su patlağı, kanalizasyon', true),
    ('uuid-dept-ulasim', 'Ulaşım Hizmetleri', 'Toplu taşıma ve duraklar', true)
ON CONFLICT DO NOTHING;

-- 3. Süper Admin Kullanıcısı
-- Şifre "admin123" olarak bcrypt ile şifrelenmiştir. İlk girişte değiştirilmesi gerekir.
INSERT INTO app_users (id, email, password, first_name, last_name, phone_number, enabled) VALUES
    ('uuid-admin-user', 'admin@ibb.gov.tr', '$2a$10$wB5W37RjQ/9zPz.TqT0g3eYwR5N/yX801/T3gYy8Lg.S/N/0Xo.4q', 'Super', 'Admin', '05555555555', true)
ON CONFLICT (email) DO NOTHING;

-- Admibe Süper Admin rolünü atama
INSERT INTO user_roles (user_id, role_id) VALUES
    ('uuid-admin-user', 'uuid-role-super')
ON CONFLICT DO NOTHING;

-- 4. Temel Kategoriler
INSERT INTO categories (id, name, description, priority, icon_url, parent_category_id, active) VALUES
    ('uuid-cat-1', 'Çukur / Yol Bozukluğu', 'Yollardaki çukurlar ve asfalt sorunları', 'HIGH', null, null, true),
    ('uuid-cat-2', 'Sokak Hayvanı Bildirimi', 'Yaralı veya tehlikeli sokak hayvanları', 'MEDIUM', null, null, true),
    ('uuid-cat-3', 'Çöp / Temizlik Sorunu', 'Toplanmayan çöpler, kirlilik', 'LOW', null, null, true),
    ('uuid-cat-4', 'Su Patlağı / Kanalizasyon', 'İSKİ alanına giren su ve kanal sorunları', 'CRITICAL', null, null, true),
    ('uuid-cat-5', 'Ulaşım / Durak Şikayeti', 'Otobüs durağı hasarı, otobüs sorunları', 'MEDIUM', null, null, true)
ON CONFLICT DO NOTHING;
