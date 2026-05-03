package com.burak.belediyeapp.entity;

import jakarta.persistence.*;
import lombok.*;

import org.locationtech.jts.geom.Point;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "reports")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report extends BaseEntity{

    @Column(nullable = false,length = 150)
    private String title;

    @Column(nullable = false,columnDefinition = "text")
    private String description;

    @Column(columnDefinition = "geometry(Point,4326)", nullable = false)
    private Point location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private ReportStatus reportStatus = ReportStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id",nullable = false)
    private ReportCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private AppUser reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private AppUser assignee;

    @OneToMany(mappedBy = "report", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReportMedia> mediaList = new ArrayList<>();

    @OneToMany(mappedBy = "report", cascade = CascadeType.ALL)
    private List<ReportHistory> historyList = new ArrayList<>();

}
