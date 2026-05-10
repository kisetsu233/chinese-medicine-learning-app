import React from 'react';

interface GeneralNoteViewerProps {
  data: string;
}

export default function GeneralNoteViewer({ data }: GeneralNoteViewerProps) {
  let content = data;
  try {
    if (data.startsWith('{') && data.endsWith('}')) {
      const parsed = JSON.parse(data);
      content = parsed.content || '';
    }
  } catch (e) {
    // If parsing fails, use the raw data
  }

  if (!content) return null;

  return (
    <div className="py-2">
      <div 
        className="ql-editor !p-0 !min-h-0 text-xs leading-relaxed text-emerald-950 prose prose-emerald prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
