import React, { useState, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Highlighter,
  Image as ImageIcon,
  Upload,
  X,
  Eye,
  Edit3,
  Trash2,
  FileText,
  Paperclip,
  Check,
  Table as TableIcon,
  Sparkles,
} from 'lucide-react';

export interface PhotoAttachment {
  id: string;
  name: string;
  url: string;
  caption?: string;
  size?: string;
}

interface RichDocumentEditorProps {
  value: string;
  onChange: (content: string) => void;
  attachments?: PhotoAttachment[];
  onAttachmentsChange?: (attachments: PhotoAttachment[]) => void;
  placeholder?: string;
  label?: string;
  minHeight?: string;
}

export const RichDocumentEditor: React.FC<RichDocumentEditorProps> = ({
  value,
  onChange,
  attachments = [],
  onAttachmentsChange,
  placeholder = 'Write document notes, meeting minutes, or report details...',
  label = 'Document Content & Meeting Notes',
  minHeight = 'min-h-[260px]',
}) => {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formatting Helper
  const applyFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || 'text';
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 10);
  };

  const insertBlockFormat = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    const lines = (selectedText || 'Item text').split('\n');
    const formatted = lines.map((line) => `${prefix}${line}`).join('\n');

    const newValue = value.substring(0, start) + formatted + value.substring(end);
    onChange(newValue);
  };

  const insertTableTemplate = () => {
    const tableMd = `\n| Agenda Item / Topic | Decisions & Outcome | Action Lead | Deadline |\n|--------------------|--------------------|-------------|----------|\n| 1. Financial Review | Approved Q3 budget | H. Niyaz    | Aug 15   |\n| 2. Camp Logistics   | Site booked        | A. Yumna    | Aug 20   |\n\n`;
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + tableMd);
      return;
    }
    const start = textarea.selectionStart;
    const newValue = value.substring(0, start) + tableMd + value.substring(start);
    onChange(newValue);
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    (Array.from(files) as File[]).forEach((file: File) => {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (PNG, JPG, WEBP).');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        if (url) {
          const newAtt: PhotoAttachment = {
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: file.name,
            url,
            caption: file.name.split('.')[0],
            size: `${(file.size / 1024).toFixed(1)} KB`,
          };

          if (onAttachmentsChange) {
            onAttachmentsChange([...attachments, newAtt]);
          }

          // Also insert inline photo reference in document text
          const imageTag = `\n![${file.name}](${url})\n*Photo: ${file.name}*\n`;
          onChange(value + imageTag);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    if (onAttachmentsChange) {
      onAttachmentsChange(attachments.filter((a) => a.id !== id));
    }
  };

  const updateCaption = (id: string, caption: string) => {
    if (onAttachmentsChange) {
      onAttachmentsChange(
        attachments.map((a) => (a.id === id ? { ...a, caption } : a))
      );
    }
  };

  // Simple renderer for formatting tags in preview mode
  const renderFormattedPreview = (text: string) => {
    if (!text.trim()) {
      return (
        <p className="text-slate-400 italic text-sm">
          No document content written yet. Click Write to edit notes.
        </p>
      );
    }

    const lines = text.split('\n');
    return (
      <div className="space-y-3 text-slate-100 leading-relaxed text-sm">
        {lines.map((line, idx) => {
          if (line.startsWith('# ')) {
            return (
              <h1 key={idx} className="text-xl font-bold text-emerald-400 border-b border-slate-700 pb-1 mt-4">
                {line.replace('# ', '')}
              </h1>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-lg font-bold text-slate-100 mt-3">
                {line.replace('## ', '')}
              </h2>
            );
          }
          if (line.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-base font-semibold text-slate-200 mt-2">
                {line.replace('### ', '')}
              </h3>
            );
          }
          if (line.startsWith('• ') || line.startsWith('- ')) {
            return (
              <li key={idx} className="ml-5 list-disc text-slate-200">
                {line.replace(/^[•-]\s*/, '')}
              </li>
            );
          }
          if (/^\d+\.\s/.test(line)) {
            return (
              <li key={idx} className="ml-5 list-decimal text-slate-200">
                {line.replace(/^\d+\.\s*/, '')}
              </li>
            );
          }
          if (line.startsWith('> ')) {
            return (
              <blockquote key={idx} className="border-l-4 border-emerald-500 pl-3 italic text-slate-300 my-2 bg-emerald-500/5 py-1 rounded-r">
                {line.replace('> ', '')}
              </blockquote>
            );
          }
          if (line.startsWith('![') && line.includes('](')) {
            const match = line.match(/!\[(.*?)\]\((.*?)\)/);
            if (match) {
              return (
                <div key={idx} className="my-3 space-y-1">
                  <img
                    src={match[2]}
                    alt={match[1]}
                    className="max-h-80 rounded-xl border border-slate-700 object-cover"
                  />
                  <p className="text-xs text-slate-400 italic">{match[1]}</p>
                </div>
              );
            }
          }
          if (line.startsWith('|')) {
            return (
              <div key={idx} className="font-mono text-xs overflow-x-auto bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-slate-300">
                {line}
              </div>
            );
          }
          if (!line.trim()) return <div key={idx} className="h-1" />;

          return <p key={idx} className="text-slate-200">{line}</p>;
        })}
      </div>
    );
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  return (
    <div className="space-y-3">
      {/* Label and Mode Toggle Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>{label}</span>
        </label>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">
            {wordCount} words • {charCount} chars
          </span>

          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('write')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'write'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> Write
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Document Preview
            </button>
          </div>
        </div>
      </div>

      {/* Editor Container */}
      <div className="bg-[#12151B] border border-slate-800 rounded-2xl overflow-hidden focus-within:border-emerald-500/50 transition">
        {/* Microsoft Word Style Toolbar */}
        {activeTab === 'write' && (
          <div className="bg-slate-900/90 border-b border-slate-800 p-2 flex flex-wrap items-center gap-1 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => applyFormatting('**', '**')}
              title="Bold (Ctrl+B)"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyFormatting('*', '*')}
              title="Italic (Ctrl+I)"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyFormatting('<u>', '</u>')}
              title="Underline"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <Underline className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyFormatting('~~', '~~')}
              title="Strikethrough"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <Strikethrough className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-slate-800 mx-1" />

            <button
              type="button"
              onClick={() => insertBlockFormat('# ')}
              title="Heading 1"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertBlockFormat('## ')}
              title="Heading 2"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertBlockFormat('### ')}
              title="Heading 3"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <Heading3 className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-slate-800 mx-1" />

            <button
              type="button"
              onClick={() => insertBlockFormat('• ')}
              title="Bulleted List"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertBlockFormat('1. ')}
              title="Numbered List"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertBlockFormat('> ')}
              title="Quote Block"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <Quote className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={insertTableTemplate}
              title="Insert Resolution / Decision Table"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition flex items-center gap-1"
            >
              <TableIcon className="w-4 h-4 text-emerald-400" />
            </button>

            <div className="w-px h-5 bg-slate-800 mx-1" />

            {/* Photo Upload Trigger Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg transition flex items-center gap-1 font-semibold text-xs ml-auto"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Insert Photo</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
          </div>
        )}

        {/* Text Area / Document Surface */}
        <div className="p-4">
          {activeTab === 'write' ? (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={`w-full bg-transparent text-slate-100 text-sm focus:outline-none resize-y leading-relaxed font-sans ${minHeight}`}
            />
          ) : (
            <div className={`p-2 ${minHeight}`}>
              {renderFormattedPreview(value)}
            </div>
          )}
        </div>
      </div>

      {/* Photo Attachments & Uploaded Images Section */}
      {attachments.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Paperclip className="w-4 h-4" /> Attached Photos & Documents ({attachments.length})
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Click photo caption to edit label
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden group relative flex flex-col justify-between"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-900">
                  <img
                    src={att.url}
                    alt={att.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg"
                    title="Delete Photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-1.5 space-y-1">
                  <input
                    type="text"
                    value={att.caption || ''}
                    onChange={(e) => updateCaption(att.id, e.target.value)}
                    placeholder="Photo caption..."
                    className="w-full bg-slate-900 text-[11px] text-slate-200 px-1.5 py-0.5 rounded border border-slate-800 focus:outline-none focus:border-emerald-500/50"
                  />
                  {att.size && (
                    <span className="text-[9px] font-mono text-slate-400 block text-center">
                      {att.size}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
