import { useState, useEffect, useRef } from 'react';
import type { ChatWidgetProps, PreChatFormData } from '../types/chat';
import PreChatForm from './PreChatForm';
import { portalApi } from '../services/portalApi';
import type { ChatMessage } from '../services/portalApi';

type ChatPhase = 'form' | 'bot' | 'connecting' | 'agent' | 'ended' | 'error';

interface UIMessage {
  id: string;
  role: 'user' | 'bot' | 'agent' | 'system';
  text: string;
  time: string;
}

const POLL_INTERVAL_MS = 2000;

const ChatWidget = (_props: ChatWidgetProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('kiro:open-chat', handler);
    return () => window.removeEventListener('kiro:open-chat', handler);
  }, []);

  const handleClose = () => setOpen(false);

  return (
    <>
      {!open && (
        <button
          aria-label="Open chat"
          onClick={() => setOpen(true)}
          className="fixed bottom-7 right-7 z-[900] w-14 h-14 rounded-2xl bg-brand-gradient border-none text-white text-[22px] flex items-center justify-center shadow-btn-lg transition-all hover:scale-105 hover:-translate-y-0.5 active:scale-100"
        >
          💬
        </button>
      )}

      {open && (
        <div
          className="fixed bottom-7 right-7 z-[901] w-[370px] bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.15)] border border-border overflow-hidden flex flex-col"
          style={{ height: '560px' }}
        >
          <WidgetHeader onClose={handleClose} />
          <ChatFlow onClose={handleClose} />
        </div>
      )}
    </>
  );
};

const WidgetHeader = ({ onClose }: { onClose: () => void }) => (
  <div className="bg-brand-gradient px-4 py-3.5 flex items-center gap-3 flex-shrink-0">
    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-[15px] flex-shrink-0">
      K
    </div>
    <div>
      <div className="text-white font-bold text-[14px] leading-tight">Kira AI Assistant</div>
      <div className="text-blue-200 text-[11px] flex items-center gap-1.5 font-medium mt-0.5">
        <span className="w-1.5 h-1.5 rounded-full inline-block bg-green-400 animate-pulse" />
        Online · AI-powered support
      </div>
    </div>
    <button
      onClick={onClose}
      aria-label="Close"
      className="ml-auto w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 border-none text-white flex items-center justify-center text-[13px] transition-colors"
    >
      ✕
    </button>
  </div>
);

const ChatFlow = ({ onClose }: { onClose: () => void }) => {
  const [phase, setPhase] = useState<ChatPhase>('form');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PreChatFormData | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  
  const seenIdsRef = useRef<Set<string>>(new Set());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const appendMessage = (msg: UIMessage) => {
    setMessages((prev) => [...prev, msg]);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, []);

  const startPolling = (sid: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const data = await portalApi.getMessages(sid);
        const newMessages: UIMessage[] = [];
        
        for (const m of data.messages) {
          if (!seenIdsRef.current.has(m.Id) && m.Type === 'MESSAGE') {
            seenIdsRef.current.add(m.Id);
            newMessages.push(convertMessage(m));
            
            // Detect agent joining
            if (m.ParticipantRole === 'AGENT') {
              setPhase('agent');
            }
          }
        }
        
        if (newMessages.length > 0) {
          setMessages((prev) => [...prev, ...newMessages]);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, POLL_INTERVAL_MS);
  };

  const handleFormSubmit = async (data: PreChatFormData) => {
    setFormData(data);
    setPhase('bot');

    // Show local greeting
    appendMessage({
      id: `bot-greet`,
      role: 'bot',
      text: `Hi **${data.customerName}**! I'm Kira, your AI assistant. How can I help you with your **${topicLabel(data.issueType)}** today?`,
      time: new Date().toISOString(),
    });

    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = async (text?: string) => {
    const txt = (text ?? input).trim();
    if (!txt || sending) return;

    setInput('');
    setSending(true);

    // Add user message to UI
    appendMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      text: txt,
      time: new Date().toISOString(),
    });

    try {
      if (phase === 'bot') {
        // Use AI bot API (no session yet)
        const tempSessionId = `temp-${Date.now()}`;
        const response = await portalApi.sendBotMessage({
          sessionId: tempSessionId,
          text: txt,
          locale: formData?.language === 'es' ? 'es_US' : 'en_US',
        });

        // Show bot response
        if (response.botResponse) {
          appendMessage({
            id: `bot-${Date.now()}`,
            role: 'bot',
            text: response.botResponse,
            time: new Date().toISOString(),
          });
        }

        // Check if transfer is required
        if (response.transferRequired) {
          await initiateAgentTransfer();
        }
      } else if ((phase === 'agent' || phase === 'connecting') && sessionId) {
        // Send via Connect API
        await portalApi.sendMessage(sessionId, txt);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      appendMessage({
        id: `err-${Date.now()}`,
        role: 'system',
        text: 'Message delivery failed. Please try again.',
        time: new Date().toISOString(),
      });
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const initiateAgentTransfer = async () => {
    if (!formData) return;

    try {
      appendMessage({
        id: `sys-transfer`,
        role: 'system',
        text: 'Connecting you to a live agent...',
        time: new Date().toISOString(),
      });

      // Start Connect chat session
      const result = await portalApi.startChat({
        customerName: formData.customerName,
        policyNumber: formData.policyNumber,
        topic: topicLabel(formData.issueType),
        language: formData.language,
      });

      setSessionId(result.sessionId);
      setPhase('connecting');

      // Start polling for messages
      startPolling(result.sessionId);

      // Send the "I want to talk to an agent" message to Connect
      await portalApi.sendMessage(result.sessionId, 'I want to talk to an agent');
    } catch (err) {
      console.error('Transfer failed:', err);
      appendMessage({
        id: `err-transfer`,
        role: 'system',
        text: 'Transfer failed. Please try again.',
        time: new Date().toISOString(),
      });
      setPhase('bot');
    }
  };

  const requestAgentTransfer = () => {
    initiateAgentTransfer();
  };

  const endChat = async () => {
    stopPolling();
    if (sessionId) {
      try {
        await portalApi.endChat(sessionId);
      } catch (err) {
        console.error('Failed to end chat:', err);
      }
    }
    appendMessage({
      id: `sys-end`,
      role: 'system',
      text: 'Chat session ended. Thank you for contacting Kiro Insurance!',
      time: new Date().toISOString(),
    });
    setPhase('ended');
  };

  if (phase === 'form') {
    return <PreChatForm onSubmit={handleFormSubmit} />;
  }

  if (phase === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4 bg-gray-50 p-8 text-center">
        <div className="text-3xl">⚠️</div>
        <p className="text-[14px] font-semibold text-gray-700">Connection Failed</p>
        <p className="text-[13px] text-gray-500">Unable to connect. Please try again.</p>
        <button
          onClick={() => setPhase('bot')}
          className="bg-brand text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl border-none transition hover:bg-brand-dark"
        >
          Back to Chat
        </button>
      </div>
    );
  }

  const quickReplies = phase === 'bot'
    ? ['Claim Status', 'Policy Details', 'Billing', 'Talk to Agent']
    : [];

  return (
    <>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {phase === 'connecting' && (
          <div className="flex items-center gap-2 text-[12px] text-gray-400 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            Waiting for agent...
          </div>
        )}
        {sending && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      {quickReplies.length > 0 && (
        <div className="px-3.5 pt-2.5 pb-0 flex gap-2 flex-wrap bg-white border-t border-gray-100">
          {quickReplies.map((label) => (
            <button
              key={label}
              onClick={() => label === 'Talk to Agent' ? requestAgentTransfer() : sendMessage(label)}
              disabled={sending}
              className="text-[11px] font-semibold text-brand border border-brand-200 bg-brand-50 hover:bg-brand-100 disabled:opacity-50 rounded-full px-3 py-1 mb-2.5 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      {phase !== 'ended' ? (
        <div className="p-3.5 flex gap-2 bg-white border-t border-border items-center">
          <input
            ref={inputRef}
            type="text"
            placeholder={phase === 'agent' ? 'Message the agent…' : 'Type your question…'}
            value={input}
            disabled={sending || phase === 'connecting'}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 bg-gray-50 border border-border rounded-xl px-3.5 py-2 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand-100 font-sans transition-all disabled:opacity-60"
          />
          <button
            onClick={() => sendMessage()}
            disabled={sending || !input.trim() || phase === 'connecting'}
            className="w-9 h-9 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 border-none text-white flex items-center justify-center transition-colors shadow-btn flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7h10M8 4l3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={endChat}
            title="End chat"
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-500 border-none text-gray-400 flex items-center justify-center transition-colors flex-shrink-0 text-[11px] font-bold"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="p-4 bg-white border-t border-border flex gap-2">
          <button
            onClick={() => { 
              setPhase('form'); 
              setMessages([]); 
              setFormData(null);
              setSessionId(null);
              seenIdsRef.current.clear();
              stopPolling();
            }}
            className="flex-1 bg-brand text-white text-[13px] font-semibold py-2.5 rounded-xl border-none transition hover:bg-brand-dark"
          >
            Start New Chat
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-600 text-[13px] font-semibold py-2.5 rounded-xl border-none transition hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────────

function convertMessage(m: ChatMessage): UIMessage {
  const roleMap: Record<string, UIMessage['role']> = {
    CUSTOMER: 'user',
    BOT: 'bot',
    AGENT: 'agent',
    SYSTEM: 'system',
  };
  return {
    id: m.Id,
    role: roleMap[m.ParticipantRole] ?? 'system',
    text: m.Content,
    time: m.AbsoluteTime,
  };
}

function topicLabel(issueType: string): string {
  const map: Record<string, string> = {
    claim_status: 'Claims',
    policy_info: 'Policy',
    billing: 'Billing',
    general: 'General',
  };
  return map[issueType] ?? 'General';
}

// ── Sub-components ─────────────────────────────────────────────────────────

const MessageBubble = ({ message }: { message: UIMessage }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isAgent = message.role === 'agent';

  if (isSystem) {
    return (
      <div className="text-center text-[11px] text-gray-400 py-1 px-2">
        — {message.text} —
      </div>
    );
  }

  const renderText = (text: string) =>
    text.split('\n').map((line, lineIdx, arr) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={lineIdx}>
          {parts.map((part, i) =>
            part.startsWith('**') && part.endsWith('**')
              ? <strong key={i}>{part.slice(2, -2)}</strong>
              : part
          )}
          {lineIdx < arr.length - 1 && <br />}
        </span>
      );
    });

  return (
    <div className={`flex gap-2 items-end ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 mb-0.5 ${isAgent ? 'bg-green-500' : 'bg-brand-gradient'}`}>
          {isAgent ? '👤' : 'K'}
        </div>
      )}
      <div
        className={`max-w-[260px] px-3.5 py-2.5 text-[13px] leading-relaxed rounded-2xl ${
          isUser
            ? 'bg-brand text-white rounded-br-sm shadow-btn'
            : isAgent
            ? 'bg-green-50 text-gray-700 border border-green-200 rounded-bl-sm shadow-card'
            : 'bg-white text-gray-700 border border-border rounded-bl-sm shadow-card'
        }`}
      >
        {isAgent && <span className="text-[10px] font-bold text-green-600 block mb-0.5">Live Agent</span>}
        {renderText(message.text)}
      </div>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex gap-2 items-end">
    <div className="w-7 h-7 rounded-xl bg-brand-gradient flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
      K
    </div>
    <div className="bg-white border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-card">
      <div className="flex gap-1 items-center">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

export default ChatWidget;
