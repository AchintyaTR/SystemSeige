"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Send, User, Bot, Loader2, Trash2 } from "lucide-react";

const TypingEffect = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  useEffect(() => {
    let index = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      if (index >= text.length) {
        clearInterval(interval);
        return;
      }
      const charToAppend = text[index];
      setDisplayedText((prev) => prev + charToAppend);
      index++;
    }, 15);
    return () => clearInterval(interval);
  }, [text]);
  return <>{displayedText}</>;
};

export default function BoardChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("English");
  const [selectedAdvisor, setSelectedAdvisor] = useState("General");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const languages = ["English", "Hindi", "Marathi", "Gujarati", "Bengali", "Tamil", "Telugu", "Spanish", "French"];
  const advisors = ["General", "Loan", "Tax", "Investment"];

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get("/chat/history");
        setMessages(data);
      } catch (err: any) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          router.push("/login");
        }
      }
    };
    fetchHistory();
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), message: input, board_response: null, advisor_type: selectedAdvisor, isNew: true };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await api.post("/chat", { message: userMessage.message, language, advisor_type: selectedAdvisor });
      setMessages((prev) => prev.map(m => m.id === userMessage.id ? { ...data, isNew: true, advisor_type: selectedAdvisor } : m));
    } catch (err) {
      console.error(err);
      // Remove the optimistic message on error, or show error state
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await api.delete("/chat/history");
      setMessages([]);
    } catch (err) {
      console.error("Failed to clear chat:", err);
    }
  };


  const filteredMessages = messages.filter(msg => {
    let boardRes = msg.board_response;
    if (typeof boardRes === 'string') {
      try { boardRes = JSON.parse(boardRes); } catch(e) {}
    }
    const msgAdvisor = msg.advisor_type || (boardRes && boardRes.advisor_type) || "General";
    return msgAdvisor === selectedAdvisor;
  });

  return (
    <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full p-4 h-[calc(100vh-4rem)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Personal Financial Advisor</h1>
          <p className="text-foreground/60 text-sm">Consult your personalized AI financial advisor.</p>
        </div>
        {filteredMessages.length > 0 && (
          <button 
            onClick={handleClearChat}
            className="flex items-center gap-2 px-4 py-2 bg-danger/10 text-danger hover:bg-danger/20 rounded-xl transition-colors text-sm font-medium"
          >
            <Trash2 className="h-4 w-4" /> Clear Chat
          </button>
        )}
      </div>

      {/* Advisor Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
        {advisors.map(adv => (
          <button
            key={adv}
            onClick={() => setSelectedAdvisor(adv)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              selectedAdvisor === adv 
                ? "bg-primary text-white" 
                : "bg-foreground/5 hover:bg-foreground/10 text-foreground/80"
            }`}
          >
            {adv} Advisor
          </button>
        ))}
      </div>

      <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden border border-white/10">
        
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {filteredMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-foreground/50 italic gap-4">
              <Bot className="h-12 w-12 opacity-20" />
              <span>No history with the {selectedAdvisor} Advisor yet. Ask a question below!</span>
            </div>
          )}
          
          {filteredMessages.map((msg: any, idx) => (
            <div key={msg.id || idx} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              {/* User Message */}
              <div className="flex items-start gap-4 justify-end">
                <div className="bg-primary/20 text-foreground p-4 rounded-2xl rounded-tr-none max-w-[80%]">
                  {msg.message}
                </div>
                <div className="bg-primary p-2 rounded-full mt-1">
                  <User className="h-5 w-5 text-white" />
                </div>
              </div>

              {/* Board Response */}
              {msg.board_response ? (
                <div className="flex items-start gap-4">
                  <div className="bg-foreground/10 p-2 rounded-full mt-1">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 text-foreground">
                      <p className="text-sm leading-relaxed opacity-90 whitespace-pre-wrap">
                        {msg.isNew ? <TypingEffect text={msg.board_response.advice} /> : msg.board_response.advice}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="bg-foreground/10 p-2 rounded-full mt-1">
                    <Bot className="h-5 w-5 text-white animate-pulse" />
                  </div>
                  <div className="bg-foreground/5 p-4 rounded-2xl rounded-tl-none animate-pulse text-foreground/60">
                    Your advisor is analyzing your question...
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-foreground/5 border-t border-foreground/10">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder={`Ask the ${selectedAdvisor} Advisor about ${
                selectedAdvisor === 'Loan' ? 'managing debt...' :
                selectedAdvisor === 'Tax' ? 'saving on taxes...' :
                selectedAdvisor === 'Investment' ? 'growing wealth...' :
                'your finances...'
              }`}
              className="w-full bg-background border border-foreground/20 rounded-full py-4 pl-6 pr-44 text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
            />
            
            <div className="absolute right-16 flex items-center h-full py-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={loading}
                className="h-full bg-background/50 border border-foreground/10 text-sm rounded-xl px-3 outline-none focus:border-primary text-foreground/80 appearance-none disabled:opacity-50"
              >
                {languages.map(l => <option key={l} value={l} className="bg-background text-foreground">{l}</option>)}
              </select>
            </div>

            <button 
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 p-3 bg-primary hover:bg-primary/90 rounded-full text-white transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
