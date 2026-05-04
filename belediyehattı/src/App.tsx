import { useState, useEffect } from 'react';
import { Home as HomeIcon, PlusCircle, User, Bell } from 'lucide-react';
import { getSavedUser, clearTokens, getUnreadCount, AuthUser } from './api';
import AuthScreen from './components/screens/AuthScreen';
import Home from './components/screens/Home';
import NewReport from './components/screens/NewReport';
import Profile from './components/screens/Profile';
import Notifications from './components/screens/Notifications';

export type Tab = 'home' | 'report' | 'profile' | 'notifications';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [user, setUser] = useState<AuthUser | null>(getSavedUser());
  const [unreadCount, setUnreadCount] = useState(0);
  const [key, setKey] = useState(0); // Force re-render on report submit

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch { /* ignore */ }
  };

  const handleAuth = (authUser: AuthUser) => {
    setUser(authUser);
    setActiveTab('home');
  };

  const handleLogout = () => {
    clearTokens();
    setUser(null);
    setActiveTab('home');
  };

  const handleReportSubmit = () => {
    setKey(k => k + 1); // Force Home to reload
    setActiveTab('home');
  };

  // Not authenticated — show login
  if (!user) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans text-slate-900">
      {/* Mobile Simulator Container */}
      <div className="w-full max-w-md bg-slate-50 flex flex-col h-screen relative shadow-2xl overflow-hidden sm:border-x sm:border-slate-200">
        
        {/* Header */}
        <header className="bg-white px-6 py-4 shadow-sm z-10 flex justify-between items-center shrink-0 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">KentGözü</h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide">Daha iyi bir şehir için</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('notifications')}
              className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-5 h-5 text-slate-600" strokeWidth={activeTab === 'notifications' ? 2.5 : 2} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-slate-50 pb-20">
          {activeTab === 'home' && <Home key={key} onNavigate={setActiveTab} />}
          {activeTab === 'report' && <NewReport onSubmit={handleReportSubmit} onCancel={() => setActiveTab('home')} />}
          {activeTab === 'profile' && <Profile onLogout={handleLogout} />}
          {activeTab === 'notifications' && <Notifications onBadgeUpdate={setUnreadCount} />}
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 w-full bg-white border-t border-slate-200 flex justify-around items-center pb-safe pt-2 px-2 shadow-lg z-20">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center p-3 w-20 transition-colors ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <HomeIcon className="w-6 h-6 mb-1" strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Akış</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('report')}
            className="flex flex-col items-center justify-center -mt-8 mb-2"
          >
            <div className={`p-4 rounded-full shadow-lg shadow-blue-200 transition-transform active:scale-95 ${activeTab === 'report' ? 'bg-blue-700' : 'bg-blue-600'}`}>
              <PlusCircle className="w-8 h-8 text-white" strokeWidth={2} />
            </div>
          </button>
          
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center p-3 w-20 transition-colors ${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <User className="w-6 h-6 mb-1" strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Profilim</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
