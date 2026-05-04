import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Award, Star, List, Settings, ChevronRight, LogOut, Shield, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { getMyProfile, getMyReports, ApiUserProfile, ApiReportList, logout as apiLogout } from '../../api';

interface ProfileProps {
  onLogout: () => void;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'RESOLVED': return { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-600', label: 'Çözüldü' };
    case 'PROCESSING': return { icon: <Loader2 className="w-4 h-4" />, color: 'text-blue-600', label: 'İşlemde' };
    case 'REJECTED': return { icon: <XCircle className="w-4 h-4" />, color: 'text-red-600', label: 'Reddedildi' };
    default: return { icon: <Clock className="w-4 h-4" />, color: 'text-amber-600', label: 'Bekliyor' };
  }
};

const getRoleLabel = (role: string) => {
  const map: Record<string, string> = {
    'ROLE_CITIZEN': 'Vatandaş',
    'ROLE_FIELD_OFFICER': 'Saha Görevlisi',
    'ROLE_DEPT_MANAGER': 'Birim Müdürü',
    'ROLE_ADMIN': 'Yönetici',
    'ROLE_SUPER_ADMIN': 'Süper Admin',
  };
  return map[role] || role;
};

export default function Profile({ onLogout }: ProfileProps) {
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
  const level = points >= 1000 ? 'Şehir Kahramanı' : points >= 500 ? 'Şehir Gönüllüsü' : points >= 200 ? 'Aktif Vatandaş' : 'Yeni Üye';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-6"
    >
      {/* Header Background */}
      <div className="bg-slate-900 pt-8 pb-16 px-6 text-white rounded-b-3xl shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-white/20 shadow-inner">
            <span className="text-2xl font-bold text-white">
              {profile ? profile.firstName.charAt(0) : '?'}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile ? `${profile.firstName} ${profile.lastName}` : '—'}</h2>
            <p className="text-slate-400 flex items-center gap-1.5 text-sm mt-0.5">
              <Award className="w-4 h-4" /> {level}
            </p>
            <div className="flex gap-1.5 mt-1.5">
              {profile?.roles.map(r => (
                <span key={r} className="px-2 py-0.5 bg-white/10 rounded-full text-[10px] font-medium flex items-center gap-1">
                  <Shield className="w-3 h-3" /> {getRoleLabel(r)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-200 flex items-center justify-between">
          <div className="flex-1 text-center border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Toplam Puan</p>
            <p className="text-2xl font-black text-amber-500 flex items-center justify-center gap-1">
              {points} <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </p>
          </div>
          <div className="flex-1 text-center border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Bildirimler</p>
            <p className="text-2xl font-black text-slate-800">{reports.length}</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Çözülen</p>
            <p className="text-2xl font-black text-emerald-500">{resolvedCount}</p>
          </div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="px-5 mt-6">
        <div className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-2xl p-4 border border-amber-200 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-amber-900 text-sm">
              {points < 1000 ? 'Şehrin Kahramanı Olmaya Az Kaldı!' : 'Tebrikler! Şehir Kahramanısın! 🏆'}
            </h4>
            <p className="text-xs text-amber-700 mt-1">
              {points < 1000 ? `${1000 - points} puan daha topla, rozeti kap.` : 'En yüksek seviyeye ulaştın!'}
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center">
            <Award className="w-6 h-6 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div className="px-5 mt-8 space-y-3">
        <h3 className="font-bold text-slate-800 tracking-tight mb-2 px-1">Hesap</h3>
        
        <button 
          onClick={() => setShowReports(!showReports)}
          className="w-full flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200 active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
              <List className="w-5 h-5" />
            </div>
            <span className="font-semibold text-slate-700 text-sm">Geçmiş Bildirimlerim</span>
          </div>
          <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${showReports ? 'rotate-90' : ''}`} />
        </button>

        {showReports && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2 pl-2 overflow-hidden"
          >
            {reports.length === 0 ? (
              <p className="text-sm text-slate-400 p-3">Henüz bildiriminiz yok</p>
            ) : (
              reports.map(r => {
                const status = getStatusInfo(r.status);
                return (
                  <div key={r.id} className="bg-white rounded-xl p-3 border border-slate-200 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700 truncate">{r.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{r.categoryName} • {new Date(r.createdAt).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <span className={`flex items-center gap-1 text-[11px] font-semibold ${status.color} ml-2 flex-shrink-0`}>
                      {status.icon} {status.label}
                    </span>
                  </div>
                );
              })
            )}
          </motion.div>
        )}

        <button className="w-full flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200 active:scale-95 transition-transform">
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 text-slate-600 p-2 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <span className="font-semibold text-slate-700 text-sm">Ayarlar ve Gizlilik</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-between bg-red-50 p-4 rounded-2xl border border-red-200 active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="bg-red-100 text-red-600 p-2 rounded-xl">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-semibold text-red-700 text-sm">Çıkış Yap</span>
          </div>
        </button>
      </div>
    </motion.div>
  );
}
