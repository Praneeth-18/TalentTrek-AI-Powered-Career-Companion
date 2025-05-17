import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader } from 'lucide-react';
import { ChatMessage } from './types';
import { VoiceRecorder } from './VoiceRecorder';
import { TextToSpeech } from './TextToSpeech';

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

interface DisplayMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, 
  onSendMessage,
  isLoading 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Convert API messages to display format
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    
    const formattedMessages = messages.map(msg => ({
      id: msg.message_id,
      sender: msg.role === 'user' ? 'user' : 'ai',
      text: msg.content,
      timestamp: new Date(msg.timestamp)
    }));
    
    setDisplayMessages(formattedMessages as DisplayMessage[]);
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isLoading) return;
    
    const messageTrimmed = inputValue.trim();
    setInputValue('');
    
    try {
      await onSendMessage(messageTrimmed);
    } catch (error) {
      console.error('Error sending message:', error);
      // Error handling is done in the parent component
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceTranscription = async (text: string) => {
    if (text.trim() === '' || isLoading) return;
    
    try {
      await onSendMessage(text);
    } catch (error) {
      console.error('Error sending voice message:', error);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-xl bg-white bg-opacity-5 backdrop-blur-md backdrop-filter border border-white/10 shadow-lg overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <h3 className="text-xl font-semibold text-white">Mock Interviewer</h3>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {displayMessages.map((message) => (
          <div 
            key={message.id} 
            className={`mb-4 ${message.sender === 'user' ? 'ml-12' : 'mr-12'}`}
          >
            <div 
              className={`rounded-2xl ${
                message.sender === 'user' 
                  ? 'bg-gradient-to-r from-blue-600/30 to-blue-400/30 ml-auto' 
                  : 'bg-gradient-to-r from-purple-600/30 to-purple-400/30'
              } backdrop-blur-sm border ${
                message.sender === 'user'
                  ? 'border-blue-500/20'
                  : 'border-purple-500/20'
              }`}
            >
              <p className="text-white p-4">{message.text}</p>
              
              {/* Add TTS for AI messages */}
              {message.sender === 'ai' && (
                <div className="flex justify-end p-2 pt-0">
                  <TextToSpeech text={message.text} />
                </div>
              )}
            </div>
            <div 
              className={`text-xs mt-1 text-gray-400 ${
                message.sender === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-white bg-opacity-5">
        <div className="flex rounded-lg overflow-hidden bg-white bg-opacity-10 backdrop-blur-sm border border-white/10">
          <input
            type="text"
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your response..."
            className="flex-1 bg-transparent px-4 py-2 text-white placeholder-white placeholder-opacity-50 focus:outline-none"
            disabled={isLoading || isRecording}
          />
          
          {/* Voice Recorder */}
          <div className="px-2 border-l border-white/10 flex items-center">
            <VoiceRecorder 
              onTranscription={handleVoiceTranscription} 
              isDisabled={isLoading}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            className="px-4 bg-blue-500 bg-opacity-20 hover:bg-opacity-30 transition-colors text-white"
            disabled={isLoading || isRecording || inputValue.trim() === ''}
          >
            {isLoading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};