import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ClipboardList, Calendar, ArrowRight, Hash } from 'lucide-react';
import { api } from '../services/api';
import { WATERMARK_IMAGES } from '../types';
import { cn } from '../lib/utils';
import PrescriptionDetailModal from './PrescriptionDetailModal';
import { TCMData } from './PrescriptionForm';

interface PrescriptionSummaryProps {
  onPrescriptionClick: (date: string) => void;
  onHerbClick?: (name: string, prescriptionName?: string) => void;
  initialPrescriptionName?: string;
  onPrescriptionHandled?: () => void;
}

export default function PrescriptionSummary({ onPrescriptionClick, onHerbClick, initialPrescriptionName, onPrescriptionHandled }: PrescriptionSummaryProps) {
  const [prescriptions, setPrescriptions] = useState<{ date: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTcm, setSelectedTcm] = useState<TCMData | null>(null);
  const [allJournalData, setAllJournalData] = useState<Record<string, any>>({});

  useEffect(() => {
    const loadPrescriptions = async () => {
      try {
        const data = await api.getJournals();
        setAllJournalData(data);
        const list: { date: string; name: string }[] = [];
        
        Object.entries(data).forEach(([date, content]: [string, any]) => {
          if (content.tcm) {
            list.push({
              date,
              name: content.tcm.name || `未命名药方 (${date})`
            });
          }
        });
        
        // Sort by date descending
        list.sort((a, b) => b.date.localeCompare(a.date));
        setPrescriptions(list);
      } catch (e) {
        console.error('Failed to load prescriptions summary', e);
      } finally {
        setLoading(false);
      }
    };
    loadPrescriptions();
  }, []);

  useEffect(() => {
    if (initialPrescriptionName && !loading && Object.keys(allJournalData).length > 0) {
      const entry = Object.values(allJournalData).find(day => day?.tcm?.name === initialPrescriptionName);
      if (entry && entry.tcm) {
        setSelectedTcm(entry.tcm);
        onPrescriptionHandled?.();
      }
    }
  }, [initialPrescriptionName, loading, allJournalData, onPrescriptionHandled]);

  const filteredPrescriptions = prescriptions.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.date.includes(searchQuery)
  );

  return (
    <div className="flex-1 h-full overflow-y-auto relative z-10 bg-surface">
      <div 
        className="watermark-bg opacity-[0.05]" 
        style={{ backgroundImage: `url(${WATERMARK_IMAGES.BAMBOO})`, opacity: 0.08 }} 
      />
      
      <div className="max-w-4xl mx-auto p-12 relative z-10">
        <header className="mb-12 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-900/5 rounded-2xl border border-emerald-900/10">
              <ClipboardList className="w-6 h-6 text-emerald-800" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-emerald-950 tracking-tight">药方归总</h1>
              <p className="text-emerald-900/40 text-xs font-medium uppercase tracking-widest mt-1">Prescription Archive</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-900/30" />
              <input 
                type="text"
                placeholder="检索药方名称或日期..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-emerald-950/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all font-medium text-sm"
              />
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
              <Hash className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-900 font-bold text-sm">共 {prescriptions.length} 首药方</span>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-800"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredPrescriptions.map((p, idx) => (
              <motion.button
                key={`${p.date}-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => {
                  const journal = allJournalData[p.date];
                  if (journal && journal.tcm) {
                    setSelectedTcm(journal.tcm);
                  }
                }}
                className="group flex items-center justify-between p-5 bg-white border border-emerald-950/5 rounded-2xl hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-900/5 transition-all text-left"
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-emerald-950 group-hover:text-emerald-800 transition-colors">
                    {p.name}
                  </h3>
                  <div className="flex items-center gap-2 text-emerald-900/40 font-medium">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[10px] uppercase tracking-wider">{p.date}</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all">
                  <ArrowRight className="w-4 h-4 text-emerald-600" />
                </div>
              </motion.button>
            ))}
            
            {filteredPrescriptions.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-4">
                <div className="inline-flex p-4 bg-emerald-50 rounded-full">
                  <ClipboardList className="w-8 h-8 text-emerald-200" />
                </div>
                <p className="text-emerald-900/30 font-medium">未找到相关药方记录</p>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedTcm && (
          <PrescriptionDetailModal 
            data={selectedTcm}
            onClose={() => setSelectedTcm(null)}
            onGoToDate={onPrescriptionClick}
            onHerbClick={onHerbClick}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
