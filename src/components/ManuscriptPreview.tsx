import React from 'react';
import { motion } from 'motion/react';
import { Download, FileDown, Settings2 } from 'lucide-react';
import { ManuscriptOptions } from '../lib/pdfGenerator';
import { cn } from '../lib/utils';

interface ManuscriptPreviewProps {
  chapters: { title: string; content: string }[];
  options: ManuscriptOptions;
  setOptions: (options: ManuscriptOptions) => void;
  onExport: () => void;
}

const formatNumberHelper = (n: number, format: 'none' | 'arabic' | 'roman' | 'words') => {
  if (format === 'none') return '';
  if (format === 'arabic') return n.toString();
  if (format === 'roman') {
    const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];
    return roman[n - 1] || n.toString();
  }
  if (format === 'words') {
    const words = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
    return words[n - 1] || n.toString();
  }
  return n.toString();
};

export const ManuscriptPreview: React.FC<ManuscriptPreviewProps> = ({ 
  chapters, 
  options, 
  setOptions,
  onExport 
}) => {
  const combinedContent = chapters.map((c, idx) => {
    const num = formatNumberHelper(idx + 1, options.numberingFormat);
    const title = options.numberingFormat !== 'none' ? `Chapter ${num}: ${c.title}` : c.title;
    return `<h2>${title}</h2>${c.content}`;
  }).join('');
  const totalWords = chapters.reduce((acc, c) => acc + c.content.replace(/<[^>]*>?/gm, ' ').split(/\s+/).filter(Boolean).length, 0);

  return (
    <div className="h-full flex flex-col bg-[#F5F2ED]">
      {/* Formatting Controls */}
      <div className="h-12 border-b border-editorial-border bg-white flex items-center px-8 gap-6 shadow-sm z-10 shrink-0 overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-editorial-accent font-bold">Type</span>
          <select 
            value={options.fontFamily}
            onChange={e => setOptions({ ...options, fontFamily: e.target.value as any })}
            className="text-xs bg-transparent border border-editorial-border rounded px-2 py-1 cursor-pointer outline-none focus:ring-0 font-serif"
          >
            <option value="times">Times New Roman</option>
            <option value="courier">Courier New</option>
            <option value="helvetica">Arial/Helvetica</option>
          </select>
          <select 
            value={options.fontSize}
            onChange={e => setOptions({ ...options, fontSize: parseInt(e.target.value) })}
            className="text-xs bg-transparent border border-editorial-border rounded px-2 py-1 cursor-pointer outline-none focus:ring-0"
          >
            {[10, 11, 12, 14, 16].map(s => <option key={s} value={s}>{s}pt</option>)}
          </select>
        </div>

        <div className="h-4 w-[1px] bg-editorial-border"></div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-editorial-accent font-bold">Style</span>
          <select 
            value={options.paragraphStyle}
            onChange={e => setOptions({ ...options, paragraphStyle: e.target.value as any })}
            className="bg-white border border-editorial-border rounded px-2 py-1 outline-none text-xs"
          >
            <option value="indented">Standard Indent</option>
            <option value="block">Modern Block</option>
          </select>
          <select 
            value={options.justification}
            onChange={e => setOptions({ ...options, justification: e.target.value as any })}
            className="bg-white border border-editorial-border rounded px-2 py-1 outline-none text-xs"
          >
            <option value="left">Align Left</option>
            <option value="justify">Full Justify</option>
          </select>
        </div>

        <div className="h-4 w-[1px] bg-editorial-border"></div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-editorial-accent font-bold">Spacing</span>
          <select 
            value={options.lineSpacing}
            onChange={e => setOptions({ ...options, lineSpacing: parseFloat(e.target.value) })}
            className="bg-white border border-editorial-border rounded px-2 py-1 outline-none text-xs"
          >
            <option value="1">Single</option>
            <option value="1.5">1.5 Lines</option>
            <option value="2">Double</option>
          </select>
        </div>

        <div className="h-4 w-[1px] bg-editorial-border"></div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-editorial-accent font-bold">Flow</span>
          <button
            onClick={() => setOptions({ ...options, widowsOrphans: !options.widowsOrphans })}
            className={cn(
              "px-2 py-1 rounded border text-[10px] font-bold transition-all",
              options.widowsOrphans ? "bg-editorial-text text-white" : "bg-white text-editorial-accent"
            )}
            title="Protect against widows and orphans"
          >
            W/O
          </button>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <span className="text-[8px] uppercase text-editorial-accent">Before</span>
              <input 
                type="number" 
                value={options.spacingBefore}
                onChange={e => setOptions({ ...options, spacingBefore: parseInt(e.target.value) || 0 })}
                className="w-10 text-[10px] border border-editorial-border rounded px-1"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[8px] uppercase text-editorial-accent">After</span>
              <input 
                type="number" 
                value={options.spacingAfter}
                onChange={e => setOptions({ ...options, spacingAfter: parseInt(e.target.value) || 0 })}
                className="w-10 text-[10px] border border-editorial-border rounded px-1"
              />
            </div>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-editorial-border"></div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-editorial-accent font-bold">Num</span>
          <select 
            value={options.numberingFormat}
            onChange={e => setOptions({ ...options, numberingFormat: e.target.value as any })}
            className="text-xs bg-white border border-editorial-border rounded px-2 py-1 outline-none"
          >
            <option value="none">None</option>
            <option value="arabic">1, 2, 3</option>
            <option value="roman">I, II, III</option>
            <option value="words">One, Two</option>
          </select>
        </div>

        <div className="h-4 w-[1px] bg-editorial-border"></div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-editorial-accent font-bold">TOC</span>
          <button
            onClick={() => setOptions({ ...options, includeTOC: !options.includeTOC })}
            className={cn(
              "px-3 py-1 rounded border text-[10px] font-bold transition-all",
              options.includeTOC 
                ? "bg-editorial-text text-white border-editorial-text" 
                : "bg-white text-editorial-accent border-editorial-border hover:border-editorial-text"
            )}
          >
            {options.includeTOC ? "Included" : "None"}
          </button>
        </div>
        
        <div className="ml-auto text-[11px] text-editorial-accent font-mono uppercase tracking-tight shrink-0">
          {totalWords.toLocaleString()} Words
        </div>
      </div>

      {/* Editor Context / Info Rail */}
      <div className="px-8 py-3 bg-white/50 border-b border-editorial-border flex gap-8 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-editorial-accent uppercase">Author</span>
          <input
            type="text"
            value={options.authorName}
            onChange={e => setOptions({ ...options, authorName: e.target.value })}
            className="bg-transparent border-b border-transparent focus:border-editorial-accent transition-colors outline-none text-xs font-serif italic w-32"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-editorial-accent uppercase">Title</span>
          <input
            type="text"
            value={options.bookTitle}
            onChange={e => setOptions({ ...options, bookTitle: e.target.value })}
            className="bg-transparent border-b border-transparent focus:border-editorial-accent transition-colors outline-none text-xs font-serif font-bold w-48"
          />
        </div>
      </div>

      {/* Manuscript View */}
      <div className="flex-1 p-12 overflow-y-auto flex flex-col items-center gap-12 scroll-smooth bg-editorial-bg/30 custom-scrollbar">
        {/* Cover Page */}
        {options.coverUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-[8.5in] aspect-[8.5/11] bg-white shadow-2xl relative font-serif shrink-0 overflow-hidden group"
          >
            <img 
              src={options.coverUrl} 
              alt="Book Cover" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 flex flex-col items-center justify-between py-24 px-12 text-center text-white">
              <div className="space-y-4">
                <motion.h1 
                  layoutId="cover-title"
                  className="text-5xl font-bold uppercase tracking-[0.3em] drop-shadow-2xl"
                >
                  {options.bookTitle}
                </motion.h1>
                <div className="h-1 w-24 bg-white/40 mx-auto rounded-full" />
              </div>
              <motion.p 
                layoutId="cover-author"
                className="text-2xl font-light tracking-[0.2em] italic opacity-90"
              >
                By {options.authorName}
              </motion.p>
            </div>
            {/* Spine Highlight Effect */}
            <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
          </motion.div>
        )}

        {/* Content Warnings Page */}
        {options.includeWarningsPage && options.contentWarnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-[8.5in] bg-white shadow-2xl min-h-[1100px] relative font-serif shrink-0 p-[1in]"
          >
            <h2 className="text-center text-3xl font-bold uppercase tracking-[0.2em] mt-16 mb-24">Content Warnings</h2>
            <div className="max-w-xl mx-auto space-y-8">
              <p className="text-center text-lg italic text-editorial-accent mb-12">
                The following material is included in this manuscript for thematic and narrative purposes.
              </p>
              <ul className="grid grid-cols-1 gap-4">
                {options.contentWarnings.map((w, idx) => (
                  <li key={idx} className="flex items-center gap-4 text-xl py-4 border-b border-editorial-border font-medium">
                    <span className="h-2 w-2 bg-editorial-text rounded-full shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
            <div className="absolute top-[1in] right-[1in] text-slate-400 text-sm italic">
                {options.authorName} / {options.bookTitle}
            </div>
          </motion.div>
        )}

        {/* TOC Preview Page */}
        {options.includeTOC && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-[8.5in] bg-white shadow-2xl min-h-[1100px] relative font-serif shrink-0 p-[1in]"
          >
            <h2 className="text-center text-3xl font-bold uppercase tracking-[0.2em] mt-16 mb-24">Table of Contents</h2>
            <div className="space-y-6 max-w-2xl mx-auto">
              {chapters.map((chapter, idx) => {
                const num = formatNumberHelper(idx + 1, options.numberingFormat);
                const title = options.numberingFormat !== 'none' ? `Chapter ${num}: ${chapter.title}` : chapter.title;
                return (
                  <div key={chapter.id} className="flex items-end gap-2 text-lg">
                    <span className="shrink-0 font-medium">{title}</span>
                    <div className="flex-1 border-b border-dotted border-editorial-border mb-1.5 opacity-50"></div>
                    <span className="shrink-0 font-mono text-sm">{idx + 1}</span>
                  </div>
                );
              })}
              {chapters.length === 0 && (
                <p className="text-center italic text-editorial-accent">Add chapters to populate the Table of Contents.</p>
              )}
            </div>
            <div className="absolute top-[1in] right-[1in] flex gap-2 font-serif text-slate-400 text-sm italic">
                {options.authorName} / {options.bookTitle} / 1
            </div>
          </motion.div>
        )}

        <motion.div
          layout
          className="w-[8.5in] bg-white shadow-2xl min-h-[1100px] relative font-serif shrink-0"
          style={{
            padding: `${options.marginSize}in`,
            fontSize: `${options.fontSize}px`,
            lineHeight: options.lineSpacing,
          }}
        >
          {/* Contact Info (First Page Style) */}
          <div className="flex justify-between text-sm mb-24 font-serif text-slate-800 leading-tight">
            <div>
              <p>{options.authorName}</p>
              <p>Email: author@example.com</p>
              <p>Phone: (555) 012-3456</p>
            </div>
            <div className="text-right">
              <p>Approx. {totalWords.toLocaleString()} words</p>
            </div>
          </div>

          {/* Book Title Centered */}
          <div className="text-center mb-32">
            <h1 className="text-3xl font-bold uppercase tracking-[0.3em] mb-6">{options.bookTitle || 'Untitled'}</h1>
            <p className="text-xl">by</p>
            <p className="text-xl mt-4 font-medium">{options.authorName || 'Unnamed Author'}</p>
          </div>

          <div 
            className={cn(
              "manuscript-content",
              options.paragraphStyle === 'indented' ? "style-indented" : "style-block",
              options.justification === 'justify' ? "text-justify" : "text-left"
            )}
            style={{
              fontFamily: options.fontFamily === 'times' ? '"Times New Roman", Times, serif' : 
                          options.fontFamily === 'courier' ? '"Courier New", Courier, monospace' : '"Helvetica", Arial, sans-serif',
              ['--spacing-before' as any]: `${options.spacingBefore}pt`,
              ['--spacing-after' as any]: `${options.spacingAfter}pt`,
              widows: options.widowsOrphans ? 2 : 1,
              orphans: options.widowsOrphans ? 2 : 1,
            }}
            dangerouslySetInnerHTML={{ __html: combinedContent || '<p class="text-slate-300 italic text-center !text-indent-0">Add your first chapter to begin the journey.</p>' }} 
          />

          {/* Page Edge Shadow */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
        </motion.div>

        {/* Author's Note Page */}
        {options.includeAuthorsNote && options.authorsNote && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-[8.5in] bg-white shadow-2xl min-h-[1100px] relative font-serif shrink-0 p-[1in]"
          >
            <h2 className="text-center text-3xl font-bold uppercase tracking-[0.2em] mt-16 mb-24">Author's Note</h2>
            <div className="max-w-xl mx-auto text-lg leading-loose font-serif italic whitespace-pre-wrap text-editorial-text/80">
              {options.authorsNote}
            </div>
            <div className="mt-24 text-right">
              <p className="text-xl font-bold">{options.authorName}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick Actions Floating */}
      <div className="absolute bottom-8 right-8 flex gap-2">
        <div className="bg-white border border-editorial-border p-4 rounded-2xl shadow-xl flex gap-6 items-center">
          <div className="flex flex-col">
            <span className="text-[10px] text-editorial-accent font-bold uppercase">Submission State</span>
            <span className="text-xs font-medium text-green-600">Publisher Ready</span>
          </div>
          <button 
            onClick={onExport}
            className="h-10 w-10 bg-editorial-text text-white rounded-full flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg"
            title="Export for Publisher"
          >
            <Download size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
