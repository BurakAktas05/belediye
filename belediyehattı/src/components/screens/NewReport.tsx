import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Camera, MapPin, AlertTriangle, FileText, CheckCircle2, ChevronLeft, ArrowRight, Lightbulb, Construction, Trash2, TreePine, Navigation } from 'lucide-react';
import { getCategories, createReport, ApiCategory } from '../../api';

interface NewReportProps {
  onSubmit: () => void;
  onCancel: () => void;
}

const getCategoryIcon = (name: string) => {
  if (name.includes('Çukur') || name.includes('Yol')) return Construction;
  if (name.includes('Çöp') || name.includes('Temiz')) return Trash2;
  if (name.includes('Park') || name.includes('Bahçe')) return TreePine;
  if (name.includes('Aydınlatma') || name.includes('Işık')) return Lightbulb;
  return AlertTriangle;
};

export default function NewReport({ onSubmit, onCancel }: NewReportProps) {
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ApiCategory | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationText, setLocationText] = useState('');
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
      setLocationText('Konum servisi desteklenmiyor');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocationText(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        setLocating(false);
      },
      () => {
        setLocationText('Konum alınamadı');
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
      await createReport(title, description, selectedCategory.id, latitude, longitude);
      onSubmit();
    } catch (err: any) {
      setError(err.message || 'Rapor gönderilemedi');
      setIsSubmitting(false);
    }
  };

  const generatePetitionText = () => {
    const today = new Date().toLocaleDateString('tr-TR');
    return `T.C. İLGİLİ BELEDİYE BAŞKANLIĞINA,

Tarih: ${today}
Konu: ${selectedCategory?.name} — Şikayet ve İyileştirme Talebi

Başlık: "${title}"

Aşağıda belirtmiş olduğum konumda (${locationText || 'GPS Koordinatları'}), "${selectedCategory?.name}" kategorisinde bir sorun tespit etmiş bulunmaktayım. 

Detaylı açıklama:
"${description}"

Gerekli incelemelerin yapılarak mağduriyetin giderilmesi hususunda gereğini arz ederim.

Saygılarımla,
[Sistem tarafından adınız eklenecektir]`;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <button onClick={step === 1 ? onCancel : () => setStep(step - 1)} className="p-2 -ml-2 text-slate-500">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="font-semibold text-slate-800 text-sm">
          {step === 1 ? 'Kategori Seçimi' : step === 2 ? 'Detaylar' : 'Dilekçe Önizleme'}
        </span>
        <div className="w-10" />
      </div>

      {/* Progress */}
      <div className="bg-slate-100 h-1 w-full">
        <div 
          className="bg-blue-600 h-full transition-all duration-300 ease-out"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-xl font-bold mb-2">Hangi konuda bildirim yapmak istiyorsunuz?</h2>
            <p className="text-slate-500 text-sm mb-6">İlgili birimlere doğru yönlendirme yapabilmemiz için kategoriyi seçin.</p>
            
            <div className="grid grid-cols-2 gap-3">
              {categories.map(cat => {
                const Icon = getCategoryIcon(cat.name);
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all shadow-sm ${
                      selectedCategory?.id === cat.id 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${
                      selectedCategory?.id === cat.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`font-semibold text-sm ${
                      selectedCategory?.id === cat.id ? 'text-blue-900' : 'text-slate-700'
                    }`}>{cat.name}</span>
                    {cat.description && (
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{cat.description}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Başlık
              </label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Yolda derin çukur var"
                minLength={10}
                maxLength={150}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
              />
              <p className="text-[11px] text-slate-400 mt-1 text-right">{title.length}/150</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" /> Konum
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={locationText}
                  readOnly
                  placeholder="Konum bilgisi alınacak"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                />
                <button 
                  onClick={handleGetLocation}
                  disabled={locating}
                  className="bg-blue-600 text-white px-4 rounded-xl flex items-center gap-2 text-sm font-medium active:scale-95 transition-all disabled:opacity-60"
                >
                  {locating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" /> Fotoğraf Ekle
              </label>
              <button className="w-full aspect-[21/9] bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 transition-colors">
                <Camera className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Tıkla ve Yükle</span>
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Detaylı Açıklama
              </label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Lütfen sorunu detaylıca açıklayın..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400 resize-none"
              />
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
              <p className="font-semibold mb-1 flex items-center gap-2"><FileText className="w-4 h-4" /> Resmi Dilekçe Önizlemesi</p>
              <p className="opacity-80">Girdiğiniz bilgilerle arka planda ilgili kuruma iletilecek resmi dilekçe metni aşağıdaki gibidir.</p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 font-serif text-sm leading-relaxed text-slate-700 whitespace-pre-wrap shadow-sm relative">
              {generatePetitionText()}
              <div className="absolute top-4 right-4 text-slate-200">
                <FileText className="w-12 h-12 opacity-20" />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">
                {error}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Footer Action */}
      <div className="p-4 border-t border-slate-200 bg-white">
        {step < 3 ? (
          <button 
            onClick={handleNext}
            disabled={step === 1 ? !selectedCategory : (!title || !description || latitude === null)}
            className="w-full bg-blue-600 text-white rounded-xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400 transition-colors active:scale-95 shadow-md shadow-blue-200"
          >
            Devam Et <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white rounded-xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-blue-200 disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> İletiliyor...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Dilekçeyi İmzala ve Gönder
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
