import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Sparkles } from 'lucide-react';
import api, { type Report, type ReportTimelineEntry } from '../api';

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [timeline, setTimeline] = useState<ReportTimelineEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const [r, tl] = await Promise.all([api.get(`/reports/${id}`), api.get(`/reports/${id}/timeline`)]);
        if (!cancelled) {
          setReport(r.data.data as Report);
          setTimeline(tl.data.data as ReportTimelineEntry[]);
        }
      } catch {
        if (!cancelled) setError('Rapor bulunamadı veya erişim yok.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="p-6">
        <Link to="/reports" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-primary">
          <ArrowLeft className="h-4 w-4" />
          Raporlara dön
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{error}</div>
      </div>
    );
  }

  if (!report) {
    return <div className="p-6 text-slate-500">Yükleniyor…</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <Link to="/reports" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Raporlara dön
      </Link>

      <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{report.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {report.categoryName} · {report.district}
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase text-primary">{report.status}</span>
        </div>

        {report.description && <p className="mb-6 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{report.description}</p>}

        {(report.aiSummary || report.aiSuggestedCategory || report.aiPriority) && (
          <div className="mb-6 flex gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 dark:border-primary/30 dark:bg-primary/10">
            <Sparkles className="h-5 w-5 shrink-0 text-secondary" />
            <div className="text-sm">
              {report.aiPriority && (
                <p className="font-bold text-primary">
                  AI öncelik: <span className="font-mono">{report.aiPriority}</span>
                </p>
              )}
              {report.aiSummary && <p className="mt-1 text-slate-700 dark:text-slate-200">{report.aiSummary}</p>}
              {report.aiSuggestedCategory && (
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Önerilen kategori: {report.aiSuggestedCategory}</p>
              )}
            </div>
          </div>
        )}

        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-slate-500">Vatandaş</dt>
            <dd className="text-slate-900 dark:text-white">{report.reporterFullName ?? '—'}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Atanan</dt>
            <dd className="text-slate-900 dark:text-white">{report.assigneeFullName ?? '—'}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Oluşturulma</dt>
            <dd className="text-slate-900 dark:text-white">{report.createdAt ? new Date(report.createdAt).toLocaleString('tr-TR') : '—'}</dd>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
            <div>
              <dt className="font-semibold text-slate-500">Konum</dt>
              <dd className="font-mono text-slate-900 dark:text-white">
                {report.latitude}, {report.longitude}
              </dd>
            </div>
          </div>
        </dl>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-6 text-lg font-bold text-slate-900 dark:text-white">Yaşam döngüsü</h2>
        <div className="relative space-y-0 border-l-2 border-primary/30 pl-5">
          {timeline.map((e, i) => (
            <div key={i} className="relative pb-8 last:pb-0">
              <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-white dark:ring-slate-900" />
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {e.at ? new Date(e.at).toLocaleString('tr-TR') : ''}
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {e.oldStatus ?? '—'} → {e.newStatus ?? '—'}
              </p>
              <p className="text-xs text-slate-500">{e.actorName}</p>
              {e.note && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{e.note}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
