import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Save, Share2, Calendar, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { WATERMARK_IMAGES } from '../types';
import ReactQuill from 'react-quill-new';

interface GeneralNoteFormProps {
  onClose: () => void;
  onSave: (note: string) => void;
  initialValue?: string;
  initialDate?: string;
}

export default function GeneralNoteForm({ onClose, onSave, initialValue = '', initialDate }: GeneralNoteFormProps) {
  const [formData, setFormData] = useState<{ date: string; content: string }>(() => {
    try {
      if (initialValue.startsWith('{') && initialValue.endsWith('}')) {
        const parsed = JSON.parse(initialValue);
        return {
          date: parsed.date || initialDate || format(new Date(), 'yyyy-MM-dd'),
          content: parsed.content || ''
        };
      }
    } catch (e) {}
    return { 
      date: initialDate || format(new Date(), 'yyyy-MM-dd'),
      content: initialValue 
    };
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    onSave(JSON.stringify(formData));
  }, [formData, onSave]);

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };

  const handleDateChange = (date: string) => {
    setFormData(prev => ({ ...prev, date }));
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
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['clean']
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
          <BookOpen className="w-4 h-4 text-emerald-900" />
          <h3 className="text-sm font-black text-emerald-950 uppercase tracking-wider">笔记编辑</h3>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 border-r border-emerald-950/20 pr-3 mr-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-900/60" />
            <input 
              type="date"
              value={formData.date}
              onChange={(e) => handleDateChange(e.target.value)}
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

      <div className="flex-1 flex flex-col overflow-hidden relative bg-white">
        <div 
          className="watermark-bg opacity-[0.05] absolute inset-0 pointer-events-none" 
          style={{ backgroundImage: `url(${WATERMARK_IMAGES.BAMBOO})` }} 
        />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative flex flex-col z-10">
          <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
            <ReactQuill 
              theme="snow"
              value={formData.content}
              onChange={handleContentChange}
              modules={modules}
              placeholder="开始输入你的笔记内容..."
              className="h-full flex flex-col"
            />
          </div>
        </main>

        {/* Footer Actions - Moved from sidebar to bottom */}
        <div className="p-4 border-t border-emerald-950/10 bg-[#f4f7f6]/80 backdrop-blur-sm flex items-center justify-center gap-4 shrink-0 relative z-20">
          <button 
            onClick={handleQuickSave}
            disabled={isSaving}
            className="w-full max-w-[200px] py-3 bg-emerald-800 text-white font-black text-[11px] uppercase tracking-widest hover:bg-emerald-900 shadow-md shadow-emerald-950/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 relative overflow-hidden"
          >
            <Save className={cn("w-3.5 h-3.5 transition-transform", isSaving && "scale-0")} />
            <span className={cn("transition-transform duration-300", isSaving && "-translate-y-full opacity-0")}>
              保存模板
            </span>
            {isSaving && (
              <motion.span 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-emerald-900 text-[11px]"
              >
                已保存
              </motion.span>
            )}
          </button>
          <button 
            onClick={handleSaveAndClose}
            className="w-full max-w-[200px] py-3 bg-white text-emerald-900 border border-emerald-900/30 font-black text-[11px] uppercase tracking-widest hover:bg-emerald-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            完成关闭
          </button>
        </div>
      </div>
    </motion.div>
  );
}
