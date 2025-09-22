import { useEffect, useRef, useState } from 'react';

interface ChatMessage {
  id: string;
  message: string;
  timestamp: number;
  sender: 'user' | 'server';
}

interface ChatDemoProps {
  transport: WebTransport | null;
  isConnected: boolean;
}

function ChatDemo({ transport, isConnected }: ChatDemoProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatStream, setChatStream] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdCounter = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!transport || !isConnected) {
      setChatStream(null);
      return;
    }

    // Tạo bidirectional stream cho chat
    const setupChatStream = async () => {
      try {
        const stream = await transport.createBidirectionalStream();
        setChatStream(stream);

        // Lắng nghe tin nhắn từ server
        const reader = stream.readable.getReader();
        const decoder = new TextDecoder();

        const readMessages = async () => {
          console.log('🎧 Started listening for messages from server');
          try {
            while (true) {
              console.log('⏳ Waiting for message from server...');
              const { done, value } = await reader.read();
              if (done) {
                console.log('📪 Server stream closed');
                break;
              }

              const messageStr = decoder.decode(value);
              console.log('📨 Received from server:', messageStr);
              
              // Thêm tin nhắn từ server (có thể là từ user khác hoặc system message)
              const newMessage: ChatMessage = {
                id: `msg_${messageIdCounter.current++}`,
                message: messageStr, // Không thêm prefix, hiển thị tin nhắn gốc
                timestamp: Date.now(),
                sender: 'server'
              };
              
              setMessages(prev => {
                console.log('💾 Adding message to UI:', messageStr);
                return [...prev, newMessage];
              });
            }
          } catch (error) {
            console.error('❌ Error reading chat messages:', error);
          }
        };

        readMessages();
      } catch (error) {
        console.error('Failed to create chat stream:', error);
      }
    };

    setupChatStream();
  }, [transport, isConnected]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !chatStream || !isConnected || isSending) {
      return;
    }

    setIsSending(true);
    try {
      // Tạm thời disable button để tránh spam
      const messageToSend = inputMessage.trim();
      setInputMessage('');

      // Gửi tin nhắn đến server
      const writer = chatStream.writable.getWriter();
      const encoder = new TextEncoder();
      await writer.write(encoder.encode(messageToSend));
      writer.releaseLock();

      console.log('✅ Message sent successfully:', messageToSend);
    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Khôi phục tin nhắn nếu gửi thất bại
      setInputMessage(inputMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-white">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        💬 WebTransport Chat Demo
        <span className={`ml-2 px-2 py-1 rounded text-xs ${
          isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </h3>
      
      {/* Chat messages area */}
      <div className="h-60 overflow-y-auto mb-4 border border-gray-200 rounded p-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center text-sm">
            {isConnected ? 'No messages yet. Send a message below!' : 'Connect to start chatting'}
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map(message => {
              // Kiểm tra xem có phải system message không
              const isSystemMessage = message.message.startsWith('[System]') || 
                                    message.message.includes('joined the chat') || 
                                    message.message.includes('left the chat');
              
              if (isSystemMessage) {
                // Hiển thị system message ở giữa
                return (
                  <div key={message.id} className="flex justify-center">
                    <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs">
                      {message.message}
                    </div>
                  </div>
                );
              }

              return (
                <div key={message.id} className="flex justify-start">
                  <div className="bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm max-w-xs">
                    <div className="text-gray-800">{message.message}</div>
                    <div className="text-xs mt-1 text-gray-500">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isConnected ? "Type your message..." : "Connect to chat"}
          disabled={!isConnected}
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
        />
        <button
          onClick={sendMessage}
          disabled={!isConnected || !inputMessage.trim() || isSending}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        💡 This demo uses WebTransport bidirectional streams for real-time messaging
      </div>
    </div>
  );
}

export default ChatDemo;