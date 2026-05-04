import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  LogOut,
  Bell,
  Search,
  Menu,
  Building2,
  PieChart,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  Moon,
  Sun,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { type Stats } from './api';
import LiveMap from './LiveMap';
import ReportsPage from './pages/ReportsPage';
import ReportDetailPage from './pages/ReportDetailPage';
import StatisticsPage from './pages/StatisticsPage';
import DepartmentsPage from './pages/DepartmentsPage';
import PlaceholderPage from './pages/PlaceholderPage';

// --- Types ---
interface User {
  fullName: string;
  email: string;
  roles: string[];
  district?: string;
}

// --- Components ---
const Sidebar = ({ isOpen, setOpen, user }: { isOpen: boolean, setOpen: (o: boolean) => void, user: User }) => {
  const location = useLocation();
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Raporlar', icon: FileText, path: '/reports' },
    { name: 'Personeller', icon: Users, path: '/staff' },
    { name: 'Departmanlar', icon: Building2, path: '/departments' },
    { name: 'İstatistikler', icon: PieChart, path: '/stats' },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      <div className="flex flex-col h-full">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">KentGözü</h1>
            <p className="text-xs font-medium uppercase tracking-wider text-secondary">v3 · Belediye yönetim</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {menuItems.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center font-bold text-primary">
              {user.fullName[0]}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-sm truncate">{user.fullName}</p>
              <p className="text-xs text-slate-500 truncate">{user.district || 'Süper Admin'}</p>
            </div>
          </div>
          <button 
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors font-medium text-sm"
          >
            <LogOut size={18} />
            Çıkış Yap
          </button>
        </div>
      </div>
    </aside>
  );
};

const Header = ({
  setSidebarOpen,
  darkMode,
  onToggleDark,
}: {
  setSidebarOpen: (o: boolean) => void;
  darkMode: boolean;
  onToggleDark: () => void;
}) => {
  return (
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800">
        <Menu />
      </button>

      <div className="hidden w-96 items-center rounded-full bg-slate-100 px-4 py-2 dark:bg-slate-800 md:flex">
        <Search size={18} className="text-slate-400" />
        <input
          type="search"
          placeholder="Rapor ara… (v3)"
          className="w-full border-none bg-transparent px-3 text-sm focus:ring-0 dark:text-slate-100"
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={onToggleDark}
          className="rounded-full p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800"
          title={darkMode ? 'Açık tema' : 'Koyu tema'}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button type="button" className="relative rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
          <Bell size={20} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
        </button>
        <div className="mx-1 hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-800" />
        <div className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-slate-100 dark:hover:bg-slate-800">
          <div className="h-8 w-8 shrink-0 rounded-full bg-primary" />
          <span className="hidden text-sm font-medium sm:inline">Yönetici</span>
        </div>
      </div>
    </header>
  );
};

const DashboardSkeleton = () => (
  <div className="space-y-8 p-6">
    <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-36 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />
      ))}
    </div>
    <div className="h-[420px] animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then((res) => setStats(res.data.data))
      .catch(() => setStatsError('İstatistikler alınamadı.'));
  }, []);

  if (statsError) {
    return (
      <div className="p-6">
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{statsError}</p>
      </div>
    );
  }

  if (!stats) return <DashboardSkeleton />;

  const statCards = [
    { name: 'Toplam Rapor', value: stats.totalReports, color: 'bg-primary', icon: FileText },
    { name: 'Bekleyen', value: stats.pendingReports, color: 'bg-amber-500', icon: Clock },
    { name: 'İşleniyor', value: stats.processingReports, color: 'bg-secondary', icon: AlertCircle },
    { name: 'Çözülen', value: stats.resolvedReports, color: 'bg-emerald-500', icon: CheckCircle2 },
    { name: 'Reddedilen', value: stats.rejectedReports, color: 'bg-red-500', icon: AlertCircle },
  ];

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Hoş geldiniz</h2>
          <p className="text-slate-500 dark:text-slate-400">KentGözü v3 — özet ve canlı harita.</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 font-medium shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
        >
          <Download size={18} />
          Dışa aktar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            key={stat.name}
            className="group rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
          >
            <div className={`${stat.color} mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-white transition-transform group-hover:scale-105`}>
              <stat.icon size={24} />
            </div>
            <p className="font-medium text-slate-500 dark:text-slate-400">{stat.name}</p>
            <p className="mt-1 text-3xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-bold">Canlı harita</h3>
              <span className="text-xs font-bold uppercase text-slate-500">Isı + işaretçi · REST ön yükleme</span>
            </div>
            <LiveMap />
          </div>
        </div>

        <div className="bg-primary p-8 rounded-3xl text-white shadow-xl shadow-primary/20 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Hızlı Duyuru</h3>
            <p className="text-primary-100 text-sm mb-6">Tüm personele anlık bildirim gönderebilirsiniz.</p>
            <textarea 
              className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder:text-white/40 focus:ring-2 focus:ring-white/30 resize-none h-32 mb-4"
              placeholder="Mesajınızı yazın..."
            ></textarea>
            <button className="w-full bg-white text-primary font-bold py-3 rounded-2xl hover:bg-slate-50 transition-colors">
              Hemen Yayınla
            </button>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/20 rounded-full -ml-12 -mb-12 blur-xl"></div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---
const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('kentgozu_theme') === 'dark');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me').then(res => {
        const d = res.data.data;
        setUser({ fullName: d.fullName, email: d.email, roles: d.roles ? [...d.roles] : [], district: d.district });
      }).catch(() => {
        localStorage.clear();
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('kentgozu_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('kentgozu_theme', 'light');
    }
  }, [darkMode]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-300">Yükleniyor…</div>;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={setUser} />} />
        
        <Route path="/*" element={
          !user ? <Navigate to="/login" /> : (
            <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
              <Sidebar isOpen={sidebarOpen} setOpen={setSidebarOpen} user={user} />
              
              <div className="flex flex-1 flex-col lg:ml-72">
                <Header
                  setSidebarOpen={setSidebarOpen}
                  darkMode={darkMode}
                  onToggleDark={() => setDarkMode((d) => !d)}
                />
                <main className="flex-1 overflow-x-hidden">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/reports/:id" element={<ReportDetailPage />} />
                    <Route path="/stats" element={<StatisticsPage />} />
                    <Route
                      path="/staff"
                      element={
                        <PlaceholderPage title="Personeller" description="Personel yönetimi ve roller v3 yol haritasında." />
                      }
                    />
                    <Route path="/departments" element={<DepartmentsPage />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </main>
              </div>

              {/* Mobile Sidebar Overlay */}
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
                  ></motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        } />
      </Routes>
    </Router>
  );
};

const Login = ({ onLogin }: { onLogin: (u: User) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.data.accessToken);
      onLogin(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Giriş yapılamadı');
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 hidden lg:flex bg-primary relative overflow-hidden items-center justify-center text-white">
        <div className="relative z-10 p-20 max-w-2xl">
          <h1 className="text-6xl font-black mb-6 leading-tight">Yarınları Birlikte<br/>Yönetiyoruz.</h1>
          <p className="text-xl text-primary-100">KentGözü Yönetim Portalı ile şehrin nabzını tutun, sorunları anında çözüme kavuşturun.</p>
          
          <div className="mt-12 grid grid-cols-2 gap-8">
            <div className="p-6 bg-white/10 rounded-3xl border border-white/20 backdrop-blur-md">
              <p className="text-3xl font-bold">100%</p>
              <p className="text-primary-100 text-sm">Gerçek Zamanlı İzleme</p>
            </div>
            <div className="p-6 bg-white/10 rounded-3xl border border-white/20 backdrop-blur-md">
              <p className="text-3xl font-bold">24/7</p>
              <p className="text-primary-100 text-sm">Aktif Koordinasyon</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full -mr-48 -mt-48 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/30 rounded-full -ml-48 -mb-48 blur-3xl"></div>
      </div>

      <div className="w-full lg:w-[500px] bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-12">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-primary/20">
              <Building2 size={32} />
            </div>
            <h2 className="text-3xl font-bold mb-2">Giriş Yapın</h2>
            <p className="text-slate-500">Yönetim yetkilerinizle devam edin.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">E-posta</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border-slate-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
                placeholder="admin@ibb.gov.tr"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Şifre</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border-slate-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            <button className="w-full bg-primary text-white font-bold py-4 rounded-2xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0">
              Devam Et
            </button>
          </form>

          <p className="mt-12 text-center text-slate-400 text-sm font-medium">
            © 2026 İstanbul Büyükşehir Belediyesi
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
