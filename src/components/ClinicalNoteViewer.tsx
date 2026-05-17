import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardList, Microscope, Sprout, Coffee, Pill, Hand, Footprints } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../services/api';
import PrescriptionDetailModal from './PrescriptionDetailModal';

interface ClinicalNoteViewerProps {
  data: string;
  onHerbClick?: (name: string) => void;
}

const SECTION_ICONS: Record<string, any> = {
  overview: ClipboardList,
  mechanism: Microscope,
  prescriptions: Sprout,
  dietary: Coffee,
  'patent-med': Pill,
  external: Hand,
  footbath: Footprints,
};

const SECTION_LABELS: Record<string, string> = {
  overview: '疾病概述',
  mechanism: '病机与调理',
  prescriptions: '方剂',
  dietary: '食疗方',
  'patent-med': '中成药',
  external: '外治疗法',
  footbath: '泡脚方',
};

const SUBSECTION_LABELS: Record<string, string> = {
  'what-is': '什么是【疾病名】',
  misconceptions: '治疗误区',
  triggers: '诱发因素',
  'tcm-mechanism': '中医病机',
  strategy: '调理思路',
  'base-presc': '基础方',
  adjustments: '随证加减',
  cases: '临床案例',
};

export default function ClinicalNoteViewer({ data, onHerbClick }: ClinicalNoteViewerProps) {
  let parsedData: Record<string, string> = {};
  try {
    if (data.startsWith('{') && data.endsWith('}')) {
      parsedData = JSON.parse(data);
    } else {
      return <p className="whitespace-pre-wrap">{data}</p>;
    }
  } catch (e) {
    return <p className="whitespace-pre-wrap">{data}</p>;
  }

  const sections = [
    { id: 'overview', subs: ['what-is', 'misconceptions', 'triggers'] },
    { id: 'mechanism', subs: ['tcm-mechanism', 'strategy'] },
    { id: 'prescriptions', subs: ['base-presc', 'adjustments', 'cases'], isPresc: true },
    { id: 'dietary' },
    { id: 'patent-med', alwaysShow: true },
    { id: 'external' },
    { id: 'footbath' },
  ];

  const [prescriptions, setPrescriptions] = useState<Record<string, any>>({});
  const [selectedTcm, setSelectedTcm] = useState<any>(null);

  useEffect(() => {
    api.getJournals().then(data => {
      const list: Record<string, any> = {};
      Object.values(data).forEach((day: any) => {
        if (day.tcm && day.tcm.name) {
          list[day.tcm.name] = day.tcm;
        }
      });
      setPrescriptions(list);
    }).catch(console.error);
  }, []);

  const hasContent = (section: any) => {
    if (section.alwaysShow) return true;
    if (section.subs) {
      return section.subs.some((sub: string) => parsedData[sub]?.trim());
    }
    return parsedData[section.id]?.trim();
  };

  const cleanHtmlToText = (html: string) => {
    if (!html) return '';
    if (!html.includes('<')) return html;
    return html
      .replace(/<p><br><\/p>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
  };

  return (
    <div className="space-y-8 py-2">
      {sections.map((section) => {
        if (!hasContent(section)) return null;
        const Icon = SECTION_ICONS[section.id];

        return (
          <div key={section.id} className="space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-emerald-950/10 pb-1">
              <Icon className="w-3.5 h-3.5 text-emerald-900/40" />
              <h3 className="text-[11px] font-black text-emerald-950 uppercase tracking-widest">{SECTION_LABELS[section.id]}</h3>
            </div>

            {section.subs ? (
              <div className="grid grid-cols-1 gap-3">
                {section.subs.map(sub => {
                  const content = parsedData[sub];
                  if (!content?.trim()) return null;
                  return (
                    <div key={sub} className="space-y-1">
                      <h4 className="text-[9px] font-black text-emerald-900/20 uppercase tracking-[0.2em] pl-1">{SUBSECTION_LABELS[sub]}</h4>
                      <div className="p-4 bg-[#f8fbfa] border border-emerald-950/5 text-xs leading-relaxed text-emerald-950 whitespace-pre-wrap">
                        {sub === 'base-presc' ? (
                          <div className="flex flex-wrap gap-2">
                            {content.split(/[，、,;； \n\t]+/).filter(tag => tag.trim()).map((tag, idx) => {
                              const cleaned = tag.replace(/[0-9.g克ml毫升mg毫克 ]+$/, '').trim();
                              if (!cleaned) return null;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => onHerbClick?.(cleaned)}
                                  className="px-2 py-1 bg-emerald-800/5 text-emerald-900 text-[10px] font-bold border border-emerald-900/10 italic rounded hover:bg-emerald-800 hover:text-white transition-colors"
                                >
                                  {cleaned}
                                </button>
                              );
                            })}
                          </div>
                        ) : sub === 'cases' ? (
                          <div dangerouslySetInnerHTML={{ __html: content }} className="prose prose-sm prose-emerald max-w-none" />
                        ) : (
                          cleanHtmlToText(content)
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : section.id === 'patent-med' ? (
              <div className="p-4 bg-[#f8fbfa] border border-emerald-950/5 text-xs leading-relaxed text-emerald-950 whitespace-pre-wrap">
                {(() => {
                  const content = cleanHtmlToText(parsedData[section.id] || '');
                  if (!content) return <span className="text-emerald-900/40">暂时没有</span>;

                  const names = Object.keys(prescriptions).filter(name => name && content.includes(name));
                  if (names.length === 0) return content;

                  // Sort names to show longer ones first if needed, though for a list it doesn't strictly matter
                  const sortedNames = [...names].sort((a, b) => b.length - a.length);

                  return (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2 pb-3 border-b border-emerald-950/5">
                        {sortedNames.map(name => (
                          <button
                            key={name}
                            onClick={() => setSelectedTcm(prescriptions[name])}
                            className="px-3 py-1.5 bg-emerald-800 text-white text-[11px] font-bold rounded shadow-sm hover:bg-emerald-900 transition-colors flex items-center gap-1.5"
                          >
                            <Sprout className="w-3.5 h-3.5 opacity-70" />
                            {name}
                          </button>
                        ))}
                      </div>
                      <div className="whitespace-pre-wrap leading-relaxed text-emerald-950/80">
                        {content}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="p-4 bg-[#f8fbfa] border border-emerald-950/5 text-xs leading-relaxed text-emerald-950 whitespace-pre-wrap">
                {cleanHtmlToText(parsedData[section.id])}
              </div>
            )}
          </div>
        );
      })}

      <AnimatePresence>
        {selectedTcm && (
          <PrescriptionDetailModal
            data={selectedTcm}
            onClose={() => setSelectedTcm(null)}
            onHerbClick={onHerbClick}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
