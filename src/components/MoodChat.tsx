import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Brain, Activity, Smile, Frown, Meh, Zap, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BehaviorStats {
  keystrokes: number;
  clicks: number;
  scrolls: number;
  avgIntensity: number;
  recentEvents: { type: string; label: string; intensity: number }[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mood?: string;
  moodScore?: number;
  confidence?: number;
  timestamp: string;
}

interface Props {
  behaviorStats: BehaviorStats;
}

const MOOD_ICONS: Record<string, typeof Smile> = {
  happy: Smile, excited: Zap, hopeful: Heart, calm: Meh,
  neutral: Meh, sad: Frown, stressed: Activity, anxious: Activity,
  frustrated: Frown, angry: Frown,
};

const MOOD_COLORS: Record<string, string> = {
  happy: 'text-drift-positive', excited: 'text-drift-warning', hopeful: 'text-drift-positive',
  calm: 'text-primary', neutral: 'text-muted-foreground', sad: 'text-drift-negative',
  stressed: 'text-drift-warning', anxious: 'text-drift-warning', frustrated: 'text-drift-negative',
  angry: 'text-drift-negative',
};

function parseMoodFromResponse(text: string): { mood?: string; score?: number; confidence?: number; cleanText: string } {
  const jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      const cleanText = text.replace(/```json\s*\{[\s\S]*?\}\s*```\s*/, '').trim();
      return { mood: parsed.mood, score: parsed.score, confidence: parsed.confidence, cleanText };
    } catch { /* ignore */ }
  }
  return { cleanText: text };
}

const MoodChat = ({ behaviorStats }: Props) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const allMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mood-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages,
          behaviorContext: {
            keystrokes: behaviorStats.keystrokes,
            clicks: behaviorStats.clicks,
            scrolls: behaviorStats.scrolls,
            avgIntensity: behaviorStats.avgIntensity,
            recentPatterns: behaviorStats.recentEvents.slice(0, 5),
          },
        }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: 'Stream failed' }));
        throw new Error(err.error || 'Failed to get response');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';
      const assistantId = crypto.randomUUID();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              const { mood, score, confidence, cleanText } = parseMoodFromResponse(assistantContent);

              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.id === assistantId) {
                  return prev.map((m, i) => i === prev.length - 1 ? {
                    ...m, content: cleanText || assistantContent,
                    mood, moodScore: score, confidence,
                  } : m);
                }
                return [...prev, {
                  id: assistantId, role: 'assistant' as const,
                  content: cleanText || assistantContent,
                  mood, moodScore: score, confidence,
                  timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                }];
              });

              if (mood) setCurrentMood(mood);
            }
          } catch { /* partial json, wait for more */ }
        }
      }

      // Save to database
      const final = parseMoodFromResponse(assistantContent);
      await supabase.from('mood_messages').insert([
        { role: 'user', content: text },
        {
          role: 'assistant', content: final.cleanText || assistantContent,
          detected_mood: final.mood, mood_score: final.score,
          behavior_context: {
            keystrokes: behaviorStats.keystrokes,
            clicks: behaviorStats.clicks,
            intensity: behaviorStats.avgIntensity,
          },
        },
      ]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: `⚠️ ${err.message || 'Failed to analyze mood. Please try again.'}`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, behaviorStats]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      sendMessage();
    }
  };

  const MoodIcon = currentMood ? (MOOD_ICONS[currentMood] || Meh) : Brain;
  const moodColor = currentMood ? (MOOD_COLORS[currentMood] || 'text-muted-foreground') : 'text-primary';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="surface-card flex flex-col h-[460px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-secondary">
        <div className="flex items-center gap-2">
          <MoodIcon className={`w-4 h-4 ${moodColor}`} />
          <h3 className="text-sm font-semibold heading-tight">Mood Analysis Chat</h3>
        </div>
        <div className="flex items-center gap-2">
          {currentMood && (
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary ${moodColor}`}>
              {currentMood.toUpperCase()}
            </span>
          )}
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
            <Activity className="w-3 h-3" />
            {behaviorStats.avgIntensity}%
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <Brain className="w-8 h-8 text-muted-foreground/30" />
            <div>
              <p className="text-xs text-muted-foreground">Type how you're feeling</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                AI analyzes your text + live behavior patterns
              </p>
            </div>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground'
              }`}>
                {msg.mood && msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-muted/30">
                    {(() => { const Icon = MOOD_ICONS[msg.mood] || Meh; return <Icon className={`w-3 h-3 ${MOOD_COLORS[msg.mood] || ''}`} />; })()}
                    <span className={`font-mono text-[10px] ${MOOD_COLORS[msg.mood] || ''}`}>{msg.mood}</span>
                    {msg.moodScore !== undefined && (
                      <span className="font-mono text-[10px] text-muted-foreground ml-auto">
                        {msg.moodScore > 0 ? '+' : ''}{msg.moodScore.toFixed(1)}
                      </span>
                    )}
                  </div>
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                <span className="text-[9px] text-muted-foreground mt-1 block text-right">{msg.timestamp}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-secondary rounded-xl px-3 py-2 text-xs text-muted-foreground">
              <span className="animate-pulse">Analyzing mood...</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-secondary">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="How are you feeling right now?"
            rows={1}
            className="flex-1 bg-secondary rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default MoodChat;
