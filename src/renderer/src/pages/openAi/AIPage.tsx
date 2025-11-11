import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import './App.model.css';

const App: React.FC = () => {
    const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
    const [messages, setMessages] = useState<any[]>([]);

    const handleConversationChange = (sessionId: number, msgs: any[]) => {
        setCurrentSessionId(sessionId);
        setMessages(msgs);
    };

    const handleMessagesUpdate = (updatedMessages: any[]) => {
        setMessages(updatedMessages);
    };

    return (
        <div style={{
            display: 'flex',
            height: '90vh',
            background: '#f5f5f5',
            marginTop: -30
        }}>
            <Sidebar
                onConversationChange={handleConversationChange}
                currentSessionId={currentSessionId}
            />
            <ChatArea
                sessionId={currentSessionId}
                initialMessages={messages}
                onMessagesUpdate={handleMessagesUpdate}
            />
        </div>
    );
};

export default App;
