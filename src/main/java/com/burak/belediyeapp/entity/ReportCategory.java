package com.burak.belediyeapp.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "report_categories")
@Getter @Setter @NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportCategory extends BaseEntity {
    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    @Column(nullable = false)
    private boolean active = true; // Kategori pasife çekilebilir
}