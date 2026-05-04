import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Clock, AlertCircle, Trash2, HardHat, Lightbulb, TreePine, Construction } from 'lucide-react';
import { getMyReports, ApiReportList } from '../../api';
import { Lang, t } from '../../i18n';

interface HomeProps {
  onNavigate: (tab: 'report') => void;
  onOpenReport?: (reportId: string) => void;
  lang: Lang;
  isDark: boolean;
}

const getCategoryIcon = (category: string) => {
  if (category.includes('Çukur') || category.includes('Yol')) return <Construction className="w-5 h-5" />;
  if (category.includes('Çöp') || category.includes('Temiz')) return <Trash2 className="w-5 h-5" />;
  if (category.includes('Park') || category.includes('Bahçe')) return <TreePine className="w-5 h-5" />;
  if (category.includes('Aydınlatma') || category.includes('Işık')) return <Lightbulb className="w-5 h-5" />;
  return <AlertCircle className="w-5 h-5" />;
};

const getStatusBadge = (status: string, lang: Lang) => {
  const label = t(`status.${status}`, lang);
  switch (status) {
    case 'RESOLVED':
      return <span className="px-2.5 py-1 text-[10px] font-medium tracking-wide uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">{label}</span>;
    case 'PROCESSING':
      return <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-primary dark:bg-primary/25 dark:text-secondary">{label}</span>;
    case 'REJECTED':
      return <span className="px-2.5 py-1 text-[10px] font-medium tracking-wide uppercase bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">{label}</span>;
    default:
      return <span className="px-2.5 py-1 text-[10px] font-medium tracking-wide uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">{label}</span>;
  }
};

export default function Home({ onNavigate, onOpenReport, lang, isDark }: HomeProps) {
  const [reports, setReports] = useState<ApiReportList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await getMyReports(0, 20);
      setReports(data.content || []);
    } catch (e) {
      console.error('Raporlar yüklenemedi', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-6"
    >
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-secondary p-5 text-white shadow-xl shadow-primary/20">
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-1">{t('home.hero.title', lang)}</h2>
          <p className="mb-4 text-sm text-white/85">{t('home.hero.desc', lang)}</p>
          <button 
            onClick={() => onNavigate('report')}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-slate-900 shadow-md active:scale-95 transition-transform"
          >
            {t('home.hero.btn', lang)}
          </button>
        </div>
        <div className="absolute -bottom-6 -right-6 opacity-20">
          <AlertCircle className="w-32 h-32" />
        </div>
      </div>

      {/* Reports */}
      <div>
        <h3 className={`font-bold tracking-tight mb-4 px-1 flex items-center justify-between ${isDark ? 'text-white' : 'text-slate-800'}`}>
          <span>{t('home.reports.title', lang)}</span>
          <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {t('home.reports.count', lang, { n: reports.length })}
          </span>
        </h3>
        
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className={`rounded-2xl p-4 border animate-pulse ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                  <div className="flex-1 space-y-2">
                    <div className={`h-4 rounded w-3/4 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                    <div className={`h-3 rounded w-1/2 ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className={`text-center py-12 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <HardHat className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{t('home.reports.empty.title', lang)}</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>{t('home.reports.empty.desc', lang)}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report, idx) => (
              <motion.div 
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                role={onOpenReport ? 'button' : undefined}
                tabIndex={onOpenReport ? 0 : undefined}
                onClick={() => onOpenReport?.(report.id)}
                onKeyDown={(ev) => {
                  if (onOpenReport && (ev.key === 'Enter' || ev.key === ' ')) {
                    ev.preventDefault();
                    onOpenReport(report.id);
                  }
                }}
                className={`rounded-2xl p-4 shadow-sm border flex flex-col gap-3 ${onOpenReport ? 'cursor-pointer active:scale-[0.99]' : ''} ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                      {getCategoryIcon(report.categoryName)}
                    </div>
                    <div className="min-w-0">
                      <h4 className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{report.title}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{report.categoryName}</span>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(report.status, lang)}
                </div>
                
                <div className={`flex justify-between items-center pt-2 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(report.createdAt).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{report.district || `${report.latitude?.toFixed(4)}, ${report.longitude?.toFixed(4)}`}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
