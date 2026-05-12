import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Calendar, Info, AlertCircle, Bookmark, Save, Trash2, ClipboardList, GripVertical, Share2, Search, Activity, ShieldAlert, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { WATERMARK_IMAGES } from '../types';
import ReactQuill from 'react-quill-new';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface TCMData {
  date: string;
  name: string;
  herbs: string[];
  herbRoles: Record<string, string>;
  source: string;
  analysis: string;
  suitability: string;
  pros: string;
  cons: string;
  forbidden: string;
  usagePoints: string;
  notes: string;
}

const DEFAULT_TCM: TCMData = {
  date: format(new Date(), 'yyyy-MM-dd'),
  name: '',
  herbs: [],
  herbRoles: {},
  source: '',
  analysis: '',
  suitability: '',
  pros: '',
  cons: '',
  forbidden: '',
  usagePoints: '',
  notes: '',
};

interface PrescriptionFormProps {
  initialData?: TCMData;
  initialDate?: string;
  onSave: (data: TCMData) => void;
  onClose: () => void;
}

interface SortableHerbCardProps {
  key?: string;
  id: string;
  herb: string;
  role: string;
  onRoleChange: (role: string) => void;
}

function SortableHerbCard({ id, herb, role, onRoleChange }: SortableHerbCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "flex flex-col gap-2 p-3 bg-white border transition-all group relative rounded-xl shadow-sm",
        isDragging ? "shadow-2xl border-emerald-500 scale-105" : "border-emerald-900/5 hover:border-emerald-200"
      )}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="flex justify-between items-start cursor-grab active:cursor-grabbing"
      >
        <span className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
          <GripVertical className="w-3 h-3 text-emerald-900/10 group-hover:text-emerald-400" />
          {herb}
        </span>
        {role && role.trim() && (
          <div className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black shrink-0 border border-emerald-100/50">
            {role.trim().length <= 2 ? role.trim() : '药'}
          </div>
        )}
      </div>
      <textarea 
        placeholder="设置角色与功效..."
        value={role}
        onChange={(e) => onRoleChange(e.target.value)}
        rows={2}
        className="text-[11px] p-2 bg-[#f8faf9] focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all border border-emerald-900/5 focus:bg-white resize-none h-16 leading-relaxed font-medium rounded-lg"
      />
    </div>
  );
}

const SECTIONS = [
  { id: 'basic', label: '基础信息', icon: Bookmark },
  { id: 'herbs', label: '药材组成', icon: Plus },
  { id: 'source', label: '来源考证', icon: Search },
  { id: 'analysis', label: '组方解析', icon: ClipboardList },
  { id: 'applicability', label: '适用范围', icon: Activity },
  { id: 'safety', label: '安全禁忌', icon: ShieldAlert },
  { id: 'notes', label: '学习备注', icon: BookOpen },
];

export default function PrescriptionForm({ initialData, initialDate, onSave, onClose }: PrescriptionFormProps) {
  const [data, setData] = useState<TCMData>(() => {
    const defaultDate = initialDate || format(new Date(), 'yyyy-MM-dd');
    return { ...DEFAULT_TCM, date: defaultDate, ...initialData };
  });
  const [herbInput, setHerbInput] = useState('');
  const [duplicateError, setDuplicateError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [isSaving, setIsSaving] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element && scrollRef.current) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setData((prev) => {
        const oldIndex = prev.herbs.indexOf(active.id as string);
        const newIndex = prev.herbs.indexOf(over.id as string);
        return {
          ...prev,
          herbs: arrayMove(prev.herbs, oldIndex, newIndex),
        };
      });
    }
  };

  useEffect(() => {
    onSave(data);
  }, [data, onSave]);

  const handleAddHerb = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && herbInput.trim()) {
      e.preventDefault();
      const newHerbs = herbInput
        .split(/[,\s，。、]+/)
        .map(h => h.trim())
        .filter(h => h.length > 0);

      if (newHerbs.length > 0) {
        setData(prev => {
          const filteredHerbs = newHerbs.filter(h => !prev.herbs.includes(h));
          if (filteredHerbs.length < newHerbs.length) {
            setDuplicateError(true);
            setTimeout(() => setDuplicateError(false), 2000);
          }
          return { ...prev, herbs: [...prev.herbs, ...filteredHerbs] };
        });
        setHerbInput('');
      }
    }
  };

  const removeHerb = (herb: string) => {
    setData(prev => {
      const newHerbs = (prev.herbs || []).filter(h => h !== herb);
      const newRoles = { ...(prev.herbRoles || {}) };
      delete newRoles[herb];
      return { ...prev, herbs: newHerbs, herbRoles: newRoles };
    });
  };

  const updateHerbRole = (herb: string, role: string) => {
    setData(prev => ({
      ...prev,
      herbRoles: { ...(prev.herbRoles || {}), [herb]: role }
    }));
  };

  const updateField = (field: keyof TCMData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setIsSaving(true);
    onSave(data);
    setTimeout(() => setIsSaving(false), 1500);
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
          <h3 className="text-sm font-black text-emerald-950 uppercase tracking-wider">中药模版编辑</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 border-r border-emerald-950/20 pr-3 mr-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-900/60" />
            <input 
              type="date"
              value={data.date}
              onChange={(e) => updateField('date', e.target.value)}
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
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="flex items-center gap-3 py-1 text-[11px] font-black text-emerald-900/40 hover:text-emerald-700 transition-colors w-full text-left uppercase tracking-widest group"
              >
                <div className="w-6 h-6 flex items-center justify-center border border-emerald-950/5 bg-white group-hover:border-emerald-200 transition-all">
                  <section.icon className="w-3 h-3" />
                </div>
                {section.label}
              </button>
            ))}
          </nav>

          {/* Action Buttons at Sidebar Bottom */}
          <div className="p-4 border-t border-emerald-950/20 bg-white space-y-2 relative z-10">
            <button 
              onClick={handleSave}
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
              onClick={() => {
                onSave(data);
                onClose();
              }}
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
            {/* Basic Info */}
            <section id="basic" className="space-y-4 scroll-mt-4">
              <div className="flex items-center gap-2 border-b border-emerald-950/10 pb-1.5">
                <Bookmark className="w-4 h-4 text-emerald-700" />
                <h2 className="text-sm font-black text-emerald-950 uppercase tracking-widest">基础信息</h2>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <label className="text-[9px] font-black text-emerald-800/30 uppercase tracking-[0.2em] pl-1">
                  药方名称
                </label>
                <input 
                  type="text"
                  placeholder="例：消风止痒颗粒"
                  value={data.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full px-4 py-3 bg-[#fafbfb] border border-emerald-950/10 text-lg font-black focus:outline-none focus:border-emerald-500/30 transition-all"
                />
              </div>
            </section>

            {/* Herbs */}
            <section id="herbs" className="space-y-4 scroll-mt-4">
              <div className="flex items-center gap-2 border-b border-emerald-950/10 pb-1.5">
                <Plus className="w-4 h-4 text-emerald-700" />
                <h2 className="text-sm font-black text-emerald-950 uppercase tracking-widest">药材组成</h2>
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="输入药材名，按回车添加..."
                    value={herbInput}
                    onChange={(e) => setHerbInput(e.target.value)}
                    onKeyDown={handleAddHerb}
                    className="w-full px-4 py-3 bg-white border border-emerald-900/10 focus:border-emerald-500 focus:outline-none transition-all font-bold text-sm"
                  />
                  <AnimatePresence>
                    {duplicateError && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute left-1/2 -top-8 bg-rose-700 text-white text-[10px] px-3 py-1 font-bold shadow-lg z-10 whitespace-nowrap"
                      >
                        已有此药材
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex flex-wrap gap-1.5 p-4 bg-[#f4f7f6]/50 border border-emerald-950/10 min-h-[80px] items-start relative overflow-hidden">
                  <div 
                    className="watermark-bg opacity-[0.02] absolute inset-0 pointer-events-none" 
                    style={{ backgroundImage: `url(${WATERMARK_IMAGES.BAMBOO})` }} 
                  />
                  {(data.herbs || []).map(herb => (
                    <motion.div 
                      key={herb}
                      layoutId={herb}
                      className="group flex items-center gap-2 pl-2 pr-1 py-1 bg-white text-emerald-950 font-black text-[10px] border border-emerald-950/10 transition-all cursor-pointer hover:border-emerald-400 uppercase tracking-widest"
                    >
                      {herb}
                      <button 
                        onClick={() => removeHerb(herb)}
                        className="w-4 h-4 flex items-center justify-center text-emerald-900/10 hover:text-rose-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                  {(!data.herbs || data.herbs.length === 0) && (
                    <p className="text-[10px] text-emerald-900/20 italic p-2">暂无药材，请输入药材名并按回车添加</p>
                  )}
                </div>
              </div>
            </section>

            {/* Source */}
            <section id="source" className="space-y-4 scroll-mt-4">
              <div className="flex items-center gap-2 border-b border-emerald-950/10 pb-1.5">
                <Search className="w-4 h-4 text-emerald-700" />
                <h2 className="text-sm font-black text-emerald-950 uppercase tracking-widest">来源考证</h2>
              </div>
              <textarea 
                placeholder="例：明代陈实功《外科正宗》消风散化裁"
                value={data.source}
                onChange={(e) => updateField('source', e.target.value)}
                className="w-full h-16 p-3 bg-[#fafbfb] border border-emerald-950/5 focus:outline-none focus:border-emerald-500/30 text-xs leading-relaxed"
              />
            </section>

            {/* Analysis */}
            <section id="analysis" className="space-y-6 scroll-mt-4">
              <div className="flex items-center gap-2 border-b border-emerald-950/10 pb-1.5">
                <ClipboardList className="w-4 h-4 text-emerald-700" />
                <h2 className="text-sm font-black text-emerald-950 uppercase tracking-widest">组方解析</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <label className="text-[9px] font-black text-emerald-800/30 uppercase tracking-[0.2em] pl-1">药材功能分类</label>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={data.herbs || []} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-3 gap-2">
                      {(data.herbs || []).map((herb: string) => (
                        <SortableHerbCard 
                          key={herb}
                          id={herb}
                          herb={herb}
                          role={(data.herbRoles && data.herbRoles[herb]) || ''}
                          onRoleChange={(val) => updateHerbRole(herb, val)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-emerald-800/30 uppercase tracking-[0.2em] pl-1">综合分析与配伍特点</label>
                <textarea 
                  placeholder="记录治则、配伍特点、临床发挥等..."
                  value={data.analysis}
                  onChange={(e) => updateField('analysis', e.target.value)}
                  className="w-full h-32 p-3 bg-[#fafbfb] border border-emerald-950/5 focus:outline-none focus:border-emerald-500/30 text-xs leading-relaxed"
                />
              </div>
            </section>
            {/* Applicability */}
            <section id="applicability" className="space-y-6 scroll-mt-4">
              <div className="flex items-center gap-2 border-b border-emerald-950/20 pb-1.5">
                <Activity className="w-4 h-4 text-emerald-800" />
                <h2 className="text-sm font-black text-emerald-950 uppercase tracking-widest">适用范围</h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-emerald-900/40 uppercase tracking-[0.2em] pl-1">适用人群和范围</label>
                  <textarea 
                    value={data.suitability}
                    onChange={(e) => updateField('suitability', e.target.value)}
                    className="w-full h-20 p-3 bg-[#fafbfb] border border-emerald-950/10 focus:outline-none focus:border-emerald-600/40 text-xs leading-relaxed transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-emerald-700/60 uppercase tracking-[0.2em] pl-1">组方优点</label>
                    <textarea 
                      value={data.pros}
                      onChange={(e) => updateField('pros', e.target.value)}
                      className="w-full h-24 p-3 bg-emerald-50/20 border border-emerald-950/10 focus:outline-none focus:border-emerald-600/40 text-xs leading-relaxed transition-all"
                      placeholder="配伍优势..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-rose-700/60 uppercase tracking-[0.2em] pl-1">组方不足</label>
                    <textarea 
                      value={data.cons}
                      onChange={(e) => updateField('cons', e.target.value)}
                      className="w-full h-24 p-3 bg-rose-50/20 border border-emerald-950/10 focus:outline-none focus:border-emerald-600/40 text-xs leading-relaxed transition-all"
                      placeholder="局限性..."
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Safety */}
            <section id="safety" className="space-y-6 scroll-mt-4">
              <div className="flex items-center gap-2 border-b border-emerald-950/20 pb-1.5">
                <ShieldAlert className="w-4 h-4 text-emerald-800" />
                <h2 className="text-sm font-black text-emerald-950 uppercase tracking-widest">安全禁忌</h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <h4 className="text-[9px] font-black text-rose-800 uppercase tracking-[0.2em] flex items-center gap-1.5 pl-1">
                    <AlertCircle className="w-3 h-3" />
                    禁忌和不宜人群
                  </h4>
                  <textarea 
                    value={data.forbidden}
                    onChange={(e) => updateField('forbidden', e.target.value)}
                    className="w-full h-20 p-3 bg-rose-50/30 border border-emerald-950/10 focus:outline-none focus:border-emerald-600/40 text-xs font-bold text-rose-950"
                    placeholder="禁忌人群..."
                  />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-[9px] font-black text-blue-800 uppercase tracking-[0.2em] pl-1">使用要点</h4>
                  <textarea 
                    value={data.usagePoints}
                    onChange={(e) => updateField('usagePoints', e.target.value)}
                    className="w-full h-20 p-3 bg-blue-50/30 border border-emerald-950/10 focus:outline-none focus:border-emerald-600/40 text-xs text-blue-950 font-medium"
                    placeholder="用法用量..."
                  />
                </div>
              </div>
            </section>

            {/* Notes */}
            <section id="notes" className="space-y-4 scroll-mt-4">
              <div className="flex items-center gap-2 border-b border-emerald-950/20 pb-1.5">
                <BookOpen className="w-4 h-4 text-emerald-800" />
                <h2 className="text-sm font-black text-emerald-950 uppercase tracking-widest">学习备注</h2>
              </div>
              <div className="border border-emerald-950/10 bg-[#fafbfb] focus-within:border-emerald-500/30 transition-all">
                <ReactQuill 
                  theme="snow"
                  value={data.notes}
                  onChange={(val) => updateField('notes', val)}
                  modules={modules}
                  placeholder="心得体会、案例分析..."
                  className="rich-editor-small"
                />
              </div>
            </section>
            <div className="h-12" />
          </div>
        </main>
      </div>
    </motion.div>
  );
}

