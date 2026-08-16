import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Member,
  PortalSettings,
  AIAssistantChatMessage,
  AIAssistantConfig,
} from '../types';
import {
  Bot,
  Send,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  Minus,
  X,
  Lock,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { canManageAIAssistant } from '../utils/aiPermissions';
import {
  getAllocatedPagesForMember,
  getRestrictedPagesForMember,
  canAccessPage,
} from '../utils/permissions';
import { useToast } from './ToastContext';

interface AIAssistantChatbotProps {
  currentMember: Member;
  settings: PortalSettings;
  isFloating?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  onOpenTrainingHub?: () => void;
  onSelectTab?: (tab: any) => void;
}

export const AIAssistantChatbot: React.FC<AIAssistantChatbotProps> = ({
  currentMember,
  settings,
  isFloating = false,
  isOpen = true,
  onClose,
  onMinimize,
  onOpenTrainingHub,
  onSelectTab,
}) => {
  const { toastSuccess, toastInfo, toastError } = useToast();
  const isSuperAdmin = canManageAIAssistant(currentMember);

  const allocatedPages = useMemo(() => {
    return getAllocatedPagesForMember(currentMember, settings);
  }, [currentMember, settings]);

  const restrictedPages = useMemo(() => {
    return getRestrictedPagesForMember(currentMember, settings);
  }, [currentMember, settings]);

  const activePermissions = useMemo(() => {
    if (isSuperAdmin || currentMember.councilRole === 'Superadmin' || currentMember.councilRole === 'Rover Advisor') {
      return ['createSyllabus', 'assignCourses', 'monitorProgress', 'addMembers', 'manageEvents', 'manageDisciplinary', 'manageMinutes', 'manageSettings'];
    }
    return settings?.rolePermissions?.[currentMember.councilRole] || [];
  }, [currentMember, settings, isSuperAdmin]);

  const aiConfig: AIAssistantConfig = settings.aiAssistantConfig || {
    enabled: true,
    name: 'Meyvaa AI Scout Advisor',
    tagline: 'Official AI Assistant for Meyvaa Portal',
    allowAllMembers: true,
    allowedUserIds: ['m-superadmin'],
    allowedRoles: ['Superadmin'],
    systemPrompt: '',
    tone: 'Encouraging & Inspiring',
    temperature: 0.3,
    knowledgeDocs: [],
    trainingQAs: [],
  };

  const [messages, setMessages] = useState<AIAssistantChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `Greetings, **${currentMember.name}** (${currentMember.councilRole})!

I am the **${aiConfig.name || 'Meyvaa AI Scout Advisor'}**, strictly aligned with your allocated portal pages and council permissions.

**Your Allocated Pages Include:**
${allocatedPages.slice(0, 5).map(p => `- **${p.label}** (${p.description.split('.')[0]})`).join('\n')}
${allocatedPages.length > 5 ? `- *...and ${allocatedPages.length - 5} more allocated tabs.*` : ''}

How can I assist you with your scouting syllabus, activities, or portfolio today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedFollowUps: [
        'What are my allocated pages and permissions?',
        'How do I log hours for the Baden-Powell Award?',
        'Explain the 7-day referendum voting policy.',
      ],
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(!isFloating);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setInputMessage('');

    const userMessage: AIAssistantChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/assistant-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: newHistory.map((m) => ({ sender: m.sender, text: m.text })),
          memberId: currentMember.id,
          memberRole: currentMember.councilRole,
          memberName: currentMember.name,
          isSuperAdmin: Boolean(currentMember.isSuperAdmin || currentMember.councilRole === 'Superadmin'),
          aiAssistantConfig: aiConfig,
          allocatedPages: allocatedPages.map((p) => ({
            id: p.id,
            label: p.label,
            category: p.category,
            accessLevel: p.accessLevel,
            description: p.description,
          })),
          restrictedPages: restrictedPages.map((p) => ({
            id: p.id,
            label: p.label,
            requiredRoleOrPermission: p.requiredRoleOrPermission,
          })),
          activePermissions,
          portalContext: {
            activeTerm: settings.activeTerm,
            crewName: settings.crewName,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response from AI Assistant.');
      }

      const data = await response.json();

      const assistantMessage: AIAssistantChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.response || 'I have processed your request.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowUps: data.suggestedFollowUps || [],
        questionLogId: data.questionLogId,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: AIAssistantChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **AI Notice**: ${err.message || 'Unable to connect to AI Assistant. Please check your network or permissions.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateResponse = async (msgId: string, logId: string | undefined, rating: 'helpful' | 'unhelpful') => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, userRating: rating } : m))
    );

    if (logId) {
      try {
        await fetch('/api/ai/question-logs/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionLogId: logId,
            rating,
          }),
        });
      } catch (err) {
        console.warn('Feedback sync error:', err);
      }
    }

    if (rating === 'helpful') {
      toastSuccess('Thank you! Feedback recorded for AI quality control.');
    } else {
      toastInfo('Feedback recorded. Council AI training team will review.');
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    toastSuccess('Message copied to clipboard.');
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: `Greetings, **${currentMember.name}** (${currentMember.councilRole})!

I am the **${aiConfig.name || 'Meyvaa AI Scout Advisor'}**, strictly aligned with your allocated portal pages and council permissions.

**Your Allocated Pages Include:**
${allocatedPages.slice(0, 5).map(p => `- **${p.label}** (${p.description.split('.')[0]})`).join('\n')}
${allocatedPages.length > 5 ? `- *...and ${allocatedPages.length - 5} more allocated tabs.*` : ''}

How can I assist you with your scouting syllabus, activities, or portfolio today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowUps: [
          'What are my allocated pages and permissions?',
          'How do I log hours for the Baden-Powell Award?',
          'Explain the 7-day referendum voting policy.',
        ],
      },
    ]);
    toastInfo('Chat history reset.');
  };

  const handleCloseAndClear = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: `Greetings, **${currentMember.name}** (${currentMember.councilRole})!

I am the **${aiConfig.name || 'Meyvaa AI Scout Advisor'}**, strictly aligned with your allocated portal pages and council permissions.

**Your Allocated Pages Include:**
${allocatedPages.slice(0, 5).map(p => `- **${p.label}** (${p.description.split('.')[0]})`).join('\n')}
${allocatedPages.length > 5 ? `- *...and ${allocatedPages.length - 5} more allocated tabs.*` : ''}

How can I assist you with your scouting syllabus, activities, or portfolio today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowUps: [
          'What are my allocated pages and permissions?',
          'How do I log hours for the Baden-Powell Award?',
          'Explain the 7-day referendum voting policy.',
        ],
      },
    ]);
    toastInfo('Chat closed and session history cleared.');
    if (onClose) {
      onClose();
    }
  };

  const handleMinimizeToBubble = () => {
    if (onMinimize) {
      onMinimize();
    } else if (onClose) {
      onClose();
    }
  };

  const handleNavigateToTab = (tabId: string) => {
    if (!canAccessPage(currentMember, tabId, settings)) {
      toastError(`Access Denied: As a ${currentMember.councilRole}, you are not allocated access to this page.`);
      return;
    }
    if (onSelectTab) {
      onSelectTab(tabId);
      toastInfo(`Navigating to ${tabId}...`);
      if (isFloating && onClose) {
        onClose();
      }
    }
  };

  // Render formatted markdown-like text with interactive page navigation buttons
  const renderMessageContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Header 3
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-sm text-slate-900 mt-2 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      // Header 2 or 1
      if (line.startsWith('## ') || line.startsWith('# ')) {
        return (
          <h3 key={idx} className="font-bold text-base text-slate-900 mt-2.5 mb-1.5 border-b border-slate-200 pb-1">
            {line.replace(/^#+ /, '')}
          </h3>
        );
      }
      // Bullet point
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <div key={idx} className="flex items-start gap-2 ml-2 my-0.5">
            <span className="text-[#800000] font-bold text-xs mt-0.5">•</span>
            <span className="flex-1">{parseInlineFormatting(line.trim().replace(/^[-*] /, ''))}</span>
          </div>
        );
      }
      // Numbered list
      if (/^\d+\.\s/.test(line.trim())) {
        const num = line.trim().match(/^\d+\./)?.[0] || '1.';
        const content = line.trim().replace(/^\d+\.\s*/, '');
        return (
          <div key={idx} className="flex items-start gap-2 ml-2 my-0.5">
            <span className="text-[#800000] font-bold text-xs">{num}</span>
            <span className="flex-1">{parseInlineFormatting(content)}</span>
          </div>
        );
      }
      // Blank line
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      // Standard paragraph
      return (
        <p key={idx} className="my-1">
          {parseInlineFormatting(line)}
        </p>
      );
    });
  };

  // Helper for bold **text**, `code`, and interactive [Link](tab:id) buttons
  const parseInlineFormatting = (str: string) => {
    // Regex matches [label](tab:tabId), **bold**, or `code`
    const linkRegex = /\[(.*?)\]\(tab:([a-zA-Z0-9_-]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(str)) !== null) {
      const preceding = str.substring(lastIndex, match.index);
      if (preceding) {
        parts.push(...parseBoldAndCode(preceding, parts.length));
      }

      const label = match[1];
      const tabId = match[2];
      const isAllowed = canAccessPage(currentMember, tabId, settings);

      parts.push(
        <button
          key={`tab-btn-${match.index}`}
          type="button"
          onClick={() => handleNavigateToTab(tabId)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition mx-1 cursor-pointer ${
            isAllowed
              ? 'bg-[#800000] text-white hover:bg-[#990000] shadow-2xs'
              : 'bg-slate-200 text-slate-500 cursor-not-allowed line-through'
          }`}
          title={isAllowed ? `Navigate to ${label}` : 'Access Restricted for your role'}
        >
          {isAllowed ? <ArrowRight className="w-2.5 h-2.5 text-white" /> : <Lock className="w-2.5 h-2.5 text-slate-500" />}
          <span>{label}</span>
        </button>
      );

      lastIndex = linkRegex.lastIndex;
    }

    const remaining = str.substring(lastIndex);
    if (remaining) {
      parts.push(...parseBoldAndCode(remaining, parts.length));
    }

    return parts;
  };

  const parseBoldAndCode = (str: string, baseKey: number) => {
    const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={`${baseKey}-${i}`} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={`${baseKey}-${i}`} className="px-1.5 py-0.5 bg-slate-100 text-[#800000] font-mono text-[11px] rounded-md font-semibold">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  if (isFloating && !isOpen) {
    return null;
  }

  return (
    <div
      id="ai-assistant-chatbot-panel"
      className={`${
        isFloating
          ? 'fixed inset-0 z-50 w-full h-full bg-white flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200'
          : 'w-full rounded-2xl border border-[#FFD0D0] bg-white shadow-xs flex flex-col min-h-[600px] overflow-hidden'
      }`}
    >
      {/* Clean, Elegant Header */}
      <div className="bg-[#800000] text-white px-4 py-3.5 sm:px-6 flex items-center justify-between shadow-xs select-none shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center backdrop-blur-xs shadow-inner shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-white tracking-tight leading-tight">
                {aiConfig.name || 'Meyvaa AI Scout Advisor'}
              </h3>
              {isFloating && (
                <span className="hidden sm:inline-block text-[10px] bg-white/20 text-white font-semibold px-2 py-0.5 rounded-full backdrop-blur-xs">
                  Full Screen
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] sm:text-xs text-white/80 font-medium">
                Active Assistant • {currentMember.councilRole} Scope
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleClearChat}
            className="p-2 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Clear chat history"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden md:inline">Clear</span>
          </button>

          {isFloating && (
            <button
              type="button"
              onClick={handleMinimizeToBubble}
              className="p-2 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Minimize to bubble (keeps active chat)"
            >
              <Minus className="w-4 h-4" />
              <span className="hidden md:inline">Minimize</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={handleCloseAndClear}
              className="p-2 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Close chat & clear history"
            >
              <X className="w-4 h-4" />
              <span className="hidden md:inline">Close</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Body */}
      <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col">
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-[#800000] text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div className={`space-y-1.5 max-w-[88%] sm:max-w-[80%]`}>
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#800000] text-white shadow-xs rounded-tr-xs'
                      : msg.isError
                      ? 'bg-rose-50 text-rose-900 border border-rose-200 shadow-2xs rounded-tl-xs'
                      : 'bg-white text-slate-800 border border-[#FFD0D0] shadow-xs rounded-tl-xs'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <div className="whitespace-pre-wrap font-medium">{msg.text}</div>
                  ) : (
                    <div className="space-y-1">{renderMessageContent(msg.text)}</div>
                  )}
                </div>

                {/* Message Footer: Timestamp, Quality Feedback & Copy button */}
                <div
                  className={`flex items-center gap-2 px-1 text-[10px] text-slate-400 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-between'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'assistant' && !msg.isError && (
                      <div className="flex items-center gap-1.5 ml-1 border-l border-slate-200 pl-2">
                        <button
                          type="button"
                          onClick={() => handleRateResponse(msg.id, msg.questionLogId, 'helpful')}
                          className={`p-1 rounded-md transition cursor-pointer flex items-center gap-0.5 ${
                            msg.userRating === 'helpful'
                              ? 'bg-[#FFF0F0] text-[#800000] font-bold border border-[#FF9999]'
                              : 'hover:bg-[#FFF0F0] text-slate-500'
                          }`}
                          title="Helpful response (Quality feedback)"
                        >
                          <ThumbsUp className="w-3 h-3 text-[#800000]" />
                          {msg.userRating === 'helpful' && <span className="text-[9px] text-[#800000]">Helpful</span>}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRateResponse(msg.id, msg.questionLogId, 'unhelpful')}
                          className={`p-1 rounded-md transition cursor-pointer flex items-center gap-0.5 ${
                            msg.userRating === 'unhelpful'
                              ? 'bg-[#FFF0F0] text-[#800000] font-bold border border-[#FF9999]'
                              : 'hover:bg-[#FFF0F0] text-slate-500'
                          }`}
                          title="Needs improvement (Quality feedback)"
                        >
                          <ThumbsDown className="w-3 h-3 text-[#800000]" />
                          {msg.userRating === 'unhelpful' && <span className="text-[9px] text-[#800000]">Flagged</span>}
                        </button>

                        {isSuperAdmin && onOpenTrainingHub && (
                          <button
                            type="button"
                            onClick={onOpenTrainingHub}
                            className="text-[9px] text-[#800000] hover:underline font-semibold ml-1 cursor-pointer"
                            title="Open in Superadmin Training & Quality Control Hub"
                          >
                            QC Review →
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {msg.sender === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => handleCopyText(msg.id, msg.text)}
                      className="hover:text-slate-700 flex items-center gap-1 transition cursor-pointer"
                      title="Copy message"
                    >
                      {copiedMsgId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-[#800000]" />
                          <span className="text-[#800000] font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-[#800000]" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Suggested Follow-Up Chips */}
                {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && !isLoading && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.suggestedFollowUps.map((followUp, fIdx) => (
                      <button
                        key={fIdx}
                        type="button"
                        onClick={() => handleSendMessage(followUp)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-[#FFF0F0] text-[#800000] border border-[#FFD0D0] hover:bg-[#FFE5E5] transition font-medium text-left cursor-pointer"
                      >
                        → {followUp}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <img
                  src={currentMember.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border border-[#FFD0D0] shrink-0 mt-0.5"
                />
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#800000] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-[#FFD0D0] p-3.5 rounded-2xl rounded-tl-xs shadow-xs text-xs text-slate-600 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#800000]" />
                <span>Thinking within your allocated scouting scope...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form Footer */}
      <div className="p-3 sm:p-4 bg-white border-t border-[#FFD0D0] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-3"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Ask within your allocated pages (${currentMember.councilRole})...`}
            className="flex-1 px-4 py-3 bg-[#FFF0F0] border border-[#FFD0D0] rounded-xl text-xs sm:text-sm text-black placeholder:text-slate-500 font-medium focus:outline-hidden focus:ring-1 focus:ring-[#800000]"
          />

          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="px-4 py-3 rounded-xl bg-[#800000] text-white hover:bg-[#990000] transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer flex items-center gap-1.5 font-bold text-xs sm:text-sm"
            title="Send message"
          >
            <Send className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

