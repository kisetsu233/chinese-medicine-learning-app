import React from 'react';
import { motion } from 'motion/react';
import { ClipboardList, Microscope, Sprout, Coffee, Pill, Hand, Footprints } from 'lucide-react';
import { cn } from '../lib/utils';

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
  'tcm-view': '中医如何看待',
  triggers: '诱发因素',
  'tcm-mechanism': '中医病机',
  strategy: '调理思路',
  methods: '调理方法',
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
    { id: 'overview', subs: ['what-is', 'misconceptions', 'tcm-view', 'triggers'] },
    { id: 'mechanism', subs: ['tcm-mechanism', 'strategy', 'methods'] },
    { id: 'prescriptions', subs: ['base-presc', 'adjustments', 'cases'], isPresc: true },
    { id: 'dietary' },
    { id: 'patent-med' },
    { id: 'external' },
    { id: 'footbath' },
  ];

  const hasContent = (id: string, subs?: string[]) => {
    if (subs) {
      return subs.some(sub => parsedData[sub]?.trim());
    }
    return parsedData[id]?.trim();
  };

  return (
    <div className="space-y-8 py-2">
      {sections.map((section) => {
        if (!hasContent(section.id, section.subs)) return null;
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
                      <div className="p-4 bg-[#f8fbfa] border border-emerald-950/5 text-xs leading-relaxed text-emerald-950">
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
                        ) : (
                          content
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-[#f8fbfa] border border-emerald-950/5 text-xs leading-relaxed text-emerald-950">
                {parsedData[section.id]}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
