import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Award, Star, List, Settings as SettingsIcon, ChevronRight, LogOut, Shield, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { getMyProfile, getMyReports, ApiUserProfile, ApiReportList, logout as apiLogout } from '../../api';
import { Lang, t } from '../../i18n';

interface ProfileProps {
  onLogout: () => void;
  onSettings: () => void;
  lang: Lang;
  isDark: boolean;
}

const getStatusInfo = (status: string, lang: Lang) => {
  const label = t(`status.${status}`, lang);
  switch (status) {
    case 'RESOLVED': return { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-600 dark:text-emerald-400', label };
    case 'PROCESSING': return { icon: <Loader2 className="w-4 h-4" />, color: 'text-blue-600 dark:text-blue-400', label };
    case 'REJECTED': return { icon: <XCircle className="w-4 h-4" />, color: 'text-red-600 dark:text-red-400', label };
    default: return { icon: <Clock className="w-4 h-4" />, color: 'text-amber-600 dark:text-amber-400', label };
  }
};

export default function Profile({ onLogout, onSettings, lang, isDark }: ProfileProps) {
  const [profile, setProfile] = useState<ApiUserProfile | null>(null);
  const [reports, setReports] = useState<ApiReportList[]>([]);
  const [showReports, setShowReports] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const [p, r] = await Promise.all([
        getMyProfile(),
        getMyReports(0, 100),
      ]);
      setProfile(p);
      setReports(r.content || []);
    } catch (e) {
      console.error('Profil yüklenemedi', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await apiLogout();
    onLogout();
  };

  const resolvedCount = reports.filter(r => r.status === 'RESOLVED').length;
  const points = reports.length * 50 + resolvedCount * 100;
  
  // Dynamic level based on points
  let level = 'Yeni Üye';
  if (points >= 1000) level = 'Şehir Kahramanı';
  else if (points >= 500) level = 'Şehir Gönüllüsü';
  else if (points >= 200) level = 'Aktif Vatandaş';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-6"
    >
      {/* Header */}
      <div className={`${isDark ? 'bg-slate-800' : 'bg-slate-900'} pt-8 pb-16 px-6 text-white rounded-b-3xl shadow-md`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-white/20 shadow-inner">
            <span className="text-2xl font-bold text-white">
              {profile ? profile.firstName.charAt(0) : '?'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold truncate">{profile ? `${profile.firstName} ${profile.lastName}` : '—'}</h2>
            <p className="text-slate-300 flex items-center gap-1.5 text-sm mt-0.5">
              <Award className="w-4 h-4" /> {level}
            </p>
          </div>
          <button 
            onClick={onSettings}
            className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 -mt-8 relative z-10">
        <div className={`rounded-2xl p-5 shadow-lg shadow-slate-200/50 dark:shadow-none border flex items-center justify-between ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <div className={`flex-1 text-center border-r ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">{t('profile.points', lang)}</p>
            <p className="text-2xl font-black text-amber-500 flex items-center justify-center gap-1">
              {points} <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </p>
          </div>
          <div className={`flex-1 text-center border-r ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">{t('profile.reports', lang)}</p>
            <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{reports.length}</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">{t('profile.resolved', lang)}</p>
            <p className="text-2xl font-black text-emerald-500">{resolvedCount}</p>
          </div>
        </div>
      </div>

      {/* Level Callout */}
      <div className="px-5 mt-6">
        <div className={`rounded-2xl p-4 border flex items-center justify-between ${
          isDark ? 'bg-blue-900/10 border-blue-900/30' : 'bg-amber-100/50 border-amber-200'
        }`}>
          <div>
            <h4 className={`font-bold text-sm ${isDark ? 'text-blue-400' : 'text-amber-900'}`}>
              {points < 1000 ? t('profile.level.hero', lang) : t('profile.level.hero.done', lang)}
            </h4>
            <p className={`text-xs mt-1 ${isDark ? 'text-blue-500/70' : 'text-amber-700'}`}>
              {points < 1000 ? t('profile.level.more', lang, { n: 1000 - points }) : t('profile.level.max', lang)}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-900/30' : 'bg-amber-200'}`}>
            <Award className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-amber-600'}`} />
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="px-5 mt-8 space-y-3">
        <h3 className={`font-bold tracking-tight mb-2 px-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('profile.account', lang)}</h3>
        
        <button 
          onClick={() => setShowReports(!showReports)}
          className={`w-full flex items-center justify-between p-4 rounded-2xl shadow-sm border transition-all active:scale-95 ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              <List className="w-5 h-5" />
            </div>
            <span className={`font-semibold text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t('profile.history', lang)}</span>
          </div>
          <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${showReports ? 'rotate-90' : ''}`} />
        </button>

        {showReports && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2 pl-2"
          >
            {reports.length === 0 ? (
              <p className="text-sm text-slate-400 p-3">{t('home.reports.empty.title', lang)}</p>
            ) : (
              reports.map(r => {
                const status = getStatusInfo(r.status, lang);
                return (
                  <div key={r.id} className={`rounded-xl p-3 border flex items-center justify-between ${
                    isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'
                  }`}>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{r.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{r.categoryName} • {new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`flex items-center gap-1 text-[10px] font-bold ${status.color} ml-2 flex-shrink-0`}>
                      {status.icon} {status.label}
                    </span>
                  </div>
                );
              })
            )}
          </motion.div>
        )}

        <button 
          onClick={onSettings}
          className={`w-full flex items-center justify-between p-4 rounded-2xl shadow-sm border transition-all active:scale-95 ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>
              <SettingsIcon className="w-5 h-5" />
            </div>
            <span className={`font-semibold text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t('profile.settings', lang)}</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        <button 
          onClick={handleLogout}
          className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-95 ${
            isDark ? 'bg-red-900/10 border-red-900/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isDark ? 'bg-red-900/30' : 'bg-red-100'}`}>
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-semibold text-sm">{t('profile.logout', lang)}</span>
          </div>
        </button>
      </div>
    </motion.div>
  );
}
