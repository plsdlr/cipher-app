// ConsoleContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types
interface ConsoleMessage {
  id: string;
  text: string;
  timestamp: Date;
  type?: 'info' | 'success' | 'error' | 'warning';
  source?: string;
}

interface ConsoleContextType {
  messages: ConsoleMessage[];
  addMessage: (text: string, type?: ConsoleMessage['type'], source?: string) => void;
  clearConsole: () => void;
}

// Create Context
const ConsoleContext = createContext<ConsoleContextType | undefined>(undefined);

// Provider Component
export const ConsoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);

  const addMessage = (text: string, type: ConsoleMessage['type'] = 'info', source?: string) => {
    const newMessage: ConsoleMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      text,
      type,
      source,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
  };

  const clearConsole = () => {
    setMessages([]);
  };

  const value = {
    messages,
    addMessage,
    clearConsole
  };

  return (
    <ConsoleContext.Provider value={value}>
      {children}
    </ConsoleContext.Provider>
  );
};

// Custom Hook
export const useConsole = () => {
  const context = useContext(ConsoleContext);
  if (context === undefined) {
    throw new Error('useConsole must be used within a ConsoleProvider');
  }
  return context;
};

// Console Display Component
export const ConsoleDisplay: React.FC = () => {
  const { messages, clearConsole } = useConsole();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getMessageColor = (type: ConsoleMessage['type']) => {
    switch (type) {
      case 'success': return '#00ff00';
      case 'error': return '#ff4444';
      case 'warning': return '#ffaa00';
      default: return '#ffffff'; // Your app's red theme
    }
  };

  return (
    <div className="console-container">
      <div className="console-header">
        <h3>CONSOLE</h3>
        <button onClick={clearConsole} className="clear-btn">
          CLEAR
        </button>
      </div>

      <div className="console-output">
        {messages.length === 0 ? (
          <div className="console-empty">Console ready...</div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="console-line">
              <span className="console-time">[{formatTime(message.timestamp)}]</span>
              {message.source && (
                <span className="console-source">{message.source}:</span>
              )}
              <span
                className="console-text"
                style={{ color: getMessageColor(message.type) }}
              >
                {message.text}
              </span>
            </div>
          ))
        )}
      </div>

    </div>
  );
};