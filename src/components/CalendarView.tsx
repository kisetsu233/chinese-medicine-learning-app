import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, MapPin, Edit, Share2, ClipboardList, Info, AlertCircle, Bookmark, Menu, Check, Plus, Save, X, PanelLeftClose, PanelLeftOpen, Trash2 } from 'lucide-react';
import { WATERMARK_IMAGES, Prescription } from '../types';
import { cn } from '../lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addYears, subYears, startOfYear, endOfYear, eachMonthOfInterval, addDays, subDays, isToday } from 'date-fns';
import { api } from '../services/api';
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

interface CalendarViewProps {
  onEditorToggle?: (isActive: boolean) => void;
  isSidebarVisible?: boolean;
  onSidebarToggle?: () => void;
  onHerbClick?: (name: string, prescriptionName?: string) => void;
  initialPrescriptionName?: string;
  onPrescriptionHandled?: () => void;
  initialDate?: Date;
}

export default function CalendarView({ 
  onEditorToggle, 
  isSidebarVisible, 
  onSidebarToggle, 
  onHerbClick,
  initialPrescriptionName,
  onPrescriptionHandled,
  initialDate
}: CalendarViewProps) {
  const [currentYear, setCurrentYear] = useState(() => initialDate ? startOfYear(initialDate) : new Date(2026, 0, 1));
  const [selectedDate, setSelectedDate] = useState(() => initialDate || new Date(2026, 4, 7));
  const [isCalendarVisible, setIsCalendarVisible] = useState(true);

  const [content, setContent] = useState<Record<string, ContentData>>({});
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [activeEditor, setActiveEditor] = useState<'note' | 'tcm' | 'genNote' | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onEditorToggle?.(!!activeEditor);
  }, [activeEditor, onEditorToggle]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [journalsData, prescriptsData] = await Promise.all([
          api.getJournals(),
          api.getPrescriptions()
        ]);
        setContent(journalsData);
        setPrescriptions(prescriptsData);
      } catch (e) {
        console.error("Failed to load calendar data", e);
      }
    };
    loadData();
  }, []);

  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const currentData = content[dateKey] || {};

  const effectiveCalendarVisible = isCalendarVisible && !activeEditor;

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
        api.saveJournal(dateKey, {
          note: nextContent[dateKey]?.note,
          tcm: nextContent[dateKey]?.tcm,
          genNote: nextContent[dateKey]?.genNote
        }).catch(console.error);
      }

      api.saveJournal(targetDateKey, {
        note: nextContent[targetDateKey]?.note,
        tcm: nextContent[targetDateKey]?.tcm,
        genNote: nextContent[targetDateKey]?.genNote
      }).catch(console.error);

      return nextContent;
    });
  }, [dateKey]);
  
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
      
      api.saveJournal(dateKey, {
        note: nextContent[dateKey]?.note,
        tcm: nextContent[dateKey]?.tcm,
        genNote: nextContent[dateKey]?.genNote
      }).catch(console.error);

      return nextContent;
    });
  }, [dateKey]);
  
  const months = eachMonthOfInterval({
    start: startOfYear(currentYear),
    end: endOfYear(currentYear)
  });

  const selectedPrescription = prescriptions.find(p => p.date && isSameDay(new Date(p.date), selectedDate)) || (initialPrescriptionName ? prescriptions.find(p => p.name === initialPrescriptionName) : undefined);

  useEffect(() => {
    if (initialPrescriptionName && selectedPrescription) {
      setSelectedDate(new Date(selectedPrescription.date));
      // Once we've handled the initial prescription, we should notify the parent
      // But we wait a bit to ensure everything is rendered
      onPrescriptionHandled?.();
    }
  }, [initialPrescriptionName, selectedPrescription, onPrescriptionHandled]);

  const handleToday = () => {
    const today = new Date();
    setCurrentYear(startOfYear(today));
    setSelectedDate(today);
    
    setTimeout(() => {
      if (scrollContainerRef.current) {
        const monthBlocks = scrollContainerRef.current.querySelectorAll('.month-block');
        const currentMonthIndex = today.getMonth();
        if (monthBlocks[currentMonthIndex]) {
          monthBlocks[currentMonthIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);
  };

  const goToYesterday = () => setSelectedDate(subDays(selectedDate, 1));
  const goToTomorrow = () => setSelectedDate(addDays(selectedDate, 1));

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative">

      {/* Calendar Panel */}
      <AnimatePresence>
        {effectiveCalendarVisible && (
          <motion.section 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 225, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full flex flex-col border-r border-outline-variant/30 bg-white/60 backdrop-blur-xl z-20 overflow-hidden shrink-0"
          >
            <header className="h-[76px] bg-white/80 backdrop-blur-md z-30 p-4 border-b border-outline-variant/10 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsCalendarVisible(false)}
                  className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors mr-1"
                  title="Hide Calendar"
                >
                  <ChevronLeft className="w-4 h-4 text-on-surface-variant" />
                </button>
                <div className="flex items-center">
                  <button 
                    onClick={() => setCurrentYear(subYears(currentYear, 1))}
                    className="p-1 rounded-full hover:bg-surface-container-high transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-on-surface-variant" />
                  </button>
                  <h3 className="text-lg font-bold px-1">{format(currentYear, 'yyyy')}</h3>
                  <button 
                    onClick={() => setCurrentYear(addYears(currentYear, 1))}
                    className="p-1 rounded-full hover:bg-surface-container-high transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                  </button>
                </div>
              </div>
              <button 
                onClick={handleToday}
                className="text-primary font-bold text-xs px-2 py-1 rounded-full hover:bg-primary/5 transition-colors"
              >
                Today
              </button>
            </header>

            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-8 scroll-smooth hide-scrollbar bg-white/40"
              style={{ height: '681px' }}
            >
              {months.map((month) => (
                <div 
                  key={month.toString()} 
                  className="month-block"
                >
                  <h4 className="text-sm font-bold mb-3 pl-2 text-on-surface/70">{format(month, 'MMMM yyyy')}</h4>
                  <div className="grid grid-cols-7 gap-0.5 text-center mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                      <span key={`${day}-${idx}`} className="text-[8px] font-bold text-on-surface-variant/30 uppercase tracking-widest">{day}</span>
                    ))}
                  </div>
                  <div 
                    className="grid grid-cols-7 gap-y-1 gap-x-0.5"
                  >
                    {Array.from({ length: startOfMonth(month).getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-7" />
                    ))}
                    
                    {eachDayOfInterval({
                      start: startOfMonth(month),
                      end: endOfMonth(month)
                    }).map(day => {
                      const isSelected = isSameDay(day, selectedDate);
                      const key = format(day, 'yyyy-MM-dd');
                      const hasUserContent = content[key] && (content[key].note || content[key].tcm);
                      const hasPrescription = prescriptions.some(p => p.date && isSameDay(new Date(p.date), day));
                      
                      return (
                        <button
                          key={day.toString()}
                          onClick={() => setSelectedDate(day)}
                          className={cn(
                            "h-7 w-full flex items-center justify-center rounded-full text-[10px] font-mono transition-all relative group",
                            isSelected 
                              ? "bg-primary/10 text-primary ring-2 ring-primary/30 shadow-sm scale-105 z-10 font-bold" 
                              : "hover:bg-surface-container-high text-on-surface"
                          )}
                        >
                          {format(day, 'd')}
                          {hasUserContent ? (
                            <div className="absolute -top-1 -right-1">
                              <Check className="w-3 h-3 text-primary font-black" strokeWidth={5} />
                            </div>
                          ) : hasPrescription && !isSelected && (
                            <div className="absolute bottom-1 w-0.5 h-0.5 rounded-full bg-primary/40 group-hover:bg-primary/80" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Panel Collapse button at bottom */}
            <div className="p-4 border-t border-outline-variant/10 bg-white/80">
              <button 
                onClick={() => setIsCalendarVisible(false)}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-lg hover:bg-surface-container-high transition-colors text-xs font-medium text-on-surface-variant"
              >
                <div className="w-4 h-3.5 flex flex-col justify-center items-center gap-0.5">
                  <div className="w-3 h-0.5 bg-on-surface-variant/40" />
                  <div className="w-3 h-0.5 bg-on-surface-variant/40" />
                  <div className="w-3 h-0.5 bg-on-surface-variant/40" />
                </div>
                Minimize calendar
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Log Detail Panel */}
      <section className={cn("flex-1 h-full overflow-y-auto relative z-10 bg-surface", activeEditor && "p-0 overflow-hidden")}>
        <div 
          className="watermark-bg opacity-[0.1]" 
          style={{ backgroundImage: `url(${WATERMARK_IMAGES.BAMBOO})`, opacity: 0.08 }} 
        />
        
        {activeEditor ? (
           <div className="h-full w-full bg-white z-50 animate-in fade-in duration-300">
              {activeEditor === 'tcm' ? (
            <PrescriptionForm 
              initialData={currentData.tcm}
              initialDate={dateKey}
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
        ) : (
          <div className="max-w-3xl mx-auto p-12 relative z-10">
            <header className="mb-12 flex justify-center items-center relative">
            <div className="absolute left-0 flex items-center gap-1">
              {!isSidebarVisible && (
                <button 
                  onClick={onSidebarToggle}
                  className="p-1.5 rounded-lg hover:bg-surface-container-high text-primary transition-all hover:scale-110 active:scale-95 group"
                  title="显示侧边栏"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={() => setIsCalendarVisible(!isCalendarVisible)}
                className={cn(
                  "p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant/40 transition-all hover:scale-110 active:scale-95 group",
                  !isCalendarVisible && "text-primary"
                )}
                title={isCalendarVisible ? "隐藏日历" : "显示日历"}
              >
                {isCalendarVisible ? (
                  <PanelLeftClose className="w-4 h-4 group-hover:text-primary transition-colors" />
                ) : (
                  <PanelLeftOpen className="w-4 h-4" />
                )}
              </button>
            </div>

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

          {(selectedPrescription || currentData.note || currentData.tcm || currentData.genNote) ? (
            <div className="space-y-6">
              {currentData.tcm && (
                <>
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#f8faf9]/80 border border-emerald-900/5 p-8 rounded-[3rem] shadow-sm group relative"
                  >
                    <div className="absolute top-6 right-6 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-20">
                    <button 
                      onClick={() => setActiveEditor('tcm')}
                      className="p-2 hover:bg-white text-primary shadow-sm rounded-lg"
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
                      {currentData.tcm.herbs.map((herb: string) => {
                        const role = currentData.tcm.herbRoles?.[herb];
                        return (
                          <div 
                            key={herb} 
                            onClick={() => onHerbClick?.(herb, currentData.tcm.name)}
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
                        <div className="p-6 bg-white/40 border border-green-900/5 text-sm leading-relaxed text-on-surface/70 whitespace-pre-wrap">
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
                          <div className="p-6 bg-emerald-50/20 border border-emerald-100/30 rounded-2xl text-sm leading-relaxed text-emerald-900/70 whitespace-pre-wrap">
                            {currentData.tcm.pros}
                          </div>
                        </div>
                      )}
                      {currentData.tcm.cons && (
                        <div className="space-y-4">
                          <h4 className="text-[11px] font-black text-rose-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                            <span className="text-base text-rose-300">✕</span>
                            组方不足
                          </h4>
                          <div className="p-6 bg-rose-50/20 border border-rose-100/30 rounded-2xl text-sm leading-relaxed text-rose-900/70 whitespace-pre-wrap">
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
                        <div className="p-6 bg-rose-50/40 border border-rose-100/50 rounded-2xl text-base font-bold leading-relaxed text-rose-900 shadow-sm whitespace-pre-wrap">
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
                        <div className="p-5 bg-white/60 rounded-2xl border border-outline-variant/10 text-sm leading-relaxed text-on-surface italic whitespace-pre-wrap">
                          "{currentData.tcm.notes}"
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
                <button 
                  onClick={() => handleDeleteContent('tcm')}
                  className="self-start ml-12 -mt-2 mb-8 text-[11px] font-bold text-emerald-800/40 hover:text-emerald-800 transition-colors uppercase tracking-[0.2em]"
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
                  className="bg-white rounded-3xl border border-outline-variant/30 p-8 shadow-sm group relative"
                >
                  <div className="absolute top-6 right-6 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-20">
                    <button 
                      onClick={() => setActiveEditor('note')}
                      className="p-2 rounded-lg hover:bg-surface-container-high text-primary"
                      title="编辑笔记"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="text-xs font-bold text-on-surface-variant/40 uppercase tracking-widest mb-4">临床笔记</h4>
                  <ClinicalNoteViewer data={currentData.note} onHerbClick={onHerbClick} />
                </motion.div>
                <button 
                  onClick={() => handleDeleteContent('note')}
                  className="self-start ml-8 -mt-2 mb-8 text-[11px] font-bold text-emerald-800/40 hover:text-emerald-800 transition-colors uppercase tracking-[0.2em]"
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
              {selectedPrescription && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl border border-outline-variant/30 p-8 shadow-sm"
                >
                  <div className="flex items-center gap-4 mb-6 border-b border-outline-variant/20 pb-6">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <ClipboardList className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold">{selectedPrescription.name}</h3>
                    <span className="ml-auto text-xs font-bold text-on-surface-variant/60 bg-surface-container px-3 py-1 rounded-full border border-outline-variant/20 tracking-wider uppercase">
                      {selectedPrescription.type}
                    </span>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h4 className="text-xs font-bold text-on-surface-variant/40 uppercase tracking-widest mb-4">Key Ingredients</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedPrescription.ingredients.map(ing => (
                          <button 
                            key={ing} 
                            onClick={() => onHerbClick?.(ing, selectedPrescription.name)}
                            className="px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-sm border border-primary/20 hover:bg-primary/20 transition-colors"
                          >
                            {ing}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-on-surface-variant/40 uppercase tracking-widest mb-2">Analysis</h4>
                      <p className="text-on-surface leading-relaxed">{selectedPrescription.analysis}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {selectedPrescription && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailCard label="Indications" icon={Bookmark} color="text-primary" bg="bg-white">
                    <ul className="space-y-2 mt-2">
                      {selectedPrescription.indications.map(i => (
                        <li key={i} className="flex items-start gap-3 text-sm text-on-surface-variant font-medium">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          {i}
                        </li>
                      ))}
                    </ul>
                  </DetailCard>

                  <div className="space-y-6">
                    <DetailCard label="Usage Tips" icon={Info} color="text-blue-700" bg="bg-blue-50/40" outline="border-blue-100">
                      <p className="text-xs leading-relaxed text-blue-800 font-medium">{selectedPrescription.usageTips}</p>
                    </DetailCard>

                    <DetailCard label="Contraindications" icon={AlertCircle} color="text-red-700" bg="bg-red-50/40" outline="border-red-100">
                      <p className="text-xs leading-relaxed text-red-800 font-medium">{selectedPrescription.contraindications}</p>
                    </DetailCard>
                  </div>
                </div>
              )}

              {selectedPrescription?.notes && (
                <div className="p-6 bg-[#f8fbfa] border border-emerald-950/10 rounded-none">
                  <h4 className="text-[10px] font-black text-emerald-900/30 uppercase tracking-[0.2em] mb-3">Clinical Notes</h4>
                  <div className="border-l-2 border-emerald-950/10 pl-6">
                    <p className="text-emerald-950 italic text-sm leading-relaxed">"{selectedPrescription.notes}"</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 animate-in fade-in zoom-in-95 duration-700">
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
          )}
        </div>
      )}
    </section>
    </div>
  );
}

function DetailCard({ label, icon: Icon, color, bg, outline, children }: any) {
  return (
    <div className={cn("p-4 border shadow-sm", bg, outline || 'border-emerald-950/5')}>
      <h4 className={cn("flex items-center gap-2 font-black text-[10px] uppercase tracking-widest mb-2", color)}>
        <Icon className="w-3.5 h-3.5" />
        {label}
      </h4>
      {children}
    </div>
  );
}

function HeaderButton({ icon: Icon }: { icon: any }) {
  return (
    <button className="p-3 rounded-full bg-white/50 backdrop-blur hover:bg-white text-on-surface-variant hover:text-primary transition-all shadow-sm border border-outline-variant/20 active:scale-95">
      <Icon className="w-5 h-5" />
    </button>
  );
}
