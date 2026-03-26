import React, { useState, useRef } from 'react';

function AiChat() {
  const [messages, setMessages] = useState([
    { type: 'ai', text: 'How can I help you refine your writing today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const chatBoxRef = useRef(null);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    
    setMessages([...messages, { type: 'user', text: chatInput }]);
    setChatInput('');
    
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'ai', text: 'Great suggestion! Keep writing to improve.' }]);
      if (chatBoxRef.current) {
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }
    }, 500);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMessages([...messages, { type: 'file', text: file.name }]);
    }
  };

  return (
    <div className="animate-view flex h-full bg-slate-800 rounded-[2.5rem] shadow-xl border border-slate-700 overflow-hidden relative min-h-[500px]">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-6 border-b flex justify-between items-center bg-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg"><i className="fa-solid fa-robot"></i></div>
            <p className="font-bold text-slate-200">AI Assistant</p>
          </div>
          <button onClick={() => setShowHistory(!showHistory)} className="text-xs font-bold bg-slate-800 border border-slate-700 px-5 py-2.5 rounded-xl text-indigo-600 hover:bg-indigo-50 transition shadow-sm">Show History</button>
        </div>
        
        <div ref={chatBoxRef} className="flex-1 p-8 space-y-6 overflow-y-auto bg-slate-900/40">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : ''}`}>
              {msg.type === 'file' ? (
                <div className="bg-indigo-600/30 border border-indigo-500/50 text-indigo-200 p-4 rounded-3xl rounded-br-none text-sm max-w-md flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/50 flex items-center justify-center text-indigo-300 shadow-sm shrink-0">
                    <i className="fa-solid fa-file-arrow-up"></i>
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-xs text-indigo-300 uppercase tracking-wider mb-0.5">File Attached</p>
                    <p className="truncate font-medium text-indigo-100">{msg.text}</p>
                  </div>
                </div>
              ) : (
                <div className={`p-5 rounded-3xl text-sm max-w-md ${msg.type === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-800 rounded-bl-none shadow-sm'}`}>
                  {msg.text}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="p-6 border-t flex gap-3 bg-slate-800 items-center">
          <input type="file" id="fileUpload" className="hidden" onChange={handleFileUpload} />
          <button onClick={() => document.getElementById('fileUpload').click()} className="w-12 h-12 rounded-2xl bg-slate-700 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition flex items-center justify-center shrink-0" title="Upload File">
            <i className="fa-solid fa-paperclip text-lg"></i>
          </button>

          <input type="text" placeholder="Type here..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} className="flex-1 bg-slate-700 border-none rounded-2xl h-12 px-6 outline-none text-sm text-slate-100 placeholder-slate-500" />
          <button onClick={sendMessage} className="w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-lg flex items-center justify-center shrink-0 hover:bg-indigo-700 transition"><i className="fa-solid fa-paper-plane"></i></button>
        </div>
      </div>
      
      <div className={`w-80 border-l border-slate-700 bg-slate-900 history-panel ${showHistory ? '' : 'history-hidden'} h-full flex flex-col z-30 overflow-y-auto`}>
        <div className="p-6 border-b bg-slate-800 flex justify-between items-center sticky top-0">
          <h3 className="font-bold text-xs uppercase text-slate-400">History</h3>
          <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-rose-500"><i className="fa-solid fa-xmark"></i></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 cursor-pointer hover:border-indigo-400 transition">
            <p className="text-xs font-bold text-indigo-600 mb-1">March 26</p>
            <p className="text-sm text-slate-400 truncate font-medium">Proposal Tone Draft</p>
          </div>
          <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 cursor-pointer hover:border-indigo-400 transition">
            <p className="text-xs font-bold text-indigo-600 mb-1">March 25</p>
            <p className="text-sm text-slate-400 truncate font-medium">Email Template Review</p>
          </div>
          <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 cursor-pointer hover:border-indigo-400 transition">
            <p className="text-xs font-bold text-indigo-600 mb-1">March 24</p>
            <p className="text-sm text-slate-400 truncate font-medium">Blog Post Outline</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AiChat;
