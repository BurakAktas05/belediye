// İstanbul ilçe merkezleri koordinatları — rapor hangi ilçeye düşecek tespiti için
export interface District {
  name: string;
  lat: number;
  lng: number;
}

export const ISTANBUL_DISTRICTS: District[] = [
  { name: 'Adalar', lat: 40.8761, lng: 29.0900 },
  { name: 'Arnavutköy', lat: 41.1850, lng: 28.7394 },
  { name: 'Ataşehir', lat: 40.9923, lng: 29.1244 },
  { name: 'Avcılar', lat: 40.9796, lng: 28.7217 },
  { name: 'Bağcılar', lat: 41.0393, lng: 28.8567 },
  { name: 'Bahçelievler', lat: 41.0039, lng: 28.8617 },
  { name: 'Bakırköy', lat: 40.9819, lng: 28.8719 },
  { name: 'Başakşehir', lat: 41.0945, lng: 28.8012 },
  { name: 'Bayrampaşa', lat: 41.0467, lng: 28.9022 },
  { name: 'Beşiktaş', lat: 41.0422, lng: 29.0083 },
  { name: 'Beykoz', lat: 41.1322, lng: 29.1000 },
  { name: 'Beylikdüzü', lat: 41.0050, lng: 28.6422 },
  { name: 'Beyoğlu', lat: 41.0370, lng: 28.9770 },
  { name: 'Büyükçekmece', lat: 41.0200, lng: 28.5850 },
  { name: 'Çatalca', lat: 41.1433, lng: 28.4600 },
  { name: 'Çekmeköy', lat: 41.0350, lng: 29.1800 },
  { name: 'Esenler', lat: 41.0539, lng: 28.8756 },
  { name: 'Esenyurt', lat: 41.0283, lng: 28.6767 },
  { name: 'Eyüpsultan', lat: 41.0486, lng: 28.9344 },
  { name: 'Fatih', lat: 41.0186, lng: 28.9397 },
  { name: 'Gaziosmanpaşa', lat: 41.0653, lng: 28.9133 },
  { name: 'Güngören', lat: 41.0200, lng: 28.8767 },
  { name: 'Kadıköy', lat: 40.9928, lng: 29.0261 },
  { name: 'Kağıthane', lat: 41.0800, lng: 28.9700 },
  { name: 'Kartal', lat: 40.9067, lng: 29.1867 },
  { name: 'Küçükçekmece', lat: 41.0033, lng: 28.7733 },
  { name: 'Maltepe', lat: 40.9350, lng: 29.1317 },
  { name: 'Pendik', lat: 40.8800, lng: 29.2333 },
  { name: 'Sancaktepe', lat: 41.0033, lng: 29.2350 },
  { name: 'Sarıyer', lat: 41.1667, lng: 29.0500 },
  { name: 'Silivri', lat: 41.0733, lng: 28.2467 },
  { name: 'Sultanbeyli', lat: 40.9683, lng: 29.2617 },
  { name: 'Sultangazi', lat: 41.1050, lng: 28.8683 },
  { name: 'Şile', lat: 41.1750, lng: 29.6117 },
  { name: 'Şişli', lat: 41.0600, lng: 28.9867 },
  { name: 'Tuzla', lat: 40.8217, lng: 29.3017 },
  { name: 'Ümraniye', lat: 41.0267, lng: 29.0917 },
  { name: 'Üsküdar', lat: 41.0233, lng: 29.0153 },
  { name: 'Zeytinburnu', lat: 41.0044, lng: 28.9017 },
];

/**
 * Haversine formülü ile iki koordinat arasındaki mesafeyi km cinsinden hesaplar.
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Verilen koordinata en yakın İstanbul ilçesini bulur.
 */
export function detectDistrict(lat: number, lng: number): District | null {
  let closest: District | null = null;
  let minDist = Infinity;
  for (const d of ISTANBUL_DISTRICTS) {
    const dist = haversineDistance(lat, lng, d.lat, d.lng);
    if (dist < minDist) {
      minDist = dist;
      closest = d;
    }
  }
  return closest;
}
