import { useState, useEffect, useRef } from 'react';
import { Settings, Users, MessageSquare, Send, Radio, User } from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// App.tsx
export default function App() {
  const [peers, setPeers] = useState<any[]>([]);
  const [myInfo, setMyInfo] = useState<{ id: string, name: string } | null>(null);
  const [selectedPeer, setSelectedPeer] = useState<string>('broadcast');
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.api.getMyInfo().then(info => {
      setMyInfo(info);
      setDraftName(info.name);
    });

    window.api.getPeers().then(setPeers);

    window.api.onPeersUpdated((updatedPeers) => {
      setPeers(updatedPeers);
    });

    window.api.onMessage((msg) => {
      setMessages(prev => {
        // Prevent duplicate append in case of React Strict Mode double-effects
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedPeer]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !myInfo) return;

    const msg = await window.api.sendMessage(selectedPeer, inputText);
    setMessages(prev => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
    setInputText('');
  };

  const handleUpdateSettings = async () => {
    await window.api.updateName(draftName);
    setMyInfo(prev => prev ? { ...prev, name: draftName } : null);
    setIsSettingsOpen(false);
  };

  // Filter messages for current view
  const currentMessages = messages.filter(m => {
    if (selectedPeer === 'broadcast') return m.to === 'broadcast';
    // one-to-one
    return (m.from === selectedPeer && m.to === myInfo?.id) || 
           (m.from === myInfo?.id && m.to === selectedPeer);
  });

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-blue-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5" />
            <h1 className="font-bold text-lg">MeshLink</h1>
          </div>
          <button onClick={() => setIsSettingsOpen(true)} className="p-1 hover:bg-blue-700 rounded transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Channels</h2>
            <button 
              onClick={() => setSelectedPeer('broadcast')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                selectedPeer === 'broadcast' ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100 text-gray-700"
              )}
            >
              <Users className="w-5 h-5" />
              <div className="flex-1 text-left font-medium">Broadcast</div>
            </button>
          </div>

          <div className="p-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
              Nearby Peers ({peers.length})
            </h2>
            {peers.map(peer => (
              <button
                key={peer.id}
                onClick={() => setSelectedPeer(peer.id)}
                className={cn(
                  "w-full flex justify-between items-center px-3 py-2 rounded-md transition-colors mb-1",
                  selectedPeer === peer.id ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100 text-gray-700"
                )}
              >
                <div className="flex items-center gap-3 max-w-[80%]">
                  <div className="relative">
                     <User className="w-5 h-5" />
                     <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
                  </div>
                  <div className="flex-1 truncate text-left font-medium">{peer.name}</div>
                </div>
                <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">{peer.transport}</span>
              </button>
            ))}
            {peers.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">
                Scanning for peers...
              </div>
            )}
          </div>
        </div>
        
        <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
           <span className="truncate max-w-[150px]">My ID: {myInfo?.id.substring(0,8)}</span>
           <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Header */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm z-10">
          <MessageSquare className="w-5 h-5 text-gray-400 mr-3" />
          <h2 className="font-semibold text-lg text-gray-800">
            {selectedPeer === 'broadcast' ? 'Broadcast Channel' : peers.find(p => p.id === selectedPeer)?.name || 'Unknown Peer'}
          </h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {currentMessages.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                <p>No messages yet. Say hello!</p>
             </div>
          ) : (
            currentMessages.map(msg => {
              const isMine = msg.from === myInfo?.id;
              const senderName = isMine ? 'Me' : (peers.find(p => p.id === msg.from)?.name || msg.from.substring(0,6));
              
              return (
                <div key={msg.id} className={cn("flex flex-col max-w-[70%]", isMine ? "ml-auto items-end" : "items-start")}>
                  <div className="text-xs text-gray-400 mb-1 px-1">
                    {senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className={cn(
                    "px-4 py-2 rounded-2xl",
                    isMine ? "bg-blue-600 text-white rounded-br-none" : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
                  )}>
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2.5 bg-gray-100 border-transparent rounded-full focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5 pl-0.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 max-w-[90vw] p-6">
            <h2 className="text-xl font-bold mb-4">Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input 
                  type="text"
                  value={draftName}
                  onChange={e => setDraftName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">My UUID</label>
                <div className="px-3 py-2 bg-gray-100 rounded-md text-xs font-mono text-gray-500 break-all border border-gray-200">
                  {myInfo?.id}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Encryption</label>
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  AES-256-GCM Active
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateSettings}
                className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
