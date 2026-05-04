import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { Report } from './api';
import { motion, AnimatePresence } from 'framer-motion';

// Fix leaflet icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RecenterMap = ({ coords }: { coords: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(coords, 13);
  }, [coords]);
  return null;
};

const LiveMap = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [newReport, setNewReport] = useState<Report | null>(null);

  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/ws-belediye');
    const stompClient = Stomp.over(socket);
    stompClient.debug = () => {};

    stompClient.connect({}, () => {
      stompClient.subscribe('/topic/reports', (msg) => {
        const report = JSON.parse(msg.body);
        setReports(prev => [report, ...prev].slice(0, 50));
        setNewReport(report);
        setTimeout(() => setNewReport(null), 5000);
      });
    });

    return () => stompClient.disconnect(() => {});
  }, []);

  return (
    <div className="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800">
      <MapContainer center={[41.0082, 28.9784]} zoom={11} className="h-full w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{s}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {reports.map((report) => (
          <Marker key={report.id} position={[report.latitude, report.longitude]}>
            <Popup>
              <div className="p-2">
                <h4 className="font-bold text-primary">{report.title}</h4>
                <p className="text-xs text-slate-500 mb-2">{report.categoryName} • {report.district}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  report.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {report.status}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
        {newReport && <RecenterMap coords={[newReport.latitude, newReport.longitude]} />}
      </MapContainer>

      <AnimatePresence>
        {newReport && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="absolute top-6 right-6 z-[1000] w-72 p-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border-l-4 border-primary"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <AlertCircle size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-primary uppercase">Yeni İhbar!</p>
                <p className="text-sm font-bold text-slate-900 truncate">{newReport.title}</p>
                <p className="text-xs text-slate-500">{newReport.district}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveMap;

import { AlertCircle } from 'lucide-react';
