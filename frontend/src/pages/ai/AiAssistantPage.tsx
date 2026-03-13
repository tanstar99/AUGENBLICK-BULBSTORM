// AI Assistant Page - Full-featured chat interface
import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Trash2, 
  Send, 
  Sparkles, 
  Lightbulb, 
  PieChart, 
  Tag,
  History,
  Info,
  MoreVertical,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/layouts";
import { useAIConversations, useAIConversation } from "@/hooks";
import { aiService } from "@/api/services";

const AiAssistantPage: React.FC = () => {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { data: convData, refetch: refetchConversations } = useAIConversations();
  const { data: detailsData } = useAIConversation(activeConversationId);

  const [localMessages, setLocalMessages] = useState<any[]>([]);

  useEffect(() => {
    if (detailsData?.conversation?.messages) {
      setLocalMessages(detailsData.conversation.messages);
    } else {
      setLocalMessages([]);
    }
  }, [detailsData]);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (msg?: string) => {
    const messageToSend = msg || inputMessage;
    if (!messageToSend.trim()) return;

    const userMessage = { role: "user", content: messageToSend, timestamp: new Date().toISOString() };
    setLocalMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const response = await aiService.chat(messageToSend, activeConversationId || undefined);
      if (response.success) {
        const assistantMessage = { 
          role: "assistant", 
          content: response.data.message.content, 
          timestamp: new Date().toISOString() 
        };
        setLocalMessages(prev => [...prev, assistantMessage]);
        
        if (!activeConversationId && response.data.conversationId) {
          setActiveConversationId(response.data.conversationId);
          refetchConversations();
        }
      }
    } catch (error) {
      console.error("AI Chat error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const startNewChat = () => {
    setActiveConversationId(null);
    setLocalMessages([]);
    setInputMessage("");
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Delete this conversation?")) {
      try {
        await aiService.delete(id);
        if (activeConversationId === id) {
          startNewChat();
        }
        refetchConversations();
      } catch (error) {
        console.error("Delete error:", error);
      }
    }
  };

  const quickActions = [
    { icon: Lightbulb, label: "Reuse Ideas", text: "Give me some creative reuse ideas for old wooden pallets.", color: "text-amber-400", bg: "bg-amber-500/10" },
    { icon: Tag, label: "Categorize", text: "Help me categorize this material: industrial rubber scraps from a tire factory.", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { icon: PieChart, label: "Impact Analysis", text: "What is the environmental impact of recycling 500kg of scrap aluminum?", color: "text-blue-400", bg: "bg-blue-500/10" },
  ];

  const filteredConversations = convData?.conversations.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-160px)] flex gap-6">
        {/* Left Sidebar: Conversations */}
        <aside className="w-80 flex flex-col bg-neutral-900/40 border border-neutral-800/50 rounded-3xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 space-y-4">
            <button 
              onClick={startNewChat}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-5 h-5" /> New Conversation
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input 
                type="text" 
                placeholder="Search chats..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-6 space-y-1 scrollbar-hide">
            <h3 className="px-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <History className="w-3 h-3" /> Recent History
            </h3>
            {filteredConversations.map((conv) => (
              <button
                key={conv._id}
                onClick={() => setActiveConversationId(conv._id)}
                className={`w-full text-left p-4 rounded-2xl flex items-start gap-3 group transition-all ${
                  activeConversationId === conv._id 
                    ? "bg-neutral-800 border border-neutral-700 shadow-xl" 
                    : "hover:bg-neutral-800/40 border border-transparent"
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${activeConversationId === conv._id ? "bg-emerald-500/20 text-emerald-400" : "bg-neutral-800 text-neutral-500"}`}>
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-sm font-bold text-white truncate mb-1">{conv.title}</p>
                  <p className="text-[10px] text-neutral-500 font-medium truncate">{conv.lastMessage || "No messages yet"}</p>
                </div>
                <button 
                  onClick={(e) => handleDeleteConversation(e, conv._id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </button>
            ))}
            
            {!filteredConversations.length && !convData && (
               <div className="py-8 text-center text-neutral-600 space-y-3">
                 <div className="w-12 h-12 border-2 border-neutral-800 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
                 <p className="text-xs font-bold uppercase tracking-widest">Loading Chats...</p>
               </div>
            )}
          </div>
        </aside>

        {/* Main Panel: Chat Window */}
        <main className="flex-1 flex flex-col bg-neutral-900/40 border border-neutral-800/50 rounded-3xl overflow-hidden backdrop-blur-sm relative">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none"></div>

          {/* Chat Header */}
          <header className="p-6 border-b border-neutral-800/50 flex items-center justify-between bg-black/20 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-neutral-950">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">
                  {detailsData?.conversation?.title || "New Assistant Session"}
                </h2>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Oracle Engine Online • Knowledge Base Connected
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-neutral-500 hover:text-white transition-colors">
                <Info className="w-5 h-5" />
              </button>
              <button className="p-2 text-neutral-500 hover:text-white transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-0 scroll-smooth">
            {!localMessages.length && (
              <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-8">
                <div className="p-6 bg-emerald-500/10 rounded-[2.5rem] border border-emerald-500/20">
                  <Sparkles className="w-16 h-16 text-emerald-500" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-white">How can I assist today?</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    I'm your Circular Economy guide, now powered by the Circula RAG Engine. 
                    Ask me about specific material lifecycle, localized Mumbai data, 
                    or creative ways to repurpose heritage waste from our knowledge base.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full pt-6">
                   {quickActions.map((action, i) => (
                     <button
                       key={i}
                       onClick={() => handleSendMessage(action.text)}
                       className="p-4 bg-black/40 border border-neutral-800 rounded-2xl text-left hover:border-emerald-500/50 transition-all group"
                     >
                       <action.icon className={`w-5 h-5 ${action.color} mb-3`} />
                       <p className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-widest">{action.label}</p>
                       <ArrowRight className="w-3 h-3 text-neutral-600 mt-2 group-hover:translate-x-1 transition-transform" />
                     </button>
                   ))}
                </div>
              </div>
            )}

            {localMessages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.role === "user" 
                    ? "bg-emerald-500 text-neutral-950 font-medium" 
                    : "bg-neutral-800 text-neutral-200 border border-neutral-700"
                }`}>
                  {msg.content}
                  <div className={`text-[9px] mt-2 font-bold uppercase ${msg.role === "user" ? "text-neutral-950/60" : "text-neutral-500"}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4 flex gap-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-100"></span>
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <footer className="p-6 bg-black/20 border-t border-neutral-800/50 relative z-10">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="relative flex items-center gap-3 bg-neutral-950/60 border border-neutral-800 rounded-2xl p-2 pl-4 focus-within:border-emerald-500/50 transition-all"
            >
              <input 
                type="text" 
                placeholder="Message AI Assistant..." 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 bg-transparent py-2 text-sm text-white placeholder-neutral-700 focus:outline-none"
              />
              <button 
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className="p-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 rounded-xl transition-all shadow-lg shadow-emerald-500/10"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <p className="text-center text-[9px] font-black text-neutral-600 uppercase tracking-widest mt-4">
              AI Insight Engine • V4-Oracle • 128k Context
            </p>
          </footer>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default AiAssistantPage;