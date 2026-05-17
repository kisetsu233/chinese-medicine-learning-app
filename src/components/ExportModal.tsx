import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Calendar, CheckSquare, Square, FileText, FileJson, ArrowRight } from 'lucide-react';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { cn } from '../lib/utils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  journalData: Record<string, any>;
}

const NOTE_LABELS: Record<string, string> = {
  overview: '疾病概述',
  mechanism: '病机与调理',
  prescriptions: '方剂',
  dietary: '食疗方',
  'patent-med': '中成药',
  external: '外治疗法',
  footbath: '泡脚方',
  'what-is': '什么是【疾病名】',
  misconceptions: '治疗误区',
  triggers: '诱发因素',
  'tcm-mechanism': '中医病机',
  strategy: '调理思路',
  'base-presc': '基础方',
  adjustments: '随证加减',
  cases: '临床案例',
};

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

  const getFilteredData = () => {
    const start = startOfDay(parseISO(startDate));
    const end = endOfDay(parseISO(endDate));

    console.log(`Exporting from ${start.toISOString()} to ${end.toISOString()}`);
    console.log('Available journal data keys:', Object.keys(journalData));

    const filteredData: any[] = [];
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
        if (hasContent) filteredData.push(content);
      }
    });
    console.log(`Found ${filteredData.length} matching entries.`);
    return filteredData;
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const buildTextContent = (filteredData: any[], isMarkdown: boolean) => {
    let content = isMarkdown
      ? `# 笔记导出 (${startDate} 至 ${endDate})\n\n`
      : `笔记导出 (${startDate} 至 ${endDate})\n\n`;

    filteredData.forEach(entry => {
      content += isMarkdown ? `## 日期: ${entry.date}\n\n` : `日期: ${entry.date}\n\n`;

      if (entry.tcm) {
        const tcm = typeof entry.tcm === 'string' ? JSON.parse(entry.tcm) : entry.tcm;
        content += isMarkdown ? `### [中药药方]\n` : `[中药药方]\n`;
        content += `药方名称: ${tcm.name || '未命名'}\n`;
        if (tcm.diagnosis) content += `诊断: ${tcm.diagnosis}\n`;
        if (tcm.herbs && tcm.herbs.length > 0) {
          content += `药材:\n`;
          tcm.herbs.forEach((h: any) => {
            const herbName = typeof h === 'string' ? h : (h.name || String(h));
            content += `- ${herbName}\n`;
          });
        }
        if (tcm.usage) content += `\n用法: ${tcm.usage}\n`;
        content += `\n${isMarkdown ? '---' : '-------------------'}\n\n`;
      }

      if (entry.note) {
        content += isMarkdown ? `### [临床笔记]\n` : `[临床笔记]\n`;
        try {
          const parsed = typeof entry.note === 'string' ? JSON.parse(entry.note) : entry.note;
          Object.entries(parsed).forEach(([key, val]) => {
            if (key !== 'date' && val) {
              const label = NOTE_LABELS[key] || key;
              content += `**${label}:** ${val}\n\n`;
            }
          });
        } catch {
          content += `${entry.note}\n\n`;
        }
        content += `\n${isMarkdown ? '---' : '-------------------'}\n\n`;
      }

      if (entry.genNote) {
        content += isMarkdown ? `### [学习笔记]\n` : `[学习笔记]\n`;
        try {
          const parsed = typeof entry.genNote === 'string' ? JSON.parse(entry.genNote) : entry.genNote;
          const noteContent = parsed.content || entry.genNote;
          const cleanText = noteContent.replace(/<[^>]*>/g, '\n').replace(/\n\s*\n/g, '\n\n');
          content += `${cleanText}\n\n`;
        } catch {
          content += `${entry.genNote}\n\n`;
        }
        content += `\n${isMarkdown ? '---' : '-------------------'}\n\n`;
      }
    });

    return content;
  };

  const exportAsPDF = (filteredData: any[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('请允许弹出窗口以导出 PDF。\n\n请在浏览器的地址栏旁边查找"已阻止弹出窗口"的提示并允许它。');
      return;
    }

    let bodyHtml = '';
    filteredData.forEach(entry => {
      bodyHtml += `<div class="entry"><h2 class="date">${entry.date}</h2>`;

      if (entry.tcm) {
        const tcm = typeof entry.tcm === 'string' ? JSON.parse(entry.tcm) : entry.tcm;
        bodyHtml += `<div class="section"><h3>中药药方</h3>`;
        bodyHtml += `<p><strong>药方名称：</strong>${tcm.name || '未命名'}</p>`;
        if (tcm.diagnosis) bodyHtml += `<p><strong>诊断：</strong>${tcm.diagnosis}</p>`;
        if (tcm.herbs && tcm.herbs.length > 0) {
          bodyHtml += `<p><strong>药材：</strong></p><ul>`;
          tcm.herbs.forEach((h: any) => {
            const herbName = typeof h === 'string' ? h : (h.name || String(h));
            bodyHtml += `<li>${herbName}</li>`;
          });
          bodyHtml += `</ul>`;
        }
        if (tcm.analysis) bodyHtml += `<p><strong>方剂分析：</strong>${tcm.analysis}</p>`;
        if (tcm.usage) bodyHtml += `<p><strong>用法：</strong>${tcm.usage}</p>`;
        bodyHtml += `</div>`;
      }

      if (entry.note) {
        bodyHtml += `<div class="section"><h3>临床笔记</h3>`;
        try {
          const parsed = typeof entry.note === 'string' ? JSON.parse(entry.note) : entry.note;
          Object.entries(parsed).forEach(([key, val]) => {
            if (key !== 'date' && val) {
              const label = NOTE_LABELS[key] || key;
              bodyHtml += `<p><strong>${label}：</strong>${val}</p>`;
            }
          });
        } catch {
          bodyHtml += `<p>${entry.note}</p>`;
        }
        bodyHtml += `</div>`;
      }

      if (entry.genNote) {
        bodyHtml += `<div class="section"><h3>学习笔记</h3>`;
        try {
          const parsed = typeof entry.genNote === 'string' ? JSON.parse(entry.genNote) : entry.genNote;
          bodyHtml += parsed.content || entry.genNote;
        } catch {
          bodyHtml += `<p>${entry.genNote}</p>`;
        }
        bodyHtml += `</div>`;
      }

      bodyHtml += `</div>`;
    });

    printWindow.document.write(`<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8" />
  <title>临床笔记汇编 ${startDate} 至 ${endDate}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Noto Serif SC', 'STSong', 'SimSun', serif;
      color: #1a2e1a;
      background: #fff;
      padding: 48px;
      line-height: 1.9;
      font-size: 14px;
    }
    .cover-title {
      text-align: center;
      font-size: 26px;
      font-weight: 700;
      margin-bottom: 6px;
      color: #1a3a1a;
      letter-spacing: 0.05em;
    }
    .cover-sub {
      text-align: center;
      font-size: 11px;
      color: #888;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      margin-bottom: 48px;
      padding-bottom: 24px;
      border-bottom: 1px solid #c8ddc8;
    }
    .entry {
      margin-bottom: 48px;
      padding-bottom: 40px;
      border-bottom: 1px solid #d1e0d1;
    }
    h2.date {
      font-size: 20px;
      font-weight: 700;
      color: #1a3a1a;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #4a7c4a;
    }
    .section {
      background: #f7fbf7;
      border-left: 4px solid #5a8a5a;
      padding: 16px 20px;
      margin-bottom: 16px;
      border-radius: 0 6px 6px 0;
      white-space: pre-wrap;
    }
    h3 {
      font-size: 11px;
      font-weight: 700;
      color: #2d5a2d;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      margin-bottom: 12px;
    }
    p { margin-bottom: 8px; color: #2a3a2a; }
    ul { padding-left: 20px; margin-bottom: 8px; }
    li { margin-bottom: 4px; color: #2a3a2a; }
    strong { color: #1a4a1a; font-weight: 700; }
    @media print {
      body { padding: 20px; }
      .entry { page-break-inside: avoid; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <p class="cover-title">临床笔记汇编</p>
  <p class="cover-sub">${startDate} &mdash; ${endDate}</p>
  ${bodyHtml}
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 600);
    };
  </script>
</body>
</html>`);
    printWindow.document.close();
  };

  const handleExport = () => {
    const filteredData = getFilteredData();

    if (filteredData.length === 0) {
      alert('所选范围内没有找到匹配的笔记');
      return;
    }

    if (exportFormat === 'json') {
      const jsonContent = JSON.stringify(filteredData, null, 2);
      triggerDownload(new Blob([jsonContent], { type: 'application/json' }), `notes_export_${startDate}_to_${endDate}.json`);
      onClose();
    } else if (exportFormat === 'pdf') {
      exportAsPDF(filteredData);
      onClose();
    } else if (exportFormat === 'txt') {
      const content = buildTextContent(filteredData, false);
      triggerDownload(new Blob([content], { type: 'text/plain;charset=utf-8' }), `notes_export_${startDate}_to_${endDate}.txt`);
      onClose();
    } else {
      // markdown
      const content = buildTextContent(filteredData, true);
      triggerDownload(new Blob([content], { type: 'text/markdown;charset=utf-8' }), `notes_export_${startDate}_to_${endDate}.md`);
      onClose();
    }
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
                  {([
                    { id: 'markdown', label: 'Markdown', Icon: FileText },
                    { id: 'json', label: 'JSON', Icon: FileJson },
                    { id: 'txt', label: 'TXT', Icon: FileText },
                    { id: 'pdf', label: 'PDF（打印）', Icon: FileText },
                  ] as const).map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      onClick={() => setExportFormat(id)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center",
                        exportFormat === id
                          ? "bg-emerald-50 border-emerald-900/20 text-emerald-900"
                          : "bg-[#f8fbfa] border-emerald-950/5 text-emerald-900/40"
                      )}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-[10px] font-bold uppercase">{label}</span>
                    </button>
                  ))}
                </div>
                {exportFormat === 'pdf' && (
                  <p className="text-[10px] text-emerald-800/50 leading-relaxed pl-1">
                    将在新窗口打开排版好的笔记，请在弹出的打印对话框中选择「存储为 PDF」即可保存。
                  </p>
                )}
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
