import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { MessageSquare, Send, X } from 'lucide-react';
import { supabase } from '../supabaseClient';

const ChatSidebar: React.FC = () => {
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user));

    if (socket) {
      // SŁUCHANIE NOWYCH WIADOMOŚCI
      socket.on('new_message', (msg) => {
        setChatHistory((prev) => [...prev, msg]);
      });
    }

    return () => {
      socket?.off('new_message');
    };
  }, [socket]);

  const sendMessage = async () => {
    if (!message.trim() || !socket) return;

    const { data: { session } } = await supabase.auth.getSession();
    
    socket.emit('send_message', {
      token: session?.access_token,
      content: message,
      teamId: 'global' // Na razie uproszczony czat globalny dla testów
    });

    setMessage('');
  };

  return (
    <div className={`chat-sidebar ${isOpen ? 'open' : ''}`}>
      <button className="chat-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h3>Czat Zespołowy</h3>
          </div>
          
          <div className="chat-messages">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`message ${msg.sender_id === currentUser?.id ? 'own' : ''}`}>
                <span className="sender">{msg.sender_email}</span>
                <p>{msg.content}</p>
              </div>
            ))}
          </div>

          <div className="chat-input">
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Napisz wiadomość..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage}><Send size={18} /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;
