import React, { useState, useEffect, useRef } from "react";
import queryString from "query-string";
import io, { Socket } from "socket.io-client";
import { useLocation, Link } from "react-router-dom";
import styles from './Chat.module.scss';

let socket: Socket | undefined;

interface Message {
  user: string;
  text: string;
  id?: string;
  timestamp?: number;
}

interface UserInfo {
  name: string;
  room: string;
}

const Chat = () => {
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState<string>("");
  const [room, setRoom] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  const ENDPOINT = "http://localhost:8000";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const { name, room } = queryString.parse(location.search);

    socket = io(ENDPOINT);
    
    setConnectionStatus('connecting');
    
    socket.on('connect', () => {
      setConnectionStatus('connected');
    });
    
    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    setName(name as string);
    setRoom(room as string);

    socket.emit("join", { name, room }, () => {
      setConnectionStatus('connected');
    });

    return () => {
      socket?.disconnect();
    };
  }, [ENDPOINT, location.search]);

  useEffect(() => {
    socket?.on("message", (message: Message) => {
      setMessages(messages => [...messages, { 
        ...message, 
        id: Date.now().toString(),
        timestamp: Date.now()
      }]);
    });

    socket?.on("roomData", ({ users }: { users: UserInfo[] }) => {
      setUsers(users);
    });

    return () => {
      socket?.off("message");
      socket?.off("roomData");
    };
  }, []);

  const sendMessage = (e: React.KeyboardEvent<HTMLInputElement> | React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && socket) {
      const messageToSend = message.trim();
      setMessage(""); // Clear immediately
      socket.emit("sendMessage", messageToSend, () => {
        inputRef.current?.focus();
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    // Simulate typing indicator
    if (!isTyping) {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 1000);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const isMyMessage = (messageUser: string) => {
    return messageUser.toLowerCase() === name.toLowerCase();
  };

  return (
    <div className={styles.chatPage}>
      {/* Background Elements */}
      <div className={styles.backgroundGlow} />
      <div className={styles.orbOne} />
      <div className={styles.orbTwo} />
      
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/" className={styles.backButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <div className={styles.roomInfo}>
            <h1 className={styles.roomName}>#{room}</h1>
            <div className={styles.connectionStatus}>
              <div className={`${styles.statusDot} ${styles[connectionStatus]}`} />
              <span className={styles.statusText}>
                {connectionStatus === 'connected' ? 'Connected' : 
                 connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
        
        <div className={styles.headerRight}>
          <button 
            onClick={() => window.open('/', '_blank')}
            className={styles.newRoomButton}
            title="Open new room in new tab to chat with yourself!"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>New Room</span>
          </button>
          
          <div className={styles.userCount}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>{users.length} online</span>
          </div>
        </div>
      </header>

      {/* Main Chat Container */}
      <div className={styles.chatContainer}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>Online Users</h3>
            <div className={styles.usersList}>
              {users.map((user, index) => (
                <div key={index} className={styles.userItem}>
                  <div className={styles.userAvatar}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={styles.userName}>
                    {user.name} {user.name.toLowerCase() === name.toLowerCase() && '(You)'}
                  </span>
                  <div className={styles.onlineIndicator} />
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Messages Area */}
        <main className={styles.messagesArea}>
          <div className={styles.messagesContainer}>
            <div className={styles.welcomeMessage}>
              <div className={styles.welcomeIcon}>💬</div>
              <h2>Welcome to #{room}</h2>
              <p>Start chatting with your team members</p>
              
              <div className={styles.newRoomNotice}>
                <div className={styles.noticeIcon}>✨</div>
                <div className={styles.noticeContent}>
                  <h4>Want to test the chat?</h4>
                  <p>Click "New Room" in the header to open a new tab. Join with a different name and chat with yourself!</p>
                </div>
              </div>
            </div>

            <div className={styles.messagesList}>
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`${styles.messageWrapper} ${isMyMessage(msg.user) ? styles.myMessage : styles.otherMessage}`}
                >
                  {!isMyMessage(msg.user) && (
                    <div className={styles.messageAvatar}>
                      {msg.user.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <div className={styles.messageBubble}>
                    {!isMyMessage(msg.user) && (
                      <div className={styles.messageMeta}>
                        <span className={styles.messageUser}>{msg.user}</span>
                        {msg.timestamp && (
                          <span className={styles.messageTime}>{formatTime(msg.timestamp)}</span>
                        )}
                      </div>
                    )}
                    <div className={styles.messageText}>{msg.text}</div>
                    {isMyMessage(msg.user) && msg.timestamp && (
                      <div className={styles.messageTime}>{formatTime(msg.timestamp)}</div>
                    )}
                  </div>
                  
                  {isMyMessage(msg.user) && (
                    <div className={styles.messageAvatar}>
                      {msg.user.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className={styles.typingIndicator}>
                  <div className={styles.typingDots}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span>Someone is typing...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className={styles.inputContainer}>
            <form onSubmit={sendMessage} className={styles.messageForm}>
              <div className={styles.inputWrapper}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={`Message #${room}...`}
                  value={message}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className={styles.messageInput}
                  autoFocus
                />
                <button 
                  type="submit" 
                  className={styles.sendButton}
                  disabled={!message.trim()}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <div className={styles.inputHint}>
                Press Enter to send • Shift + Enter for new line
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Chat;