import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { format, addDays, subDays } from 'date-fns';
import { Edit, ClipboardList, X, ChevronLeft, ChevronRight, AlertCircle, PanelLeftClose, PanelLeftOpen, Trash2 } from 'lucide-react';
import { WATERMARK_IMAGES } from '../types';
import PrescriptionForm, { TCMData } from './PrescriptionForm';
import ClinicalNoteForm from './ClinicalNoteForm';
import ClinicalNoteViewer from './ClinicalNoteViewer';
import GeneralNoteForm from './GeneralNoteForm';
import GeneralNoteViewer from './GeneralNoteViewer';

type ContentData = {
  note?: string;
  tcm?: TCMData;
  genNote?: string;
};

interface TodayViewProps {
  onEditorToggle?: (isActive: boolean) => void;
  isSidebarVisible?: boolean;
  onSidebarToggle?: () => void;
  onHerbClick?: (name: string, prescriptionName?: string) => void;
}

export default function TodayView({ onEditorToggle, isSidebarVisible, onSidebarToggle, onHerbClick }: TodayViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [content, setContent] = useState<Record<string, ContentData>>(() => {
    const saved = localStorage.getItem('journal-content');
    return saved ? JSON.parse(saved) : {};
  });
  const [activeEditor, setActiveEditor] = useState<'note' | 'tcm' | 'genNote' | null>(null);

  useEffect(() => {
    onEditorToggle?.(!!activeEditor);
  }, [activeEditor, onEditorToggle]);
  
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const currentData = content[dateKey] || {};

  useEffect(() => {
    localStorage.setItem('journal-content', JSON.stringify(content));
  }, [content]);

  const handleUpdateContent = useCallback((type: 'note' | 'tcm' | 'genNote', value: string | TCMData) => {
    setContent(prev => {
      let targetDateKey = dateKey;
      
      // If it's TCM data and has a specific date, save to that date
      if (type === 'tcm' && typeof value !== 'string' && value.date) {
        targetDateKey = value.date;
      }
      
      // If it's note data (JSON string) and has a date inside
      if (type === 'note' || type === 'genNote' && typeof value === 'string') {
        try {
          const parsed = JSON.parse(value as string);
          if (parsed.date) {
            targetDateKey = parsed.date;
          }
        } catch(e) {}
      }

      const currentDayContent = prev[targetDateKey] || {};
      // Only update if value actually changed to prevent unnecessary re-renders
      if (currentDayContent[type] === value) return prev;
      
      const nextContent = {
        ...prev,
        [targetDateKey]: {
          ...currentDayContent,
          [type]: value
        }
      };

      // Move logic: if date changed, clear from old date and move to new date
      if (targetDateKey !== dateKey && prev[dateKey]?.[type]) {
        const oldDayContent = { ...nextContent[dateKey] };
        delete oldDayContent[type];
        if (Object.keys(oldDayContent).length === 0) {
          delete nextContent[dateKey];
        } else {
          nextContent[dateKey] = oldDayContent;
        }
      }

      return nextContent;
    });
  }, [dateKey]);

  const goToYesterday = () => setSelectedDate(subDays(selectedDate, 1));
  const goToTomorrow = () => setSelectedDate(addDays(selectedDate, 1));

  const handleDeleteContent = useCallback((type: 'note' | 'tcm' | 'genNote') => {
    setContent(prev => {
      const currentDayContent = prev[dateKey];
      if (!currentDayContent || !currentDayContent[type]) return prev;
      
      const nextDayContent = { ...currentDayContent };
      delete nextDayContent[type];
      
      const nextContent = { ...prev };
      if (Object.keys(nextDayContent).length === 0) {
        delete nextContent[dateKey];
      } else {
        nextContent[dateKey] = nextDayContent;
      }
      
      return nextContent;
    });
  }, [dateKey]);

  if (activeEditor) {
    return (
      <div className="h-full w-full bg-white z-50 overflow-hidden animate-in fade-in duration-300">
         {activeEditor === 'tcm' ? (
           <PrescriptionForm 
             initialData={currentData.tcm}
             onSave={(data) => handleUpdateContent('tcm', data)}
             onClose={() => setActiveEditor(null)}
           />
         ) : activeEditor === 'note' ? (
          <ClinicalNoteForm 
            initialValue={currentData.note}
            initialDate={dateKey}
            onSave={(note) => handleUpdateContent('note', note)}
            onClose={() => setActiveEditor(null)}
          />
         ) : (
          <GeneralNoteForm 
            initialValue={currentData.genNote}
            initialDate={dateKey}
            onSave={(note) => handleUpdateContent('genNote', note)}
            onClose={() => setActiveEditor(null)}
          />
         )}
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto relative z-10 bg-surface">
      <div 
        className="watermark-bg" 
        style={{ backgroundImage: `url(${WATERMARK_IMAGES.BAMBOO})`, opacity: 0.08 }} 
      />
      
      <div className="max-w-3xl mx-auto p-12 relative z-10">
        <header className="mb-12 flex justify-center items-center relative">
          <button 
            onClick={onSidebarToggle}
            className="absolute left-0 p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant/40 transition-all hover:scale-110 active:scale-95 group"
            title={isSidebarVisible ? "隐藏侧边栏" : "显示侧边栏"}
          >
            {isSidebarVisible ? (
              <PanelLeftClose className="w-4 h-4 group-hover:text-primary transition-colors" />
            ) : (
              <PanelLeftOpen className="w-4 h-4 text-primary" />
            )}
          </button>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={goToYesterday}
              className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-all hover:scale-110 active:scale-95"
              title="Yesterday"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-xl text-on-surface flex items-center gap-2" style={{ fontFamily: 'Georgia', fontWeight: 'normal' }}>
              <span>{format(selectedDate, 'yyyy年M月d日')}</span>
              <span style={{ color: '#000000' }}>{format(selectedDate, 'EEEE')}</span>
            </div>
            <button 
              onClick={goToTomorrow}
              className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-all hover:scale-110 active:scale-95"
              title="Tomorrow"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </header>


          <div className="flex flex-col items-center">
            {currentData.tcm && (
              <>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mb-8 p-10 bg-[#f8faf9]/80 border border-emerald-900/5 rounded-[3rem] shadow-sm relative group"
              >
                <div className="absolute top-8 right-8 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-20">
                  <button 
                    onClick={() => setActiveEditor('tcm')}
                    className="p-2 rounded-lg hover:bg-white text-primary shadow-sm"
                    title="编辑药方"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <ClipboardList className="w-5 h-5 text-green-900" />
                  <div className="flex flex-col">
                    <h3 className="text-3xl font-bold text-green-950 tracking-tight">{currentData.tcm.name || '未命名药方'}</h3>
                    {currentData.tcm.source && (
                      <span className="text-[11px] text-green-800/40 font-medium mt-1">
                        {currentData.tcm.source}
                      </span>
                    )}
                  </div>
                </div>

                {currentData.tcm.herbs && currentData.tcm.herbs.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
                    {currentData.tcm.herbs.map((herb: string) => {
                      const role = currentData.tcm.herbRoles?.[herb];
                      return (
                        <div 
                          key={herb} 
                          onClick={() => onHerbClick?.(herb, currentData.tcm?.name)}
                          className="bg-white p-4 border border-emerald-900/5 shadow-sm flex flex-col gap-2 relative overflow-hidden group hover:shadow-lg hover:border-emerald-500/20 transition-all cursor-pointer"
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[15px] font-bold text-green-950 tracking-tight leading-none">
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

                {currentData.tcm.analysis && (
                  <div className="mt-8 p-8 bg-emerald-900/[0.02] rounded-[2rem] border border-emerald-900/[0.04]">
                    <div className="text-green-950/80 text-[14px] leading-[1.8] whitespace-pre-wrap font-medium">
                      {currentData.tcm.analysis}
                    </div>
                  </div>
                )}

                {/* Meta Information Sections */}
                <div className="mt-12 space-y-8">
                  {currentData.tcm.suitability && (
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-bold text-green-900/30 uppercase tracking-[0.2em] pl-1">适用人群和范围</h4>
                      <div className="p-6 bg-white/40 border border-green-900/5 text-sm leading-relaxed text-on-surface/70">
                        {currentData.tcm.suitability}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {currentData.tcm.pros && (
                      <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-emerald-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                          <span className="text-base">✓</span>
                          组方优点
                        </h4>
                        <div className="p-6 bg-emerald-50/20 border border-emerald-100/30 rounded-2xl text-sm leading-relaxed text-emerald-900/70">
                          {currentData.tcm.pros}
                        </div>
                      </div>
                    )}
                    {currentData.tcm.cons && (
                      <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-rose-400 uppercase tracking-widest pl-1 flex items-center gap-2 text-right justify-end">
                          <span className="text-base text-rose-300">✕</span>
                          组方不足
                        </h4>
                        <div className="p-6 bg-rose-50/20 border border-rose-100/30 rounded-2xl text-sm leading-relaxed text-rose-900/70 text-right">
                          {currentData.tcm.cons}
                        </div>
                      </div>
                    )}
                  </div>

                  {currentData.tcm.forbidden && (
                    <div className="space-y-4">
                      <h4 className="text-[11px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2 pl-1">
                        <AlertCircle className="w-4 h-4" />
                        禁忌
                      </h4>
                      <div className="p-6 bg-rose-50/40 border border-rose-100/50 rounded-2xl text-base font-bold leading-relaxed text-rose-900 shadow-sm">
                        {currentData.tcm.forbidden}
                      </div>
                    </div>
                  )}

                  {currentData.tcm.usagePoints && (
                    <div className="space-y-3 pt-4">
                      <h4 className="text-[11px] font-bold text-blue-800/40 uppercase tracking-[0.2em] pl-1">
                        使用要点
                      </h4>
                      <div className="p-10 bg-blue-50/30 border border-blue-100/30 rounded-[3rem] text-[15px] leading-relaxed text-blue-900/70 font-medium whitespace-pre-wrap">
                        {currentData.tcm.usagePoints}
                      </div>
                    </div>
                  )}

                  {currentData.tcm.notes && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest pl-1">学习备注</h4>
                      <div className="p-5 bg-white/60 rounded-2xl border border-outline-variant/10 text-sm leading-relaxed text-on-surface italic">
                        "{currentData.tcm.notes}"
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
              <button 
                onClick={() => handleDeleteContent('tcm')}
                className="self-start ml-12 -mt-4 mb-8 text-[11px] font-bold text-emerald-800/40 hover:text-emerald-800 transition-colors uppercase tracking-[0.2em]"
              >
                删除
              </button>
            </>
            )}

            {currentData.note && (
              <>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mb-8 p-6 bg-white border border-outline-variant/20 relative group"
              >
                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-20">
                  <button 
                    onClick={() => setActiveEditor('note')}
                    className="p-2 rounded-lg hover:bg-surface-container-high text-primary"
                    title="编辑笔记"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                <h4 className="text-[10px] font-black text-emerald-900/30 uppercase tracking-[0.2em] mb-4">临床笔记</h4>
                <ClinicalNoteViewer data={currentData.note} onHerbClick={onHerbClick} />
              </motion.div>
              <button 
                onClick={() => handleDeleteContent('note')}
                className="self-start ml-6 -mt-4 mb-8 text-[11px] font-bold text-emerald-800/40 hover:text-emerald-800 transition-colors uppercase tracking-[0.2em]"
              >
                删除
              </button>
            </>
            )}

            {currentData.genNote && (
              <>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mb-8 p-6 bg-white border border-outline-variant/20 relative group"
              >
                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-20">
                  <button 
                    onClick={() => setActiveEditor('genNote')}
                    className="p-2 rounded-lg hover:bg-surface-container-high text-primary"
                    title="编辑笔记"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                <h4 className="text-[10px] font-black text-emerald-900/30 uppercase tracking-[0.2em] mb-4">学习笔记</h4>
                <GeneralNoteViewer data={currentData.genNote} />
              </motion.div>
              <button 
                onClick={() => handleDeleteContent('genNote')}
                className="self-start ml-6 -mt-4 mb-8 text-[11px] font-bold text-emerald-800/40 hover:text-emerald-800 transition-colors uppercase tracking-[0.2em]"
              >
                删除
              </button>
            </>
            )}

            <div className="flex flex-col items-center justify-center gap-4 py-20 animate-in fade-in zoom-in-95 duration-700 w-full">
              {!currentData.tcm && (
                <motion.button 
                  whileHover={{ scale: 1.01, backgroundColor: '#f1f5f9' }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setActiveEditor('tcm')}
                  className="w-full max-w-sm py-4 px-8 bg-white border-2 border-emerald-950/10 text-emerald-950 font-black text-sm uppercase tracking-[0.2em] shadow-sm hover:border-emerald-500/30 transition-all flex items-center justify-center gap-3"
                >
                  创建中药模版
                </motion.button>
              )}
              {!currentData.note && (
                <motion.button 
                  whileHover={{ scale: 1.01, backgroundColor: '#f1f5f9' }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setActiveEditor('note')}
                  className="w-full max-w-sm py-4 px-8 bg-white border-2 border-emerald-950/10 text-emerald-950 font-black text-sm uppercase tracking-[0.2em] shadow-sm hover:border-emerald-500/30 transition-all flex items-center justify-center gap-3"
                >
                  创建常见病模版
                </motion.button>
              )}
              {!currentData.genNote && (
                <motion.button 
                  whileHover={{ scale: 1.01, backgroundColor: '#f1f5f9' }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setActiveEditor('genNote')}
                  className="w-full max-w-sm py-4 px-8 bg-white border-2 border-emerald-950/10 text-emerald-950 font-black text-sm uppercase tracking-[0.2em] shadow-sm hover:border-emerald-500/30 transition-all flex items-center justify-center gap-3"
                >
                  创建笔记
                </motion.button>
              )}
            </div>
          </div>
      </div>
    </div>
  );
}
