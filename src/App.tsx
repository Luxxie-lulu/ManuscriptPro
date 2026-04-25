import React, { useState } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { BookOpen, HelpCircle, Save, CheckCircle2, AlertCircle, Sparkles, History, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FileUploader } from './components/FileUploader';
import { ChapterItem } from './components/ChapterItem';
import { ManuscriptPreview } from './components/ManuscriptPreview';
import { AISuggestionPanel } from './components/AISuggestionPanel';
import { parseFile } from './lib/fileParser';
import { generateManuscriptPDF, ManuscriptOptions } from './lib/pdfGenerator';
import { generateBookCover, generateAuthorsNoteDraft, scanContentWarnings, getWritingSuggestions, AISuggestion } from './services/geminiService';
import { cn } from './lib/utils';

interface Chapter {
  id: string;
  title: string;
  content: string;
}

interface ManuscriptVersion {
  id: string;
  name: string;
  timestamp: number;
  chapters: Chapter[];
  options: ManuscriptOptions;
}

export default function App() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [versions, setVersions] = useState<ManuscriptVersion[]>([]);
  const [activeTab, setActiveTab] = useState<'chapters' | 'history' | 'ai'>('chapters');
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isNoteLoading, setIsNoteLoading] = useState(false);
  const [isWarningLoading, setIsWarningLoading] = useState(false);
  const [isCoverLoading, setIsCoverLoading] = useState(false);
  const [generatedCovers, setGeneratedCovers] = useState<string[]>([]);
  const [coverPrompt, setCoverPrompt] = useState('');
  
  const [options, setOptions] = useState<ManuscriptOptions>({
    authorName: 'Your Name',
    bookTitle: 'My Great Novel',
    fontSize: 12,
    lineSpacing: 2,
    marginSize: 1,
    fontFamily: 'times',
    paragraphStyle: 'indented',
    justification: 'left',
    includeTOC: false,
    widowsOrphans: true,
    spacingBefore: 0,
    spacingAfter: 0,
    numberingFormat: 'arabic',
    contentWarnings: [],
    authorsNote: '',
    includeWarningsPage: false,
    includeAuthorsNote: false,
    coverUrl: undefined,
  });

  const [autoSaveMinutes, setAutoSaveMinutes] = useState(5);

  React.useEffect(() => {
    if (autoSaveMinutes <= 0 || chapters.length === 0) return;
    
    const timer = setInterval(() => {
      saveVersion(`Auto-Save (${new Date().toLocaleTimeString()})`);
    }, autoSaveMinutes * 60 * 1000);

    return () => clearInterval(timer);
  }, [autoSaveMinutes, chapters, options]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const saveVersion = (name: string = `Auto-Save ${new Date().toLocaleTimeString()}`) => {
    const newVersion: ManuscriptVersion = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      timestamp: Date.now(),
      chapters: JSON.parse(JSON.stringify(chapters)),
      options: { ...options }
    };
    setVersions(prev => [newVersion, ...prev]);
    setSuccess(`Version "${name}" saved.`);
    setTimeout(() => setSuccess(null), 2000);
  };

  const revertToVersion = (version: ManuscriptVersion) => {
    setChapters(version.chapters);
    setOptions(version.options);
    setSuccess(`Reverted to "${version.name}".`);
    setTimeout(() => setSuccess(null), 2000);
  };

  const scanForAiSuggestions = async () => {
    const chapter = chapters.find(c => c.id === selectedChapterId);
    if (!chapter) {
      setError("Select a chapter to scan.");
      return;
    }
    setIsAiLoading(true);
    setAiSuggestions([]);
    try {
      const context = `Title: ${options.bookTitle}. This is chapter "${chapter.title}".`;
      const suggestions = await getWritingSuggestions(chapter.content, context);
      setAiSuggestions(suggestions);
    } catch (err) {
      setError("AI analysis failed.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const acceptAiSuggestion = (suggestion: AISuggestion) => {
    setChapters(prev => prev.map(c => {
      if (c.id === selectedChapterId) {
        return {
          ...c,
          content: c.content.replace(suggestion.originalText, suggestion.suggestedText)
        };
      }
      return c;
    }));
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };
  
  const scanWarnings = async () => {
    if (chapters.length === 0) return;
    setIsWarningLoading(true);
    try {
      const warnings = await scanContentWarnings(chapters);
      setOptions(prev => ({ ...prev, contentWarnings: warnings, includeWarningsPage: true }));
      setSuccess("Content warnings scanned and added to manuscript.");
    } catch (err) {
      setError("Warning scan failed.");
    } finally {
      setIsWarningLoading(false);
    }
  };

  const generateNote = async () => {
    setIsNoteLoading(true);
    try {
      const summary = chapters.map(c => c.title).join(", ");
      const note = await generateAuthorsNoteDraft(options.authorName, options.bookTitle, summary);
      setOptions(prev => ({ ...prev, authorsNote: note, includeAuthorsNote: true }));
      setSuccess("Author's note generated.");
    } catch (err) {
      setError("Author note generation failed.");
    } finally {
      setIsNoteLoading(false);
    }
  };

  const handleGenerateCover = async () => {
    if (!options.bookTitle) return;
    setIsCoverLoading(true);
    try {
      const genre = chapters.length > 0 ? "Fiction" : "Unknown"; // Dynamic genre detection could be added
      const urls = await generateBookCover(options.bookTitle, options.authorName, genre, coverPrompt);
      setGeneratedCovers(urls);
      setSuccess("Book covers generated!");
    } catch (err) {
      setError("Cover generation failed.");
    } finally {
      setIsCoverLoading(false);
    }
  };

  const handleFilesAdded = async (files: File[]) => {
    setIsProcessing(true);
    setError(null);
    try {
      const newChapters: Chapter[] = [];
      for (const file of files) {
        const content = await parseFile(file);
        newChapters.push({
          id: Math.random().toString(36).substr(2, 9),
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          content,
        });
      }
      setChapters(prev => [...prev, ...newChapters]);
      setSuccess(`Successfully added ${files.length} chapters.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process files');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(chapters);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setChapters(items);
  };

  const deleteChapter = (id: string) => {
    setChapters(prev => prev.filter(c => c.id !== id));
  };

  const exportPDF = async () => {
    if (chapters.length === 0) {
      setError('Add at least one chapter before exporting.');
      return;
    }
    try {
      await generateManuscriptPDF(chapters, options);
      setSuccess('Manuscript exported successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to export PDF.');
    }
  };

  return (
    <div className="flex h-screen bg-editorial-bg text-editorial-text font-sans selection:bg-editorial-hover selection:text-editorial-text overflow-hidden">
      {/* Sidebar - Organization */}
      <aside className="w-80 border-r border-editorial-border flex flex-col bg-editorial-sidebar overflow-hidden shrink-0">
        <header className="h-16 px-6 border-b border-editorial-border flex items-center gap-4 bg-white shrink-0">
          <div className="w-8 h-8 bg-editorial-text rounded-sm flex items-center justify-center text-white font-serif text-xl italic">
            M
          </div>
          <div>
            <h1 className="text-lg font-medium tracking-tight">
              Manuscript<span className="text-editorial-accent font-light italic">Pro</span>
            </h1>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto p-6 space-y-8 scroll-smooth custom-scrollbar">
          {/* Navigation Tabs */}
          <div className="flex border-b border-editorial-border gap-4 pb-2">
            {[
              { id: 'chapters', label: 'Draft', icon: Layers },
              { id: 'ai', label: 'Insights', icon: Sparkles },
              { id: 'history', label: 'History', icon: History }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all",
                  activeTab === tab.id ? "text-editorial-text" : "text-editorial-accent hover:text-editorial-text"
                )}
              >
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'chapters' && (
              <motion.div 
                key="chapters"
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 10 }}
                className="space-y-8"
              >
                {/* Notifications */}
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: -5 }}
                      className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg flex items-start gap-3 shadow-sm"
                    >
                      <AlertCircle className="shrink-0" size={16} />
                      <p className="text-xs font-medium">{error}</p>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: -5 }}
                      className="bg-green-50 border border-green-100 text-green-600 p-4 rounded-lg flex items-start gap-3 shadow-sm"
                    >
                      <CheckCircle2 className="shrink-0" size={16} />
                      <p className="text-xs font-medium">{success}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Draggable Chapters */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-editorial-accent">Chapter Order</h3>
                    <HelpCircle size={14} className="text-editorial-accent cursor-help hover:text-editorial-text transition-colors" title="Drag to reorder chapters" />
                  </div>

                  {chapters.length === 0 ? (
                    <div className="text-center py-12 px-6 border-2 border-dotted border-editorial-border rounded-xl bg-white/50">
                      <p className="text-sm text-editorial-accent italic leading-relaxed">Chapters you upload will appear here for organization.</p>
                    </div>
                  ) : (
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="chapters-list">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 min-h-[50px]">
                            {chapters.map((chapter, index) => (
                              <div 
                                key={chapter.id}
                                onClick={() => setSelectedChapterId(chapter.id)}
                                className={cn(
                                  "rounded-lg transition-all",
                                  selectedChapterId === chapter.id ? "ring-2 ring-editorial-text ring-offset-2" : ""
                                )}
                              >
                                <ChapterItem
                                  id={chapter.id}
                                  index={index}
                                  title={chapter.title}
                                  onDelete={deleteChapter}
                                />
                              </div>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  )}
                </section>

                <section className="pt-4 border-t border-editorial-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-editorial-accent">Quick Tools</h3>
                    <button 
                      onClick={() => saveVersion()} 
                      className="flex items-center gap-1.5 text-[10px] font-bold text-editorial-text uppercase hover:underline"
                    >
                      <Save size={12} />
                      Snapshot
                    </button>
                  </div>
                  <FileUploader onFilesAdded={handleFilesAdded} isProcessing={isProcessing} />
                </section>
              </motion.div>
            )}

            {activeTab === 'ai' && (
              <motion.div 
                key="ai"
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 10 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-editorial-accent flex items-center gap-2">
                    <Layers size={14} className="text-purple-500" />
                    Book Cover
                  </h3>
                  <div className="p-4 bg-editorial-sidebar border border-editorial-border rounded-xl space-y-4">
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-editorial-accent uppercase italic">Cover Style / Mood</span>
                      <input 
                        type="text" 
                        value={coverPrompt}
                        onChange={(e) => setCoverPrompt(e.target.value)}
                        placeholder="e.g. Noir, Cinematic, Minimalist Watercolor"
                        className="w-full bg-white border border-editorial-border rounded-lg px-3 py-2 text-xs outline-none focus:border-editorial-text transition-colors"
                      />
                      <button 
                        onClick={handleGenerateCover}
                        disabled={isCoverLoading}
                        className="w-full bg-editorial-text text-white py-2 rounded-lg text-[10px] uppercase font-bold tracking-widest hover:bg-black transition-colors disabled:opacity-50"
                      >
                        {isCoverLoading ? 'Crafting Cover...' : 'Generate Cover Options'}
                      </button>
                    </div>

                    {generatedCovers.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {generatedCovers.map((url, idx) => (
                          <div 
                            key={idx} 
                            className={cn(
                              "relative aspect-[3/4] rounded-lg overflow-hidden border-2 cursor-pointer transition-all",
                              options.coverUrl === url ? "border-editorial-text shadow-lg" : "border-transparent opacity-70 hover:opacity-100"
                            )}
                            onClick={() => setOptions(prev => ({ ...prev, coverUrl: url }))}
                          >
                            <img src={url} alt={`Cover option ${idx + 1}`} className="w-full h-full object-cover" />
                            {options.coverUrl === url && (
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <CheckCircle2 className="text-white" size={24} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-editorial-border" />

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-editorial-accent flex items-center gap-2">
                    <AlertCircle size={14} className="text-orange-500" />
                    Sensitive Content
                  </h3>
                  <div className="p-4 bg-editorial-sidebar border border-editorial-border rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-editorial-accent uppercase italic">Compliance Check</span>
                      <button 
                        onClick={scanWarnings}
                        disabled={isWarningLoading || chapters.length === 0}
                        className="text-[10px] font-bold text-editorial-text uppercase hover:underline disabled:opacity-50"
                      >
                        {isWarningLoading ? 'Scanning...' : 'Analyze Manuscript'}
                      </button>
                    </div>
                    {options.contentWarnings.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {options.contentWarnings.map((w, idx) => (
                          <span key={idx} className="bg-white border border-editorial-border px-2 py-1 rounded text-[10px] text-editorial-text">
                            {w}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="show-warnings" 
                        checked={options.includeWarningsPage}
                        onChange={(e) => setOptions(prev => ({ ...prev, includeWarningsPage: e.target.checked }))}
                        className="rounded border-editorial-border text-editorial-text accent-editorial-text h-3 w-3"
                      />
                      <label htmlFor="show-warnings" className="text-[10px] font-bold text-editorial-accent uppercase cursor-pointer">
                        Include Warnings Page
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-editorial-accent flex items-center gap-2">
                    <BookOpen size={14} className="text-blue-500" />
                    Front/Back Matter
                  </h3>
                  <div className="p-4 bg-editorial-sidebar border border-editorial-border rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-editorial-accent uppercase italic">Author's Note</span>
                      <button 
                        onClick={generateNote}
                        disabled={isNoteLoading}
                        className="text-[10px] font-bold text-editorial-text uppercase hover:underline disabled:opacity-50"
                      >
                        {isNoteLoading ? 'Drafting...' : 'Generate with AI'}
                      </button>
                    </div>
                    <textarea 
                      value={options.authorsNote}
                      onChange={(e) => setOptions(prev => ({ ...prev, authorsNote: e.target.value }))}
                      placeholder="Write your author's note here..."
                      className="w-full h-32 bg-white border border-editorial-border rounded-lg p-3 text-xs font-serif leading-relaxed italic outline-none focus:border-editorial-text transition-colors resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="show-note" 
                        checked={options.includeAuthorsNote}
                        onChange={(e) => setOptions(prev => ({ ...prev, includeAuthorsNote: e.target.checked }))}
                        className="rounded border-editorial-border text-editorial-text accent-editorial-text h-3 w-3"
                      />
                      <label htmlFor="show-note" className="text-[10px] font-bold text-editorial-accent uppercase cursor-pointer">
                        Include in Export
                      </label>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-editorial-border" />

                <AISuggestionPanel
                  suggestions={aiSuggestions}
                  loading={isAiLoading}
                  onAccept={acceptAiSuggestion}
                  onReject={(id) => setAiSuggestions(prev => prev.filter(s => s.id !== id))}
                  onRefresh={scanForAiSuggestions}
                />
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#A49B8B]">Revision History</h3>
                
                <div className="p-4 bg-editorial-sidebar rounded-xl border border-editorial-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-editorial-accent">Auto-Save Interal</span>
                    <span className="text-xs font-serif italic text-editorial-text">{autoSaveMinutes} min</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="60" 
                    value={autoSaveMinutes}
                    onChange={(e) => setAutoSaveMinutes(parseInt(e.target.value))}
                    className="w-full accent-editorial-text h-1 bg-editorial-border rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-[9px] text-editorial-accent leading-tight italic">
                    Snapshots are captured every {autoSaveMinutes} minutes. Set to 1 for high-frequency backup.
                  </p>
                </div>

                {versions.length === 0 ? (
                  <div className="text-center py-12 text-editorial-accent italic border border-dashed border-editorial-border rounded-xl">
                    No snapshots captured yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {versions.map(v => (
                      <div key={v.id} className="p-4 bg-white border border-editorial-border rounded-xl shadow-sm space-y-2 hover:border-editorial-text transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-editorial-text truncate max-w-[150px]">{v.name}</span>
                          <span className="text-[10px] text-editorial-accent font-mono">{new Date(v.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-editorial-accent">{v.chapters.length} Chapters</span>
                          <button 
                            onClick={() => revertToVersion(v)}
                            className="bg-editorial-sidebar px-3 py-1 rounded-full text-[10px] font-bold text-editorial-text border border-editorial-border hover:bg-white"
                          >
                            Revert
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status Bar */}
        <footer className="h-10 px-6 bg-white border-t border-editorial-border flex items-center justify-between text-[10px] uppercase tracking-widest font-bold text-editorial-accent shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            Publisher Status: Ready
          </div>
          <span>v1.0.4</span>
        </footer>
      </aside>

      {/* Main Content - Preview */}
      <main className="flex-grow flex flex-col bg-[#F5F2ED]">
        <ManuscriptPreview 
          chapters={chapters} 
          options={options} 
          setOptions={setOptions}
          onExport={exportPDF}
        />
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-editorial-border);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--color-editorial-accent);
        }
        .manuscript-content h2 {
          font-family: var(--font-serif);
          font-size: 1.5em;
          font-weight: 500;
          text-align: center;
          margin-top: 3em;
          margin-bottom: 2em;
          text-transform: uppercase;
          letter-spacing: 0.3em;
          color: var(--color-editorial-text);
          text-indent: 0 !important;
        }
        .manuscript-content p {
          margin: 0;
          line-height: inherit;
        }
        .style-indented p {
          text-indent: 0.5in;
        }
        .style-indented p:first-of-type {
          text-indent: 0 !important;
        }
        .style-block p {
          margin-bottom: 1em;
          text-indent: 0 !important;
        }
      `}</style>
    </div>
  );
}
