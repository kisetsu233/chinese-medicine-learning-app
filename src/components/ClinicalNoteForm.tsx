import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Save, Share2, ClipboardList, Microscope, Sprout, Coffee, Pill, Hand, Footprints, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { WATERMARK_IMAGES } from '../types';
import ReactQuill from 'react-quill-new';

interface ClinicalNoteFormProps {
  onClose: () => void;
  onSave: (note: string) => void;
  initialValue?: string;
  initialDate?: string;
}

const SECTIONS = [
  {
    id: 'overview',
    label: '疾病概述',
    icon: ClipboardList,
    subsections: [
      { id: 'what-is', label: '什么是【疾病名】' },
      { id: 'misconceptions', label: '治疗误区' },
      { id: 'tcm-view', label: '中医如何看待' },
      { id: 'triggers', label: '诱发因素' },
    ]
  },
  {
    id: 'mechanism',
    label: '病机与调理',
    icon: Microscope,
    subsections: [
      { id: 'tcm-mechanism', label: '中医病机' },
      { id: 'strategy', label: '调理思路' },
      { id: 'methods', label: '调理方法' },
    ]
  },
  {
    id: 'prescriptions',
    label: '方剂',
    icon: Sprout,
    subsections: [
      { id: 'base-presc', label: '基础方' },
      { id: 'adjustments', label: '随证加减' },
      { id: 'cases', label: '临床案例' },
    ]
  },
  { id: 'dietary', label: '食疗方', icon: Coffee },
  { id: 'patent-med', label: '中成药', icon: Pill },
  { id: 'external', label: '外治疗法', icon: Hand },
  { id: 'footbath', label: '泡脚方', icon: Footprints },
];

export default function ClinicalNoteForm({ onClose, onSave, initialValue = '', initialDate }: ClinicalNoteFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    try {
      if (initialValue.startsWith('{') && initialValue.endsWith('}')) {
        const parsed = JSON.parse(initialValue);
        // Ensure date is handled
        if (!parsed.date) {
          parsed.date = initialDate || format(new Date(), 'yyyy-MM-dd');
        }
        return parsed;
      }
    } catch (e) {}
    return { date: initialDate || format(new Date(), 'yyyy-MM-dd') };
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element && scrollRef.current) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    onSave(JSON.stringify(formData));
  }, [formData, onSave]);

  const handleChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleQuickSave = () => {
    setIsSaving(true);
    onSave(JSON.stringify(formData));
    setTimeout(() => setIsSaving(false), 1500);
  };

  const handleSaveAndClose = () => {
    onSave(JSON.stringify(formData));
    onClose();
  };

  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'color': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['image', 'clean']
    ],
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white overflow-hidden w-full h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 h-12 border-b-2 border-emerald-950/20 bg-[#f4f7f6] shrink-0 shadow-sm relative z-20">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-emerald-900" />
          <h3 className="text-sm font-black text-emerald-950 uppercase tracking-wider">临床常用笔记编辑</h3>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 border-r border-emerald-950/20 pr-3 mr-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-900/60" />
            <input 
              type="date"
              value={formData.date || format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => handleChange('date', e.target.value)}
              className="bg-transparent text-[10px] font-black text-emerald-950/60 focus:outline-none cursor-pointer uppercase tracking-widest"
            />
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-emerald-200/50 text-emerald-950 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation */}
        <aside className="w-[240px] border-r border-emerald-950/10 bg-[#f9fafb] overflow-y-auto shrink-0 flex flex-col relative">
          <div 
            className="watermark-bg opacity-[0.03] absolute inset-0 pointer-events-none" 
            style={{ backgroundImage: `url(${WATERMARK_IMAGES.BAMBOO})` }} 
          />
          <nav className="p-4 flex-1 space-y-4 relative z-10">
            {SECTIONS.map((section) => (
              <div key={section.id} className="space-y-1">
                <button
                  onClick={() => scrollToSection(section.id)}
                  className="flex items-center gap-2 text-[11px] font-black text-emerald-950/60 hover:text-emerald-950 transition-colors w-full text-left uppercase tracking-widest group"
                >
                  <section.icon className="w-3.5 h-3.5 text-emerald-900/60 group-hover:text-emerald-900" />
                  {section.label}
                </button>
                
                {section.subsections && (
                  <div className="pl-3.5 space-y-0.5 border-l border-emerald-950/10 ml-1.5">
                    {section.subsections.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => scrollToSection(sub.id)}
                        className="flex items-center gap-2 text-[10px] font-bold text-emerald-900/40 hover:text-emerald-800 transition-colors w-full text-left py-0.5"
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Action Buttons at Sidebar Bottom */}
          <div className="p-4 border-t border-emerald-950/20 bg-white space-y-2 relative z-10">
            <button 
              onClick={handleQuickSave}
              disabled={isSaving}
              className="w-full py-2 bg-emerald-800 text-white font-black text-[10px] uppercase tracking-widest hover:bg-emerald-900 shadow-md shadow-emerald-950/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 relative overflow-hidden"
            >
              <Save className={cn("w-3.5 h-3.5 transition-transform", isSaving && "scale-0")} />
              <span className={cn("transition-transform duration-300", isSaving && "-translate-y-full opacity-0")}>
                保存模板
              </span>
              {isSaving && (
                <motion.span 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-emerald-900 text-[10px]"
                >
                  已保存
                </motion.span>
              )}
            </button>
            <button 
              onClick={handleSaveAndClose}
              className="w-full py-2 bg-white text-emerald-900 border border-emerald-900/30 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Share2 className="w-3.5 h-3.5" />
              完成关闭
            </button>
          </div>
        </aside>

        {/* Right Content Area */}
        <main 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 bg-white scroll-smooth custom-scrollbar relative"
        >
          <div 
            className="watermark-bg opacity-[0.05] absolute inset-0 pointer-events-none" 
            style={{ backgroundImage: `url(${WATERMARK_IMAGES.BAMBOO})` }} 
          />
          <div className="max-w-5xl mx-auto space-y-10 relative z-10">
            {SECTIONS.map((section) => (
              <div key={section.id} id={section.id} className="space-y-4 scroll-mt-4">
                <div className="flex items-center gap-2 border-b border-emerald-950/20 pb-1.5">
                  <section.icon className="w-4 h-4 text-emerald-900" />
                  <h2 className="text-sm font-black text-emerald-950 uppercase tracking-widest">{section.label}</h2>
                </div>

                {!section.subsections ? (
                  <div className="border border-emerald-950/10 bg-[#fafbfb] focus-within:border-emerald-500/30 transition-all">
                    <ReactQuill 
                      theme="snow"
                      value={formData[section.id] || ''}
                      onChange={(val) => handleChange(section.id, val)}
                      modules={modules}
                      placeholder={`${section.label}内容...`}
                      className="rich-editor-small"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {section.subsections.map((sub) => (
                      <div key={sub.id} id={sub.id} className="space-y-1.5 scroll-mt-4">
                        <label className="text-[9px] font-black text-emerald-950/40 uppercase tracking-[0.2em] pl-1">
                          {sub.label}
                        </label>
                        <div className="border border-emerald-950/10 bg-[#fafbfb] focus-within:border-emerald-500/30 transition-all">
                          <ReactQuill 
                            theme="snow"
                            value={formData[sub.id] || ''}
                            onChange={(val) => handleChange(sub.id, val)}
                            modules={modules}
                            placeholder={`${sub.label}...`}
                            className="rich-editor-small"
                          />
                        </div>
                        {sub.id === 'base-presc' && formData[sub.id] && (
                          <div className="flex flex-wrap gap-1 px-1 mt-1">
                            {formData[sub.id].split(/[，、,;； \n\t]+/).filter(tag => tag.trim()).map((tag, idx) => {
                              const cleaned = tag.replace(/[0-9.g克ml毫升mg毫克 ]+$/, '').trim();
                              if (!cleaned) return null;
                              return (
                                <span key={idx} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 italic">
                                  {cleaned}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="h-12" /> 
          </div>
        </main>
      </div>
    </motion.div>
  );
}
