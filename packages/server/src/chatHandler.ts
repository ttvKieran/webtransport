// Chat handler extension cho WebTransport server
// File này được include vào server để xử lý tin nhắn chat

interface ChatClient {
  id: string;
  stream: any;
}

// Lưu trữ tất cả clients đang kết nối
const connectedClients: Map<string, ChatClient> = new Map();
let clientIdCounter = 1;

// Broadcast message tới tất cả clients
async function broadcastMessage(message: string, excludeClientId?: string) {
  const encoder = new TextEncoder();
  const timestamp = new Date().toLocaleTimeString();
  const broadcastMsg = `[${timestamp}] ${message}`;
  
  console.log(`📢 Broadcasting to ${connectedClients.size} clients:`, message);

  const clientsToRemove: string[] = [];

  for (const [clientId, client] of connectedClients) {
    // Bỏ exclude để tất cả clients đều nhận được, bao gồm cả client gửi
    // if (excludeClientId && clientId === excludeClientId) {
    //   continue; // Không gửi lại cho client gửi tin nhắn
    // }

    try {
      if (client.stream && client.stream.writable) {
        const writer = client.stream.writable.getWriter();
        await writer.write(encoder.encode(broadcastMsg));
        writer.releaseLock(); // Quan trọng: phải release lock
        console.log(`✅ Sent to client ${clientId}`);
      }
    } catch (error) {
      console.error(`❌ Failed to send to client ${clientId}:`, error);
      // Đánh dấu để xóa client bị lỗi
      clientsToRemove.push(clientId);
    }
  }

  // Xóa các clients bị lỗi
  clientsToRemove.forEach(clientId => {
    connectedClients.delete(clientId);
    console.log(`🗑️ Removed failed client: ${clientId}`);
  });
}

export function setupChatHandler(session: any) {
  const clientId = `client_${clientIdCounter++}`;
  console.log(`🚀 Setting up chat handler for ${clientId}`);

  session.ready.then(async () => {
    try {
      console.log(`📡 Waiting for incoming bidirectional streams from ${clientId}`);

      // Lắng nghe incoming bidirectional streams từ client
      const bidiReader = session.incomingBidirectionalStreams.getReader();
      
      const handleIncomingStreams = async () => {
        try {
          while (true) {
            const { done, value: chatStream } = await bidiReader.read();
            if (done) break;

            console.log(`💬 Received chat stream from ${clientId}`);

            // Lắng nghe tin nhắn từ client trên stream này
            const reader = chatStream.readable.getReader();
            const decoder = new TextDecoder();
            const encoder = new TextEncoder();

            // Thêm client vào danh sách
            const client: ChatClient = {
              id: clientId,
              stream: chatStream
            };
            connectedClients.set(clientId, client);

            // Thông báo client mới join
            await broadcastMessage(`🟢 ${clientId} joined the chat`);
            
            // Gửi welcome message cho client mới
            const welcomeMsg = `Welcome to WebTransport Chat! You are ${clientId}. There are ${connectedClients.size} users online.`;
            const writer = chatStream.writable.getWriter();
            await writer.write(encoder.encode(`[System] ${welcomeMsg}`));
            writer.releaseLock();

            const readMessages = async () => {
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) {
                    console.log(`📪 Chat stream closed for ${clientId}`);
                    break;
                  }

                  const messageStr = decoder.decode(value);
                  console.log(`📨 Received from ${clientId}:`, messageStr);

                  // Broadcast tin nhắn tới tất cả clients, bao gồm cả client gửi
                  const chatMessage = `${clientId}: ${messageStr}`;
                  await broadcastMessage(chatMessage); // Bỏ exclude parameter
                }
              } catch (error) {
                console.error(`❌ Error in chat handler for ${clientId}:`, error);
              } finally {
                // Cleanup khi client disconnect
                connectedClients.delete(clientId);
                
                // Thông báo client rời khỏi chat
                await broadcastMessage(`🔴 ${clientId} left the chat`);
                console.log(`👋 ${clientId} disconnected. ${connectedClients.size} clients remaining.`);
              }
            };

            readMessages();
          }
        } catch (error) {
          console.error(`❌ Error handling incoming streams for ${clientId}:`, error);
        }
      };

      handleIncomingStreams();

    } catch (error) {
      console.error(`❌ Failed to setup chat handler for ${clientId}:`, error);
    }
  }).catch((error: any) => {
    console.error(`❌ Session not ready for ${clientId}:`, error);
  });
}