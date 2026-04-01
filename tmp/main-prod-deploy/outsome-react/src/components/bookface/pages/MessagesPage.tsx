import React, { useState } from 'react';
import { BookfaceHeader } from '../BookfaceHeader';
import { MessageList } from '../MessageList';
import type { Message } from '../MessageList';

const mockMessages: Message[] = [
  { id: '1', participant: { id: 'u1', name: 'Sarah Chen', avatarUrl: 'https://i.pravatar.cc/150?u=sarah' }, lastMessage: 'Thanks for the intro! I\'ll reach out to them today.', lastMessageAt: '2m ago', isUnread: true },
  { id: '2', participant: { id: 'u2', name: 'Michael Rodriguez', avatarUrl: 'https://i.pravatar.cc/150?u=michael' }, lastMessage: 'The demo went great, they want to move forward with a pilot.', lastMessageAt: '15m ago', isUnread: true },
  { id: '3', participant: { id: 'u3', name: 'Emily Watson', avatarUrl: 'https://i.pravatar.cc/150?u=emily' }, lastMessage: 'Can we sync tomorrow about the partnership?', lastMessageAt: '1h ago', isUnread: false },
  { id: '4', participant: { id: 'g1', name: 'W20 Founders', avatarUrl: 'https://i.pravatar.cc/150?u=group1' }, lastMessage: 'Alex: Anyone else going to the demo day next week?', lastMessageAt: '2h ago', isUnread: false, isGroup: true, groupName: 'W20 Founders' },
  { id: '5', participant: { id: 'u4', name: 'Alex Kim', avatarUrl: 'https://i.pravatar.cc/150?u=alex' }, lastMessage: 'Just sent over the contract, let me know if you have questions.', lastMessageAt: '3h ago', isUnread: false },
  { id: '6', participant: { id: 'g2', name: 'Fintech Founders', avatarUrl: 'https://i.pravatar.cc/150?u=group2' }, lastMessage: 'Jessica: Great news on the regulatory front!', lastMessageAt: '5h ago', isUnread: false, isGroup: true, groupName: 'Fintech Founders' },
  { id: '7', participant: { id: 'u5', name: 'David Park', avatarUrl: 'https://i.pravatar.cc/150?u=david' }, lastMessage: 'Let\'s grab coffee next week and catch up.', lastMessageAt: 'Yesterday', isUnread: false },
  { id: '8', participant: { id: 'u6', name: 'Jessica Liu', avatarUrl: 'https://i.pravatar.cc/150?u=jessica' }, lastMessage: 'I\'ll send you the deck after the meeting.', lastMessageAt: 'Yesterday', isUnread: false },
  { id: '9', participant: { id: 'u7', name: 'Chris Taylor', avatarUrl: 'https://i.pravatar.cc/150?u=chris' }, lastMessage: 'Thanks for the feedback on the pitch!', lastMessageAt: '2 days ago', isUnread: false },
  { id: '10', participant: { id: 'u8', name: 'Rachel Green', avatarUrl: 'https://i.pravatar.cc/150?u=rachel' }, lastMessage: 'Happy to make that intro, just let me know when.', lastMessageAt: '3 days ago', isUnread: false },
];

const mockConversations: Record<string, { messages: { id: string; senderId: string; text: string; timestamp: string; isMine: boolean }[] }> = {
  '1': {
    messages: [
      { id: 'm1', senderId: 'u1', text: 'Hey! I saw you\'re connected with the team at Acme Corp.', timestamp: '10:30 AM', isMine: false },
      { id: 'm2', senderId: 'me', text: 'Hi Sarah! Yes, I know their CEO pretty well. Happy to make an intro.', timestamp: '10:32 AM', isMine: true },
      { id: 'm3', senderId: 'u1', text: 'That would be amazing! We\'re looking to partner with them on payments.', timestamp: '10:33 AM', isMine: false },
      { id: 'm4', senderId: 'me', text: 'Perfect, I think there could be good synergy there. Let me shoot them an email.', timestamp: '10:35 AM', isMine: true },
      { id: 'm5', senderId: 'u1', text: 'You\'re the best! Really appreciate it.', timestamp: '10:36 AM', isMine: false },
      { id: 'm6', senderId: 'me', text: 'Done! I CC\'d you on the intro email. They usually respond within a day.', timestamp: '10:45 AM', isMine: true },
      { id: 'm7', senderId: 'u1', text: 'Thanks for the intro! I\'ll reach out to them today.', timestamp: '10:47 AM', isMine: false },
    ],
  },
  '2': {
    messages: [
      { id: 'm1', senderId: 'u2', text: 'Just finished the demo with the enterprise client!', timestamp: '9:00 AM', isMine: false },
      { id: 'm2', senderId: 'me', text: 'How did it go? Were they engaged?', timestamp: '9:05 AM', isMine: true },
      { id: 'm3', senderId: 'u2', text: 'Really well! They asked a ton of questions about the API.', timestamp: '9:06 AM', isMine: false },
      { id: 'm4', senderId: 'me', text: 'That\'s a great sign. What were their main concerns?', timestamp: '9:08 AM', isMine: true },
      { id: 'm5', senderId: 'u2', text: 'Mainly about security and compliance. I walked them through our SOC 2.', timestamp: '9:10 AM', isMine: false },
      { id: 'm6', senderId: 'me', text: 'Perfect. What\'s the next step?', timestamp: '9:12 AM', isMine: true },
      { id: 'm7', senderId: 'u2', text: 'The demo went great, they want to move forward with a pilot.', timestamp: '9:15 AM', isMine: false },
    ],
  },
};

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#fefaf3',
    fontFamily: '"BDO Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  container: {
    display: 'flex',
    height: 'calc(100vh - 60px)',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderLeft: '1px solid #e0e0e0',
    borderRight: '1px solid #e0e0e0',
  },
  messageListContainer: {
    width: '350px',
    flexShrink: 0,
    borderRight: '1px solid #e0e0e0',
    height: '100%',
    overflow: 'hidden',
  },
  conversationContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
  },
  conversationHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #e0e0e0',
    gap: '12px',
  },
  headerAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#2F2C26',
  },
  headerStatus: {
    fontSize: '12px',
    color: '#666666',
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  messageRow: {
    display: 'flex',
    maxWidth: '70%',
  },
  messageRowMine: {
    alignSelf: 'flex-end' as const,
  },
  messageRowTheirs: {
    alignSelf: 'flex-start' as const,
  },
  messageBubble: {
    padding: '10px 14px',
    borderRadius: '18px',
    fontSize: '14px',
    lineHeight: 1.4,
    maxWidth: '100%',
  },
  messageBubbleMine: {
    backgroundColor: '#555AB9',
    color: '#ffffff',
    borderBottomRightRadius: '4px',
  },
  messageBubbleTheirs: {
    backgroundColor: '#f0f0f0',
    color: '#2F2C26',
    borderBottomLeftRadius: '4px',
  },
  messageTime: {
    fontSize: '11px',
    color: '#999999',
    marginTop: '4px',
    textAlign: 'right' as const,
  },
  inputContainer: {
    padding: '16px',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '24px',
    border: '1px solid #e0e0e0',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    padding: '10px 20px',
    backgroundColor: '#555AB9',
    color: '#ffffff',
    border: 'none',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666666',
    fontSize: '14px',
  },
};

export const MessagesPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>('1');
  const [newMessage, setNewMessage] = useState('');

  const selectedConversation = mockMessages.find(m => m.id === selectedId);
  const conversationMessages = selectedId ? mockConversations[selectedId]?.messages || [] : [];

  const handleSend = () => {
    if (newMessage.trim()) {
      console.log('Send message:', newMessage);
      setNewMessage('');
    }
  };

  return (
    <div style={styles.page}>
      <BookfaceHeader userName="John Doe" userAvatarUrl="https://i.pravatar.cc/150?u=johndoe" notificationCount={3} />
      
      <div style={styles.container}>
        <div style={styles.messageListContainer}>
          <MessageList
            messages={mockMessages}
            selectedId={selectedId}
            onMessageClick={setSelectedId}
            onSearch={(q) => console.log('Search:', q)}
            onNewMessage={() => console.log('New message')}
            onNewGroup={() => console.log('New group')}
            onBrowseGroups={() => console.log('Browse groups')}
          />
        </div>
        
        <div style={styles.conversationContainer}>
          {selectedConversation ? (
            <>
              <div style={styles.conversationHeader}>
                <img 
                  src={selectedConversation.participant.avatarUrl} 
                  alt={selectedConversation.isGroup ? selectedConversation.groupName : selectedConversation.participant.name} 
                  style={styles.headerAvatar} 
                />
                <div style={styles.headerInfo}>
                  <div style={styles.headerName}>
                    {selectedConversation.isGroup ? selectedConversation.groupName : selectedConversation.participant.name}
                  </div>
                  <div style={styles.headerStatus}>
                    {selectedConversation.isGroup ? '12 members' : 'Active now'}
                  </div>
                </div>
              </div>
              
              <div style={styles.messagesArea}>
                {conversationMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    style={{
                      ...styles.messageRow,
                      ...(msg.isMine ? styles.messageRowMine : styles.messageRowTheirs),
                    }}
                  >
                    <div>
                      <div 
                        style={{
                          ...styles.messageBubble,
                          ...(msg.isMine ? styles.messageBubbleMine : styles.messageBubbleTheirs),
                        }}
                      >
                        {msg.text}
                      </div>
                      <div style={styles.messageTime}>{msg.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={styles.inputContainer}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  style={styles.input}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button style={styles.sendButton} onClick={handleSend}>Send</button>
              </div>
            </>
          ) : (
            <div style={styles.emptyState}>
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
