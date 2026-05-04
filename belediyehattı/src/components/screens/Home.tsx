import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Clock, AlertCircle, Trash2, HardHat, Lightbulb, TreePine, Construction } from 'lucide-react';
import { getMyReports, ApiReportList } from '../../api';

interface HomeProps {
  onNavigate: (tab: 'report') => void;
  onViewReport?: (id: string) => void;
}

const getCategoryIcon = (category: string) => {
  if (category.includes('Çukur') || category.includes('Yol')) return <Construction className="w-5 h-5" />;
  if (category.includes('Çöp') || category.includes('Temiz')) return <Trash2 className="w-5 h-5" />;
  if (category.includes('Park') || category.includes('Bahçe')) return <TreePine className="w-5 h-5" />;
  if (category.includes('Aydınlatma') || category.includes('Işık')) return <Lightbulb className="w-5 h-5" />;
  return <AlertCircle className="w-5 h-5" />;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'RESOLVED':
      return <span className="px-2.5 py-1 text-[10px] font-medium tracking-wide uppercase bg-emerald-100 text-emerald-700 rounded-full">Çözüldü</span>;
    case 'PROCESSING':
      return <span className="px-2.5 py-1 text-[10px] font-medium tracking-wide uppercase bg-blue-100 text-blue-700 rounded-full">İşlemde</span>;
    case 'REJECTED':
      return <span className="px-2.5 py-1 text-[10px] font-medium tracking-wide uppercase bg-red-100 text-red-700 rounded-full">Reddedildi</span>;
    default:
      return <span className="px-2.5 py-1 text-[10px] font-medium tracking-wide uppercase bg-amber-100 text-amber-700 rounded-full">Bekliyor</span>;
  }
};

export default function Home({ onNavigate }: HomeProps) {
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
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-5 text-white shadow-xl shadow-blue-200 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-1">Çevrendeki Sorunları Bildir</h2>
          <p className="text-blue-100 text-sm mb-4">Senin sayende şehrimiz daha yaşanabilir bir yer olacak.</p>
          <button 
            onClick={() => onNavigate('report')}
            className="bg-white text-blue-700 px-4 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
          >
            Hemen Bildir
          </button>
        </div>
        <div className="absolute -bottom-6 -right-6 opacity-20">
          <AlertCircle className="w-32 h-32" />
        </div>
      </div>

      {/* Reports */}
      <div>
        <h3 className="font-bold text-slate-800 tracking-tight mb-4 px-1 flex items-center justify-between">
          <span>Bildirimlerim</span>
          <span className="text-xs font-normal text-slate-500">{reports.length} rapor</span>
        </h3>
        
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <HardHat className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">Henüz bildiriminiz yok</p>
            <p className="text-slate-300 text-xs mt-1">İlk raporunuzu oluşturmak için "Hemen Bildir" butonuna tıklayın</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report, idx) => (
              <motion.div 
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col gap-3"
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="bg-slate-50 p-2.5 rounded-xl text-slate-600 border border-slate-100">
                      {getCategoryIcon(report.categoryName)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">{report.title}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{report.categoryName}</span>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(report.status)}
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(report.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}</span>
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
