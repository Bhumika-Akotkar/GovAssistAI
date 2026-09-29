import React, { useState, useEffect } from 'react';
import { Mic, Send, Globe, WifiOff, FileText, ChevronRight } from 'lucide-react';
import { OfflineSyncManager } from '@/utils/OfflineSyncManager';
import { Button } from '@/components/ui/button';

export default function CitizenChatPage() {
  const [messages, setMessages] = useState([
    { role: 'agent', content: 'Namaste! I am your virtual citizen assistant. How can I help you access government services today?' }
  ]);
  const [input, setInput] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [language, setLanguage] = useState('hi-IN');

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      OfflineSyncManager.syncWithServer();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = input;
    setInput('');

    if (isOffline) {
      await OfflineSyncManager.enqueueMessage('citizen-agent', currentInput, language);
      setMessages(prev => [...prev, { role: 'agent', content: 'You are offline. Your message has been saved and will be sent when you reconnect.' }]);
    } else {
      // In a real integration, this would send via WebSocket or API
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'agent', content: 'This is a simulated response in ' + language + '. Step 1: Provide your Aadhaar number.' }]);
      }, 1000);
    }
  };

  const services = [
    "Apply for Ration Card",
    "Check Pension Status",
    "Birth Certificate",
    "Agricultural Subsidies"
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-emerald-600 text-white p-4 shadow-md flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
            <span className="text-emerald-600 font-bold text-xl">G</span>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">GovAssist</h1>
            <p className="text-xs text-emerald-100">Virtual Citizen Assistant</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {isOffline && (
            <div className="flex items-center gap-1 bg-amber-500 text-white px-2 py-1 rounded text-xs font-semibold">
              <WifiOff size={14} /> Offline Mode
            </div>
          )}
          <div className="relative group">
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="appearance-none bg-emerald-700 hover:bg-emerald-800 text-white border-none py-1.5 pl-3 pr-8 rounded-md text-sm font-medium focus:ring-2 focus:ring-emerald-400 cursor-pointer outline-none transition-colors"
            >
              <option value="hi-IN">हिन्दी (Hindi)</option>
              <option value="en-US">English</option>
              <option value="ta-IN">தமிழ் (Tamil)</option>
              <option value="te-IN">తెలుగు (Telugu)</option>
              <option value="bn-IN">বাংলা (Bengali)</option>
            </select>
            <Globe size={16} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        
        {/* Quick Services Carousel */}
        <div className="mb-2">
          <h2 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">Quick Services</h2>
          <div className="flex overflow-x-auto gap-3 pb-2 snap-x hide-scrollbar">
            {services.map((svc, i) => (
              <button 
                key={i} 
                onClick={() => setInput(`I need help with: ${svc}`)}
                className="snap-start shrink-0 bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-2 hover:border-emerald-500 hover:shadow-md transition-all active:scale-95"
              >
                <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                  <FileText size={18} />
                </div>
                <span className="font-medium text-sm text-slate-700 whitespace-nowrap">{svc}</span>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 flex flex-col gap-4 pb-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-br-none' 
                  : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
              }`}>
                <p className="text-[15px] leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-slate-200 p-3 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto flex gap-2 items-end">
          <button className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 p-3 rounded-full shrink-0 transition-colors shadow-sm">
            <Mic size={24} />
          </button>
          
          <div className="flex-1 bg-slate-100 rounded-2xl border border-transparent focus-within:border-emerald-400 focus-within:bg-white focus-within:shadow-sm transition-all overflow-hidden flex items-center pr-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message here..."
              className="w-full bg-transparent border-none px-4 py-3 outline-none text-slate-700 placeholder:text-slate-400"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
