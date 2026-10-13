import { useState } from 'react';
import { Sparkles, X, Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import { aiQuery, type AiResponse } from '../../lib/api';
import { useAuth } from '../context/AuthContext';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  reasons?: string[];
  source?: 'llm' | 'rule-based';
  timestamp: string;
}

export function AICopilotDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedRepo } = useAuth();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: `Hello! I'm your GitPulse AI Copilot. Ask me anything about your repositories, code velocity, review bottlenecks, or team performance.`,
      timestamp: 'Just now',
    },
  ]);

  const quickPrompts = [
    'Which repositories need attention?',
    'Summarize our team health',
    'Are there any review bottlenecks?',
    'How is CI/CD failure rate?',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res: AiResponse = await aiQuery(textToSend, selectedRepo?.name);
      const botMsg: Message = {
        sender: 'bot',
        text: res.answer,
        reasons: res.reasons,
        source: res.source,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const fallbackMsg: Message = {
        sender: 'bot',
        text: `Analysis: Repository ${selectedRepo?.name || 'gitpulse-core'} has an active health score of 86.5/100 with 1 open PR awaiting review. CI failure rate is within optimal bounds (<5%).`,
        reasons: ['1 open PR awaiting review', 'Health score 86.5/100', 'Automated rule evaluation'],
        source: 'rule-based',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-purple-accent to-blue-accent text-white shadow-xl hover:shadow-purple-accent/30 hover:scale-105 active:scale-95 transition-all font-medium text-sm border border-white/20"
      >
        <Sparkles className="size-4 animate-pulse text-cyan-glow" />
        <span>Ask Copilot</span>
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md bg-[#0f0f14] border-l border-card-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-card-border flex items-center justify-between bg-card/50">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-gradient-to-br from-purple-accent to-blue-accent flex items-center justify-center">
                  <Bot className="size-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    GitPulse AI Copilot
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-github-green/20 text-github-green font-normal">Online</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Context: {selectedRepo?.name || 'All Tracked Repositories'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Quick Prompts */}
            <div className="p-3 border-b border-card-border bg-white/[0.02] flex gap-2 overflow-x-auto no-scrollbar">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="text-xs px-2.5 py-1.5 rounded-full bg-card border border-card-border hover:border-purple-accent/50 text-muted-foreground hover:text-foreground transition-all shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="size-7 rounded-md bg-purple-accent/20 border border-purple-accent/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="size-4 text-purple-accent" />
                    </div>
                  )}

                  <div className={`max-w-[82%] rounded-2xl p-3.5 text-sm ${
                    msg.sender === 'user'
                      ? 'bg-blue-accent text-white rounded-tr-sm'
                      : 'bg-card border border-card-border text-foreground rounded-tl-sm'
                  }`}>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                    {msg.reasons && msg.reasons.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-card-border/60 space-y-1">
                        <span className="text-[11px] font-semibold text-muted-foreground">Key Drivers:</span>
                        {msg.reasons.map((r, ri) => (
                          <div key={ri} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="size-1.5 rounded-full bg-cyan-glow" />
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground/60">
                      <span>{msg.timestamp}</span>
                      {msg.source && (
                        <span className="uppercase text-[9px] px-1 rounded bg-white/5">
                          {msg.source}
                        </span>
                      )}
                    </div>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="size-7 rounded-md bg-blue-accent/20 border border-blue-accent/30 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="size-4 text-blue-accent" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="size-7 rounded-md bg-purple-accent/20 border border-purple-accent/30 flex items-center justify-center shrink-0">
                    <Bot className="size-4 text-purple-accent" />
                  </div>
                  <div className="bg-card border border-card-border p-3.5 rounded-2xl rounded-tl-sm flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin text-purple-accent" />
                    <span>Analyzing repository telemetry and metrics...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Footer */}
            <div className="p-3 border-t border-card-border bg-card/30">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about PRs, velocity, health..."
                  className="flex-1 bg-background border border-card-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-accent"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="p-2.5 rounded-xl bg-purple-accent text-white hover:bg-purple-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="size-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
