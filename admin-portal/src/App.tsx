import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  Bell, 
  Search, 
  Menu, 
  X,
  Building2,
  PieChart,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from './api';

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
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Belediye Yönetim</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
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

const Header = ({ setSidebarOpen }: { setSidebarOpen: (o: boolean) => void }) => {
  return (
    <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-6 flex items-center justify-between">
      <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg">
        <Menu />
      </button>

      <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 w-96">
        <Search size={18} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="Rapor ara, personel bul..." 
          className="bg-transparent border-none focus:ring-0 px-3 text-sm w-full"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>
        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-2"></div>
        <button className="flex items-center gap-2 p-1 pr-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <div className="w-8 h-8 bg-primary rounded-full"></div>
          <span className="text-sm font-medium hidden sm:inline">Yönetici Paneli</span>
        </button>
      </div>
    </header>
  );
};

import LiveMap from './LiveMap';

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get('/dashboard/stats').then(res => setStats(res.data.data));
  }, []);

  if (!stats) return null;

  const statCards = [
    { name: 'Toplam Rapor', value: stats.totalReports, color: 'bg-blue-500', icon: FileText },
    { name: 'Bekleyen', value: stats.pendingReports, color: 'bg-amber-500', icon: Clock },
    { name: 'İşleniyor', value: stats.processingReports, color: 'bg-indigo-500', icon: AlertCircle },
    { name: 'Çözülen', value: stats.resolvedReports, color: 'bg-emerald-500', icon: CheckCircle2 },
  ];

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Hoş Geldiniz 👋</h2>
          <p className="text-slate-500">Belediye yönetim sistemindeki güncel durum özetiniz.</p>
        </div>
        <button className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl font-medium shadow-sm hover:bg-slate-50 transition-colors">
          <Download size={18} />
          Dışa Aktar (.xlsx)
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.name}
            className="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300 group"
          >
            <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <p className="text-slate-500 font-medium">{stat.name}</p>
            <p className="text-3xl font-bold mt-1">{stat.value}</p>
            <div className="mt-4 flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg w-fit">
              +12% Geçen haftadan
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">Canlı Takip Haritası</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-xs font-bold text-slate-500 uppercase">Canlı Bağlantı Aktif</span>
              </div>
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me').then(res => {
        setUser(res.data.data);
      }).catch(() => {
        localStorage.clear();
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center">Yükleniyor...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={setUser} />} />
        
        <Route path="/*" element={
          !user ? <Navigate to="/login" /> : (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
              <Sidebar isOpen={sidebarOpen} setOpen={setSidebarOpen} user={user} />
              
              <div className="flex-1 lg:ml-72 flex flex-col">
                <Header setSidebarOpen={setSidebarOpen} />
                <main className="flex-1 overflow-x-hidden">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/reports" element={<div className="p-6">Rapor Listesi Gelecek...</div>} />
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
