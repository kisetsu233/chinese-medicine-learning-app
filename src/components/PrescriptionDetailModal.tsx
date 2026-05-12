import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ClipboardList, ExternalLink, Calendar, AlertCircle } from 'lucide-react';
import { TCMData } from './PrescriptionForm';
import { WATERMARK_IMAGES } from '../types';

interface PrescriptionDetailModalProps {
  data: TCMData;
  onClose: () => void;
  onGoToDate?: (date: string) => void;
  onHerbClick?: (name: string, prescriptionName?: string) => void;
}

export default function PrescriptionDetailModal({ data, onClose, onGoToDate, onHerbClick }: PrescriptionDetailModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-emerald-950/20 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-4xl max-h-[85vh] rounded-[2rem] shadow-[0_32px_128px_-12px_rgba(0,0,0,0.3)] border border-emerald-950/10 overflow-y-auto relative z-10 custom-scrollbar"
      >
        <div className="sticky top-0 right-0 z-50 flex justify-end gap-2 p-6 bg-white/80 backdrop-blur-md border-b border-emerald-950/5">
          {onGoToDate && (
            <button 
              onClick={() => {
                onGoToDate(data.date);
                onClose();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 text-[11px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              查看当日完整记录
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-2 hover:bg-rose-50 text-emerald-950 hover:text-rose-600 transition-all active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 md:p-12 relative">
          <div 
            className="watermark-bg opacity-[0.06] absolute inset-0 pointer-events-none" 
            style={{ backgroundImage: `url(${WATERMARK_IMAGES.BAMBOO})` }} 
          />
          
          <div className="relative z-10">
            <header className="mb-10">
              <div className="flex items-center gap-3 mb-2">
                <ClipboardList className="w-6 h-6 text-emerald-800" />
                <h2 className="text-4xl font-bold text-emerald-950 tracking-tight">{data.name || '未命名药方'}</h2>
              </div>
              <div className="flex items-center gap-4 text-emerald-900/40 font-medium">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[11px] uppercase tracking-widest">{data.date}</span>
                </div>
                {data.source && (
                  <span className="text-[11px] font-medium border-l border-emerald-950/10 pl-4">
                    {data.source}
                  </span>
                )}
              </div>
            </header>

            {data.herbs && data.herbs.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
                {data.herbs.map((herb) => {
                  const role = data.herbRoles?.[herb];
                  return (
                    <div 
                      key={herb} 
                      onClick={() => onHerbClick?.(herb, data.name)}
                      className="bg-white p-4 border border-emerald-900/5 shadow-sm flex flex-col gap-2 relative overflow-hidden group hover:shadow-lg hover:border-emerald-500/20 transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[15px] font-bold text-emerald-950 tracking-tight leading-none">
                          {herb}
                        </span>
                        {role && role.trim() && (
                          <div className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black shrink-0 border border-emerald-100/50">
                            {role.trim().length <= 2 ? role.trim() : '药'}
                          </div>
                        )}
                      </div>
                      {role && role.trim().length > 2 && (
                        <p className="text-[11px] leading-relaxed text-emerald-900/40 font-medium line-clamp-2">
                          {role}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-10">
              {data.analysis && (
                <div className="p-8 bg-emerald-900/[0.02] rounded-[2rem] border border-emerald-900/[0.04]">
                  <div className="text-emerald-950/80 text-[14px] leading-[1.8] whitespace-pre-wrap font-medium">
                    {data.analysis}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {(data.suitability || data.pros || data.cons) && (
                  <div className="space-y-8">
                    {data.suitability && (
                      <div className="space-y-3">
                        <h4 className="text-[11px] font-bold text-emerald-900/30 uppercase tracking-[0.2em] pl-1">适用人群和范围</h4>
                        <div className="p-6 bg-[#f8faf9] border border-emerald-900/5 text-sm leading-relaxed text-emerald-950/70 whitespace-pre-wrap">
                          {data.suitability}
                        </div>
                      </div>
                    )}
                    {data.pros && (
                      <div className="space-y-3">
                        <h4 className="text-[11px] font-black text-emerald-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                          <span className="text-base">✓</span>
                          组方优点
                        </h4>
                        <div className="p-6 bg-emerald-50/20 border border-emerald-100/30 rounded-2xl text-sm leading-relaxed text-emerald-900/70 whitespace-pre-wrap">
                          {data.pros}
                        </div>
                      </div>
                    )}
                    {data.cons && (
                      <div className="space-y-3">
                        <h4 className="text-[11px] font-black text-rose-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                          <span className="text-base text-rose-300">✕</span>
                          组方不足
                        </h4>
                        <div className="p-6 bg-rose-50/20 border border-rose-100/30 rounded-2xl text-sm leading-relaxed text-rose-900/70 whitespace-pre-wrap">
                          {data.cons}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-8">
                  {data.forbidden && (
                    <div className="space-y-4">
                      <h4 className="text-[11px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2 pl-1">
                        <AlertCircle className="w-4 h-4" />
                        禁忌
                      </h4>
                      <div className="p-6 bg-rose-50/40 border border-rose-100/50 rounded-2xl text-base font-bold leading-relaxed text-rose-900 shadow-sm whitespace-pre-wrap">
                        {data.forbidden}
                      </div>
                    </div>
                  )}

                  {data.usagePoints && (
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-bold text-blue-800/40 uppercase tracking-[0.2em] pl-1">
                        使用要点
                      </h4>
                      <div className="p-10 bg-blue-50/30 border border-blue-100/30 rounded-[3rem] text-[15px] leading-relaxed text-blue-900/70 font-medium whitespace-pre-wrap">
                        {data.usagePoints}
                      </div>
                    </div>
                  )}

                  {data.notes && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-emerald-900/30 uppercase tracking-widest pl-1">学习备注</h4>
                      <div 
                        className="p-6 bg-white border border-emerald-900/5 rounded-2xl text-sm leading-relaxed text-emerald-950 italic whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: data.notes }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
