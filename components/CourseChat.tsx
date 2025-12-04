import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { Message } from '../types';
import { sendMessage, subscribeToCourseMessages } from '../lib/messages';
import { AIInput } from './ui/ai-input';

interface CourseChatProps {
  courseId: string;
  courseName: string;
  userId: string;
  userName: string;
  userEmail: string;
  isInstructor: boolean;
}

const CourseChat: React.FC<CourseChatProps> = ({
  courseId,
  courseName,
  userId,
  userName,
  userEmail,
  isInstructor,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToCourseMessages(courseId, (msgs) => {
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [courseId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (message: string) => {
    if (!message || sending) {
      return;
    }

    setSending(true);
    
    const success = await sendMessage(
      courseId,
      userId,
      userName,
      userEmail,
      message,
      isInstructor
    );

    if (success) {
      setNewMessage('');
    }
    
    setSending(false);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return messageDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      });
    }
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    msgs.forEach(msg => {
      const dateKey = formatDate(msg.timestamp);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="bg-card border border-border rounded-xl shadow-card-custom flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Dúvidas e Discussões</h3>
            <p className="text-sm text-muted-foreground">{courseName}</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className={`overflow-y-auto p-6 space-y-6 ${expanded ? 'max-h-[600px]' : 'max-h-96'}`}>
        {Object.keys(messageGroups).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhuma mensagem ainda</p>
            <p className="text-sm text-muted-foreground mt-2">
              Seja o primeiro a fazer uma pergunta!
            </p>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-xs text-muted-foreground px-3 py-1 bg-secondary/50 rounded-full">
                  {date}
                </span>
                <div className="flex-1 h-px bg-border"></div>
              </div>

              {/* Messages for this date */}
              <div className="space-y-4">
                {msgs.map((message) => {
                  const isOwn = message.userId === userId;
                  const isInstructorMsg = message.isInstructor;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                        {!isOwn && (
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <span className={`text-xs font-medium ${isInstructorMsg ? 'text-primary' : 'text-muted-foreground'}`}>
                              {message.userName}
                              {isInstructorMsg && ' (Instrutor)'}
                            </span>
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            isOwn
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : isInstructorMsg
                              ? 'bg-orange-500/20 border border-primary/30 text-foreground rounded-bl-sm'
                              : 'bg-secondary/80 text-foreground rounded-bl-sm'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1 px-1">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-6 py-2 border-t border-border flex justify-end">
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-muted-foreground hover:text-foreground">
          {expanded ? 'Mostrar menos' : 'Mostrar mais'}
        </button>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <AIInput 
          onSubmit={handleSendMessage}
          placeholder="Type your question or comment..."
          disabled={sending}
        />
      </div>
    </div>
  );
};

export default CourseChat;
