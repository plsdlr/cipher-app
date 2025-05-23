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
            default: return '#ff0000'; // Your app's red theme
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

            <style jsx>{`
        .console-container {
          background-color: #000000;
          border: 1px solid #ff0000;
          height: 100%;
          display: flex;
          flex-direction: column;
          font-family: 'Reactor7', monospace;
          font-size: 14px;
        }

        .console-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          border-bottom: 1px solid #ff0000;
          background-color: #191919;
        }

        .console-header h3 {
          margin: 0;
          color: #ff0000;
          font-size: 16px;
        }

        .clear-btn {
          background: none;
          border: 1px solid #ff0000;
          color: #ff0000;
          padding: 4px 8px;
          cursor: pointer;
          font-family: 'Reactor7', monospace;
          font-size: 12px;
        }

        .clear-btn:hover {
          background-color: #ff0000;
          color: #000000;
        }

        .console-output {
          flex: 1;
          padding: 8px;
          overflow-y: auto;
          max-height: 100%;
        }

        .console-empty {
          color: #666;
          font-style: italic;
        }

        .console-line {
          margin-bottom: 4px;
          word-wrap: break-word;
        }

        .console-time {
          color: #888;
          font-size: 12px;
        }

        .console-source {
          color: #00aaff;
          margin-left: 4px;
          font-weight: bold;
        }

        .console-text {
          margin-left: 4px;
        }

        /* Auto-scroll to bottom */
        .console-output::-webkit-scrollbar {
          width: 6px;
        }

        .console-output::-webkit-scrollbar-track {
          background: #191919;
        }

        .console-output::-webkit-scrollbar-thumb {
          background: #ff0000;
        }
      `}</style>
        </div>
    );
};