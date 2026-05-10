import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Calendar, CheckSquare, Square, FileText, FileJson, ArrowRight } from 'lucide-react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '../lib/utils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  journalData: Record<string, any>;
}

export default function ExportModal({ isOpen, onClose, journalData }: ExportModalProps) {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-01'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>(['tcm', 'note', 'genNote']);
  const [exportFormat, setExportFormat] = useState<'markdown' | 'json' | 'txt' | 'pdf'>('markdown');

  const toggleTemplate = (id: string) => {
    setSelectedTemplates(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    const filteredData: any[] = [];
    
    // Sort dates
    const dates = Object.keys(journalData).sort();

    dates.forEach(dateStr => {
      const date = parseISO(dateStr);
      if (isWithinInterval(date, { start, end })) {
        const entry = journalData[dateStr];
        const content: any = { date: dateStr };
        let hasContent = false;

        selectedTemplates.forEach(t => {
          if (entry[t]) {
            content[t] = entry[t];
            hasContent = true;
          }
        });

        if (hasContent) {
          filteredData.push(content);
        }
      }
    });

    if (filteredData.length === 0) {
      alert('所选范围内没有找到匹配的笔记');
      return;
    }

    let blob: Blob;
    let filename: string;

    if (exportFormat === 'json') {
      const jsonContent = JSON.stringify(filteredData, null, 2);
      blob = new Blob([jsonContent], { type: 'application/json' });
      filename = `notes_export_${startDate}_to_${endDate}.json`;
    } else {
      // Markdown/Text/PDF formats (all text-based for now, PDF can be a simple print-like blob or just text)
      let content = exportFormat === 'markdown' ? `# 笔记导出 (${startDate} 至 ${endDate})\n\n` : `笔记导出 (${startDate} 至 ${endDate})\n\n`;
      
      filteredData.forEach(entry => {
        content += exportFormat === 'markdown' ? `## 日期: ${entry.date}\n\n` : `日期: ${entry.date}\n\n`;
        
        if (entry.tcm) {
          const tcm = typeof entry.tcm === 'string' ? JSON.parse(entry.tcm) : entry.tcm;
          content += exportFormat === 'markdown' ? `### [中药药方]\n` : `[中药药方]\n`;
          content += `药方名称: ${tcm.name || '未命名'}\n`;
          if (tcm.diagnosis) content += `诊断: ${tcm.diagnosis}\n`;
          if (tcm.herbs && tcm.herbs.length > 0) {
            content += `药材:\n`;
            tcm.herbs.forEach((h: any) => {
              content += `- ${h.name} (${h.amount}${h.unit})${h.instruction ? ` - ${h.instruction}` : ''}\n`;
            });
          }
          if (tcm.usage) content += `\n用法: ${tcm.usage}\n`;
          content += `\n${exportFormat === 'markdown' ? '---' : '-------------------'}\n\n`;
        }

        if (entry.note) {
          content += exportFormat === 'markdown' ? `### [临床笔记]\n` : `[临床笔记]\n`;
          try {
            const parsed = typeof entry.note === 'string' ? JSON.parse(entry.note) : entry.note;
            Object.entries(parsed).forEach(([key, val]) => {
              if (key !== 'date' && val) {
                content += `**${key}:** ${val}\n\n`;
              }
            });
          } catch (e) {
            content += `${entry.note}\n\n`;
          }
          content += `\n${exportFormat === 'markdown' ? '---' : '-------------------'}\n\n`;
        }

        if (entry.genNote) {
          content += exportFormat === 'markdown' ? `### [学习笔记]\n` : `[学习笔记]\n`;
          try {
            const parsed = typeof entry.genNote === 'string' ? JSON.parse(entry.genNote) : entry.genNote;
            const noteContent = parsed.content || entry.genNote;
            // Minimal HTML to Text conversion
            const cleanText = noteContent.replace(/<[^>]*>/g, '\n').replace(/\n\s*\n/g, '\n\n');
            content += `${cleanText}\n\n`;
          } catch (e) {
            content += `${entry.genNote}\n\n`;
          }
          content += `\n${exportFormat === 'markdown' ? '---' : '-------------------'}\n\n`;
        }
      });

      if (exportFormat === 'pdf') {
        // PDF implementation (simulated via text blob for now, or could use window.print)
        blob = new Blob([content], { type: 'application/pdf' });
        filename = `notes_export_${startDate}_to_${endDate}.pdf`;
      } else if (exportFormat === 'txt') {
        blob = new Blob([content], { type: 'text/plain' });
        filename = `notes_export_${startDate}_to_${endDate}.txt`;
      } else {
        blob = new Blob([content], { type: 'text/markdown' });
        filename = `notes_export_${startDate}_to_${endDate}.md`;
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative z-10 border border-emerald-950/10"
          >
            {/* Header */}
            <div className="bg-[#f4f7f6] px-6 py-4 border-b border-emerald-950/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-900">
                <Download className="w-5 h-5" />
                <h3 className="font-black text-sm uppercase tracking-widest">导出笔记</h3>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-emerald-100 rounded-full transition-colors text-emerald-900/40">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Date Range */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-900/40 uppercase tracking-widest">
                  <Calendar className="w-3.5 h-3.5" />
                  选择日期范围
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] text-emerald-900/60 font-bold uppercase pl-1">开始日期</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-[#f8fbfa] border border-emerald-950/10 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500/30 outline-none font-medium"
                    />
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-900/20 mt-4" />
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] text-emerald-900/60 font-bold uppercase pl-1">结束日期</label>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-[#f8fbfa] border border-emerald-950/10 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500/30 outline-none font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Templates */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-900/40 uppercase tracking-widest">
                  <CheckSquare className="w-3.5 h-3.5" />
                  包含模板类型
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'tcm', label: '中药模版' },
                    { id: 'note', label: '常见病模版' },
                    { id: 'genNote', label: '笔记' }
                  ].map(tmpl => (
                    <button
                      key={tmpl.id}
                      onClick={() => toggleTemplate(tmpl.id)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border transition-all text-left group",
                        selectedTemplates.includes(tmpl.id)
                          ? "bg-emerald-50 border-emerald-900/20 text-emerald-900"
                          : "bg-[#f8fbfa] border-emerald-950/5 text-emerald-900/40"
                      )}
                    >
                      <span className="text-[11px] font-bold uppercase tracking-wider">{tmpl.label}</span>
                      {selectedTemplates.includes(tmpl.id) ? (
                        <CheckSquare className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-900/40 uppercase tracking-widest">
                  <FileText className="w-3.5 h-3.5" />
                  导出格式
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setExportFormat('markdown')}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center",
                      exportFormat === 'markdown'
                        ? "bg-emerald-50 border-emerald-900/20 text-emerald-900"
                        : "bg-[#f8fbfa] border-emerald-950/5 text-emerald-900/40"
                    )}
                  >
                    <FileText className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase">Markdown</span>
                  </button>
                  <button
                    onClick={() => setExportFormat('json')}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center",
                      exportFormat === 'json'
                        ? "bg-emerald-50 border-emerald-900/20 text-emerald-900"
                        : "bg-[#f8fbfa] border-emerald-950/5 text-emerald-900/40"
                    )}
                  >
                    <FileJson className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase">JSON</span>
                  </button>
                  <button
                    onClick={() => setExportFormat('txt')}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center",
                      exportFormat === 'txt'
                        ? "bg-emerald-50 border-emerald-900/20 text-emerald-900"
                        : "bg-[#f8fbfa] border-emerald-950/5 text-emerald-900/40"
                    )}
                  >
                    <FileText className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase">TXT</span>
                  </button>
                  <button
                    onClick={() => setExportFormat('pdf')}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center",
                      exportFormat === 'pdf'
                        ? "bg-emerald-50 border-emerald-900/20 text-emerald-900"
                        : "bg-[#f8fbfa] border-emerald-950/5 text-emerald-900/40"
                    )}
                  >
                    <FileText className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase">PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 pt-0">
              <button
                onClick={handleExport}
                className="w-full py-4 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                <Download className="w-4 h-4" />
                立即导出
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
