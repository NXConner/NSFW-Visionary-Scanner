// Glossary & FAQ Panel with AI Q&A
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Book, HelpCircle, MessageSquare, ThumbsUp, ThumbsDown, ChevronDown, ChevronRight, Send, Trash2, Sparkles } from 'lucide-react';
import { getGlossaryManager, GlossaryTerm, FAQItem, AIQuestion, GlossarySearchResult } from '@/lib/learning/GlossaryManager';
import { cn } from '@/lib/utils';

interface GlossaryPanelProps {
  className?: string;
}

type TabType = 'glossary' | 'faq' | 'ask';

export const GlossaryPanel: React.FC<GlossaryPanelProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<TabType>('glossary');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GlossarySearchResult[]>([]);
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [aiHistory, setAiHistory] = useState<AIQuestion[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [aiQuestion, setAiQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const manager = getGlossaryManager();

  useEffect(() => {
    setTerms(manager.getTerms());
    setFaqs(manager.getFAQs());
    setAiHistory(manager.getAIHistory());
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      setSearchResults(manager.search(searchQuery));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedItems(newExpanded);
  };

  const handleAskQuestion = async () => {
    if (!aiQuestion.trim() || isAsking) return;
    setIsAsking(true);
    try {
      await manager.askQuestion(aiQuestion);
      setAiHistory(manager.getAIHistory());
      setAiQuestion('');
    } finally {
      setIsAsking(false);
    }
  };

  const markHelpful = (questionId: string, helpful: boolean) => {
    manager.markAIAnswerHelpful(questionId, helpful);
    setAiHistory(manager.getAIHistory());
  };

  const clearHistory = () => {
    manager.clearAIHistory();
    setAiHistory([]);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      anatomy: 'text-pink-400 bg-pink-500/20',
      measurement: 'text-blue-400 bg-blue-500/20',
      technology: 'text-purple-400 bg-purple-500/20',
      medical: 'text-green-400 bg-green-500/20',
      general: 'text-gray-400 bg-gray-500/20',
      usage: 'text-cyan-400 bg-cyan-500/20',
      troubleshooting: 'text-amber-400 bg-amber-500/20',
      features: 'text-indigo-400 bg-indigo-500/20',
      privacy: 'text-red-400 bg-red-500/20'
    };
    return colors[category] || 'text-gray-400 bg-gray-500/20';
  };

  return (
    <div className={cn('p-4 space-y-4', className)}>
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800/50 p-1 rounded-lg">
        {[
          { id: 'glossary' as TabType, label: 'Glossary', icon: Book },
          { id: 'faq' as TabType, label: 'FAQ', icon: HelpCircle },
          { id: 'ask' as TabType, label: 'Ask AI', icon: Sparkles }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all',
              activeTab === tab.id 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search terms, FAQs, or ask a question..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 max-h-60 overflow-y-auto">
          {searchResults.map(result => (
            <div
              key={result.type === 'term' ? (result.item as GlossaryTerm).id : (result.item as FAQItem).id}
              className="p-3 border-b border-gray-700 last:border-0 hover:bg-gray-700/50 cursor-pointer"
              onClick={() => {
                setSearchQuery('');
                setActiveTab(result.type === 'term' ? 'glossary' : 'faq');
                toggleExpand(result.type === 'term' ? (result.item as GlossaryTerm).id : (result.item as FAQItem).id);
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs px-1.5 py-0.5 bg-gray-600 rounded">
                  {result.type === 'term' ? 'Term' : 'FAQ'}
                </span>
                <span className="font-medium text-white">
                  {result.type === 'term' ? (result.item as GlossaryTerm).term : (result.item as FAQItem).question}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'glossary' && (
          <motion.div
            key="glossary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {terms.map(term => (
              <div
                key={term.id}
                className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => toggleExpand(term.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs px-2 py-0.5 rounded', getCategoryColor(term.category))}>
                      {term.category}
                    </span>
                    <span className="font-medium text-white">{term.term}</span>
                  </div>
                  {expandedItems.has(term.id) ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                <AnimatePresence>
                  {expandedItems.has(term.id) && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 pt-0 border-t border-gray-700">
                        <p className="text-gray-300 text-sm">{term.definition}</p>
                        {term.examples && term.examples.length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            <strong>Example:</strong> {term.examples[0]}
                          </div>
                        )}
                        {term.relatedTerms && term.relatedTerms.length > 0 && (
                          <div className="mt-2 flex items-center gap-1 flex-wrap">
                            <span className="text-xs text-gray-500">Related:</span>
                            {term.relatedTerms.map(rt => (
                              <span key={rt} className="text-xs px-1.5 py-0.5 bg-gray-700 rounded">{rt}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'faq' && (
          <motion.div
            key="faq"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {faqs.map(faq => (
              <div
                key={faq.id}
                className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => toggleExpand(faq.id)}
                  className="w-full flex items-start justify-between p-3 hover:bg-gray-700/50 transition-colors text-left"
                >
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('text-xs px-2 py-0.5 rounded', getCategoryColor(faq.category))}>
                        {faq.category}
                      </span>
                    </div>
                    <span className="font-medium text-white">{faq.question}</span>
                  </div>
                  {expandedItems.has(faq.id) ? (
                    <ChevronDown className="w-4 h-4 text-gray-400 mt-1" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
                  )}
                </button>
                <AnimatePresence>
                  {expandedItems.has(faq.id) && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 pt-0 border-t border-gray-700">
                        <p className="text-gray-300 text-sm whitespace-pre-line">{faq.answer}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex gap-1 flex-wrap">
                            {faq.tags.map(tag => (
                              <span key={tag} className="text-xs px-1.5 py-0.5 bg-gray-700 rounded">{tag}</span>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <button 
                              onClick={(e) => { e.stopPropagation(); manager.submitFeedback(faq.id, true); }}
                              className="flex items-center gap-1 hover:text-green-400"
                            >
                              <ThumbsUp className="w-3 h-3" /> {faq.helpful}
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); manager.submitFeedback(faq.id, false); }}
                              className="flex items-center gap-1 hover:text-red-400"
                            >
                              <ThumbsDown className="w-3 h-3" /> {faq.notHelpful}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'ask' && (
          <motion.div
            key="ask"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Ask Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask a question about the app..."
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                className="flex-1 px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
              />
              <button
                onClick={handleAskQuestion}
                disabled={!aiQuestion.trim() || isAsking}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAsking ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Sparkles className="w-5 h-5" /></motion.div> : <Send className="w-5 h-5" />}
              </button>
            </div>

            {/* History Header */}
            {aiHistory.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Conversation History</span>
                <button onClick={clearHistory} className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              </div>
            )}

            {/* AI History */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {aiHistory.map(q => (
                <div key={q.id} className="bg-gray-800/50 rounded-lg border border-gray-700 p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-blue-400 mt-0.5" />
                    <p className="text-white font-medium">{q.question}</p>
                  </div>
                  <div className="pl-6">
                    <p className="text-gray-300 text-sm whitespace-pre-line">{q.answer}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {new Date(q.timestamp).toLocaleString()}
                      </span>
                      {q.helpful === undefined && (
                        <>
                          <button 
                            onClick={() => markHelpful(q.id, true)}
                            className="text-xs text-gray-500 hover:text-green-400"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => markHelpful(q.id, false)}
                            className="text-xs text-gray-500 hover:text-red-400"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </>
                      )}
                      {q.helpful !== undefined && (
                        <span className={cn('text-xs', q.helpful ? 'text-green-400' : 'text-red-400')}>
                          {q.helpful ? 'Helpful' : 'Not helpful'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {aiHistory.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Ask a question to get started</p>
                <p className="text-xs mt-1">The AI will search through the glossary and FAQ to answer</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlossaryPanel;
