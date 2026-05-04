import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Camera, MapPin, AlertTriangle, FileText, CheckCircle2, ChevronLeft, ArrowRight, Lightbulb, Construction, Trash2, TreePine, Navigation, Building2 } from 'lucide-react';
import { getCategories, createReport, ApiCategory } from '../../api';
import { Lang, t } from '../../i18n';
import { detectDistrict, District } from '../../districts';

interface NewReportProps {
  onSubmit: () => void;
  onCancel: () => void;
  lang: Lang;
  isDark: boolean;
}

const getCategoryIcon = (name: string) => {
  if (name.includes('Çukur') || name.includes('Yol')) return Construction;
  if (name.includes('Çöp') || name.includes('Temiz')) return Trash2;
  if (name.includes('Park') || name.includes('Bahçe')) return TreePine;
  if (name.includes('Aydınlatma') || name.includes('Işık')) return Lightbulb;
  return AlertTriangle;
};

export default function NewReport({ onSubmit, onCancel, lang, isDark }: NewReportProps) {
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ApiCategory | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationText, setLocationText] = useState('');
  const [district, setDistrict] = useState<District | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (e) {
      console.error('Kategoriler yüklenemedi', e);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationText(t('report.location.unsupported', lang));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLatitude(latitude);
        setLongitude(longitude);
        setLocationText(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        
        // Detect closest district
        const found = detectDistrict(latitude, longitude);
        setDistrict(found);
        
        setLocating(false);
      },
      () => {
        setLocationText(t('report.location.failed', lang));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleNext = () => {
    if (step === 1 && selectedCategory) setStep(2);
    else if (step === 2 && title && description && latitude !== null) setStep(3);
  };

  const handleSubmit = async () => {
    if (!selectedCategory || !latitude || !longitude) return;
    setIsSubmitting(true);
    setError('');
    try {
      await createReport(title, description, selectedCategory.id, latitude, longitude, district?.name);
      onSubmit();
    } catch (err: any) {
      setError(err.message || 'Rapor gönderilemedi');
      setIsSubmitting(false);
    }
  };

  const generatePetitionText = () => {
    const today = new Date().toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US');
    const districtName = district ? `${district.name} ${lang === 'tr' ? 'Belediyesi' : 'Municipality'}` : 'İLGİLİ';
    
    return `T.C. ${districtName.toUpperCase()} BAŞKANLIĞINA,

Tarih: ${today}
Konu: ${selectedCategory?.name} — Şikayet ve İyileştirme Talebi

Başlık: "${title}"

Aşağıda belirtmiş olduğum konumda (${locationText || 'GPS'}), "${selectedCategory?.name}" kategorisinde bir sorun tespit etmiş bulunmaktayım. 

Detaylı açıklama:
"${description}"

Gerekli incelemelerin yapılarak mağduriyetin giderilmesi hususunda gereğini arz ederim.

Saygılarımla,
[KentGözü Kullanıcısı]`;
  };

  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <button onClick={step === 1 ? onCancel : () => setStep(step - 1)} className={`p-2 -ml-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {t(`report.step${step}`, lang)}
        </span>
        <div className="w-10" />
      </div>

      {/* Progress */}
      <div className={`${isDark ? 'bg-slate-800' : 'bg-slate-100'} h-1 w-full`}>
        <div 
          className="bg-blue-600 h-full transition-all duration-300 ease-out"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('report.step1.title', lang)}</h2>
            <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('report.step1.desc', lang)}</p>
            
            <div className="grid grid-cols-2 gap-3">
              {categories.map(cat => {
                const Icon = getCategoryIcon(cat.name);
                const isSelected = selectedCategory?.id === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all shadow-sm ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                        : isDark ? 'border-slate-800 bg-slate-800 hover:border-slate-700' : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${
                      isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/40' : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`font-semibold text-sm block ${
                      isSelected ? 'text-blue-900 dark:text-blue-300' : isDark ? 'text-slate-200' : 'text-slate-700'
                    }`}>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <div>
              <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <FileText className="w-4 h-4 text-blue-600" /> {t('report.title', lang)}
              </label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('report.title.placeholder', lang)}
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-600'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <MapPin className="w-4 h-4 text-blue-600" /> {t('report.location', lang)}
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={locating ? t('report.location.detecting', lang) : locationText}
                  readOnly
                  placeholder={t('report.location', lang)}
                  className={`flex-1 border rounded-xl px-4 py-3 text-sm outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
                <button 
                  onClick={handleGetLocation}
                  disabled={locating}
                  className="bg-blue-600 text-white px-4 rounded-xl flex items-center gap-2 text-sm font-medium active:scale-95 transition-all disabled:opacity-60"
                >
                  <Navigation className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              {district && (
                <div className={`mt-2 flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg ${isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>
                  <Building2 className="w-3.5 h-3.5" />
                  {t('report.district', lang)}: {district.name} ({t('report.district.auto', lang)})
                </div>
              )}
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Camera className="w-4 h-4 text-blue-600" /> {t('report.photo', lang)}
              </label>
              <button className={`w-full aspect-[21/9] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-colors ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-500 hover:text-blue-400 hover:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-400 hover:text-blue-600 hover:border-blue-600'
              }`}>
                <Camera className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">{t('report.photo.btn', lang)}</span>
              </button>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <FileText className="w-4 h-4 text-blue-600" /> {t('report.description', lang)}
              </label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder={t('report.description.placeholder', lang)}
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-600'
                }`}
              />
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className={`border rounded-xl p-4 text-sm ${isDark ? 'bg-amber-900/20 border-amber-800 text-amber-500' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
              <p className="font-semibold mb-1 flex items-center gap-2"><FileText className="w-4 h-4" /> {t('report.petition.title', lang)}</p>
              <p className="opacity-80">{t('report.petition.desc', lang)}</p>
            </div>

            <div className={`p-5 rounded-2xl border font-serif text-sm leading-relaxed whitespace-pre-wrap shadow-sm relative ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              {generatePetitionText()}
              <div className="absolute top-4 right-4 opacity-10">
                <FileText className="w-12 h-12" />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm p-3 rounded-xl">
                {error}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className={`p-4 border-t ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        {step < 3 ? (
          <button 
            onClick={handleNext}
            disabled={step === 1 ? !selectedCategory : (!title || !description || latitude === null)}
            className="w-full bg-blue-600 text-white rounded-xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 shadow-md shadow-blue-200 dark:shadow-none"
          >
            {t('report.next', lang)} <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white rounded-xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-blue-200 dark:shadow-none"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('report.submitting', lang)}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> {t('report.submit', lang)}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
