import React from 'react';
import { motion } from 'motion/react';
import { Save, X, Edit, ThumbsUp, ThumbsDown, AlertTriangle, Lightbulb, Sprout, MapPin } from 'lucide-react';
import { WATERMARK_IMAGES } from '../types';
import { cn } from '../lib/utils';

interface NewNoteFormProps {
  onCancel: () => void;
  onSave: () => void;
}

export default function NewNoteForm({ onCancel, onSave }: NewNoteFormProps) {
  return (
    <div className="flex-1 flex flex-col h-full bg-surface relative overflow-hidden">
      <div className="watermark-bg opacity-[0.03]" style={{ backgroundImage: `url(${WATERMARK_IMAGES.SCHOLAR})`, backgroundSize: 'cover' }} />

      <header className="sticky top-0 z-20 flex justify-between items-center px-8 py-6 border-b border-outline-variant/20 bg-surface/50 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Edit className="w-5 h-5 text-primary" />
            </div>
            New TCM Note
          </h2>
          <p className="text-xs text-on-surface-variant mt-1 font-medium tracking-wide">Record a new prescription or herbal observation.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onSave}
            className="px-8 py-2.5 rounded-xl font-bold bg-primary text-on-primary hover:bg-primary-container transition-all shadow-lg flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Save className="w-4 h-4" />
            Save Note
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 relative z-10">
        <div className="max-w-3xl mx-auto space-y-8 pb-32">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-outline-variant/30 p-8 shadow-xl space-y-8"
          >
            <FormSection label="Prescription Name">
              <input 
                type="text" 
                placeholder="e.g., Yu Ping Feng San"
                className="w-full bg-surface-container-low border-b border-outline-variant px-6 py-4 rounded-t-2xl focus:border-primary focus:ring-0 text-lg font-medium transition-colors border-none"
              />
            </FormSection>

            <FormSection label="Ingredients">
              <div className="w-full bg-surface-container-low border-b border-outline-variant px-6 py-3 rounded-t-2xl min-h-[56px] flex flex-wrap items-center gap-2 focus-within:border-primary transition-colors border-none">
                <span className="inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-1.5 rounded-full text-sm font-bold shadow-md">
                  防风
                  <X className="w-3.5 h-3.5 cursor-pointer hover:bg-white/20 rounded-full" />
                </span>
                <input 
                  type="text" 
                  placeholder="Add herb..." 
                  className="bg-transparent border-none focus:ring-0 p-0 m-0 text-sm flex-1 min-w-[120px]"
                />
              </div>
              <p className="text-[10px] text-on-surface-variant/40 mt-2 font-bold uppercase tracking-widest pl-2">Press enter to add an ingredient capsule.</p>
            </FormSection>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormSection label="Source / Origin">
                <input 
                  type="text" 
                  placeholder="e.g., Danxi Xinfa"
                  className="w-full bg-surface-container-low border-none border-b border-outline-variant px-6 py-4 rounded-t-2xl focus:border-primary focus:ring-0 text-sm transition-colors"
                />
              </FormSection>
              <FormSection label="Target Constitution">
                <select className="w-full bg-surface-container-low border-none border-b border-outline-variant px-6 py-4 rounded-t-2xl focus:border-primary focus:ring-0 text-sm appearance-none cursor-pointer">
                  <option value="" disabled selected>Select constitution...</option>
                  <option>Qi Deficiency</option>
                  <option>Yin Deficiency</option>
                  <option>Yang Deficiency</option>
                  <option>Blood Stasis</option>
                </select>
              </FormSection>
            </div>

            <FormSection label="Pathogenic Analysis">
              <textarea 
                rows={4}
                placeholder="Describe the pattern and mechanism..."
                className="w-full bg-surface-container-low border-none border-b border-outline-variant px-6 py-4 rounded-t-2xl focus:border-primary focus:ring-0 text-sm transition-colors resize-none"
              />
            </FormSection>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CardWrapper label="Indications & Pros" icon={ThumbsUp} color="text-primary">
              <textarea 
                rows={3}
                placeholder="Key benefits and primary indications..."
                className="w-full bg-surface border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/10 px-4 py-3 rounded-xl text-sm transition-all resize-none"
              />
            </CardWrapper>

            <CardWrapper label="Limitations & Cons" icon={ThumbsDown} color="text-red-600" outline="border-red-100">
              <textarea 
                rows={3}
                placeholder="Potential side effects or limitations..."
                className="w-full bg-surface border border-red-50 focus:border-red-200 focus:ring-2 focus:ring-red-50 px-4 py-3 rounded-xl text-sm transition-all resize-none"
              />
            </CardWrapper>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50/50 rounded-3xl border border-red-100 p-8 shadow-sm"
          >
            <label className="flex items-center gap-3 text-red-800 mb-4 font-bold">
              <AlertTriangle className="w-5 h-5 fill-red-800/10" />
              Contraindications
            </label>
            <textarea 
              rows={2}
              placeholder="Strictly avoid in cases of..."
              className="w-full bg-white border border-red-100 focus:border-red-300 focus:ring-0 px-6 py-4 rounded-2xl text-sm transition-all shadow-sm resize-none"
            />
          </motion.div>

          <CardWrapper label="Key Usage Points" icon={Lightbulb} color="text-blue-700" outline="border-blue-100" bg="bg-blue-50/30">
            <textarea 
              rows={2}
              placeholder="Clinical pearls, dosage notes, or preparation tips..."
              className="w-full bg-white border border-blue-50 focus:border-blue-200 focus:ring-0 px-6 py-4 rounded-2xl text-sm transition-all shadow-sm resize-none"
            />
          </CardWrapper>
        </div>
      </div>
    </div>
  );
}

function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-bold text-on-surface-variant/40 uppercase tracking-widest pl-2">{label}</label>
      {children}
    </div>
  );
}

function CardWrapper({ 
  label, 
  icon: Icon, 
  color, 
  children, 
  outline = "border-outline-variant/30",
  bg = "bg-white" 
}: any) {
  return (
    <div className={cn("rounded-3xl border p-6 shadow-sm", outline, bg)}>
      <label className={cn("flex items-center gap-2 mb-4 font-bold text-sm", color)}>
        <Icon className="w-4 h-4" />
        {label}
      </label>
      {children}
    </div>
  );
}
