import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Trash2, MessageSquare } from 'lucide-react';
import { askAI, getChatHistory, saveChatHistory } from '../utils/aiUtils';

const Chatbot = ({ dashboardData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => getChatHistory());
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    saveChatHistory(messages);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const aiResponse = await askAI(input, dashboardData);
    setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    setIsLoading(false);
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('chat_history');
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-3 rounded-none bg-slate-900 dark:bg-white text-white dark:text-black shadow-none border border-slate-700 dark:border-slate-300 transition-all hover:translate-y-[-2px] z-50"
      >
        <MessageSquare size={16} />
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-6 w-[320px] h-[450px] bg-white dark:bg-slate-950 border border-slate-900 dark:border-slate-100 z-50 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-3 border-b border-slate-900 dark:border-slate-100 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
            <span className="text-[10px] font-black uppercase tracking-widest">Assistant</span>
            <div className="flex items-center gap-3">
              <button onClick={clearChat} title="Clear" className="opacity-40 hover:opacity-100">
                <Trash2 size={12} />
              </button>
              <button onClick={() => setIsOpen(false)} className="opacity-40 hover:opacity-100">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
          >
            {messages.length === 0 && (
              <div className="text-center opacity-20 mt-10">
                <p className="text-[10px] font-bold uppercase tracking-widest">Ready to assist.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-2 text-[11px] leading-relaxed border ${
                  msg.role === 'user' 
                    ? 'bg-slate-900 text-white border-slate-900' 
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-1 p-2 border border-slate-100 dark:border-slate-900">
                  <span className="w-1 h-1 bg-slate-300 rounded-full animate-pulse" />
                  <span className="w-1 h-1 bg-slate-300 rounded-full animate-pulse delay-75" />
                  <span className="w-1 h-1 bg-slate-300 rounded-full animate-pulse delay-150" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-900 dark:border-slate-100 flex gap-2">
            <input 
              type="text" 
              placeholder="Query..."
              className="flex-1 bg-transparent text-[11px] focus:outline-none placeholder:opacity-30 uppercase tracking-wider"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button 
              type="submit"
              disabled={isLoading}
              className="opacity-40 hover:opacity-100 disabled:opacity-10"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;
