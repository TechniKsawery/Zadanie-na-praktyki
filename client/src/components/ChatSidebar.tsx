import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { MessageSquare, Send, X, Users, Globe } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { userService } from '../services/apiService';

const ChatSidebar: React.FC = () => {
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'global' | 'users'>('global');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [privateHistory, setPrivateHistory] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      const users = await userService.getUsers();
      setAllUsers(users.filter((u: any) => u.id !== user?.id));
    };
    initChat();

    if (socket) {
      socket.on('new_message', (msg) => {
        if (!msg.receiver_id) {
          setChatHistory((prev) => [...prev, msg]);
        }
      });

      socket.on('new_private_message', (msg) => {
        setPrivateHistory((prev) => [...prev, msg]);
      });
    }

    return () => {
      socket?.off('new_message');
      socket?.off('new_private_message');
    };
  }, [socket]);

  const sendMessage = async () => {
    if (!message.trim() || !socket) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const payload: any = {
      token: session.access_token,
      content: message,
    };

    if (selectedUser) {
      payload.receiverId = selectedUser.id;
      // Lokalnie dodajemy do widoku, żeby widzieć swoją wiadomość od razu
      setPrivateHistory(prev => [...prev, {
        sender_id: currentUser.id,
        sender_email: currentUser.email,
        content: message,
        receiver_id: selectedUser.id,
        created_at: new Date().toISOString()
      }]);
    } else {
      payload.teamId = 'global';
    }

    socket.emit('send_message', payload);
    setMessage('');
  };

  const filteredPrivateMessages = privateHistory.filter(msg => 
    (msg.sender_id === selectedUser?.id && msg.receiver_id === currentUser?.id) ||
    (msg.sender_id === currentUser?.id && msg.receiver_id === selectedUser?.id)
  );

  return (
    <div className={`chat-sidebar ${isOpen ? 'open' : ''}`}>
      <button className="chat-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-bold">
              {selectedUser ? `DM: ${selectedUser.email}` : 'Czat Ogólny'}
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => { setSelectedUser(null); setActiveTab('global'); }}
                className={`p-1 rounded ${activeTab === 'global' ? 'bg-indigo-100 text-indigo-600' : ''}`}
                title="Czat Ogólny"
              >
                <Globe size={20} />
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={`p-1 rounded ${activeTab === 'users' ? 'bg-indigo-100 text-indigo-600' : ''}`}
                title="Prywatne Wiadomości"
              >
                <Users size={20} />
              </button>
            </div>
          </div>
          
          <div className="chat-content flex-grow overflow-hidden flex flex-col">
            {activeTab === 'users' && !selectedUser ? (
              <div className="user-list overflow-y-auto p-2">
                <p className="text-xs text-muted mb-2 px-2 uppercase">Wybierz użytkownika:</p>
                {allUsers.map(user => (
                  <button 
                    key={user.id}
                    onClick={() => { setSelectedUser(user); setActiveTab('users'); }}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded flex items-center gap-2 mb-1"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs">
                      {user.email[0].toUpperCase()}
                    </div>
                    <span className="text-sm truncate">{user.email}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="chat-messages flex-grow overflow-y-auto p-4">
                {(selectedUser ? filteredPrivateMessages : chatHistory).map((msg, i) => (
                  <div key={i} className={`message mb-4 ${msg.sender_id === currentUser?.id ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-2 rounded-lg text-sm ${
                      msg.sender_id === currentUser?.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {!selectedUser && <div className="text-[10px] opacity-75 mb-1">{msg.sender_email}</div>}
                      <p>{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {(activeTab === 'global' || selectedUser) && (
            <div className="chat-input p-4 border-t flex gap-2">
              <input 
                type="text" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={selectedUser ? "Napisz wiadomość prywatną..." : "Napisz na czacie ogólnym..."}
                className="flex-grow p-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button 
                onClick={sendMessage}
                className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;
