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
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    initChat();

    if (socket) {
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

    // POBIERAMY AKTUALNĄ SESJĘ DLA TOKENA
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return;

    socket.emit('send_message', {
      token: session.access_token,
      content: message,
      teamId: 'global' // Testowy czat globalny
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
            {chatHistory.length === 0 && <p className="text-muted" style={{textAlign: 'center', marginTop: '20px'}}>Brak wiadomości. Przywitaj się!</p>}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`message ${msg.sender_id === currentUser?.id ? 'own' : ''}`}>
                <span className="sender">{msg.sender_email || 'Użytkownik'}</span>
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
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage}><Send size={18} /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;
