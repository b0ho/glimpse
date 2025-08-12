const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Socket.IO 서버 설정
  const io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:8081"],
      methods: ["GET", "POST"]
    }
  });

  // Socket.IO 이벤트 핸들링
  io.on('connection', (socket) => {
    console.log('클라이언트 연결됨:', socket.id);

    // 채팅 메시지 처리
    socket.on('chat_message', (data) => {
      console.log('메시지 수신:', data);
      
      // 특정 채팅방의 모든 사용자에게 메시지 전송
      socket.to(data.matchId).emit('chat_message', {
        id: data.id,
        content: data.content,
        senderId: data.senderId,
        matchId: data.matchId,
        timestamp: new Date().toISOString(),
        isEncrypted: data.isEncrypted
      });
    });

    // 채팅방 입장
    socket.on('join_chat', (matchId) => {
      socket.join(matchId);
      console.log(`소켓 ${socket.id}이 매치 ${matchId}에 입장`);
    });

    // 채팅방 퇴장
    socket.on('leave_chat', (matchId) => {
      socket.leave(matchId);
      console.log(`소켓 ${socket.id}이 매치 ${matchId}에서 퇴장`);
    });

    // 타이핑 상태 처리
    socket.on('typing_start', (data) => {
      socket.to(data.matchId).emit('typing_start', {
        userId: data.userId,
        matchId: data.matchId
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(data.matchId).emit('typing_stop', {
        userId: data.userId,
        matchId: data.matchId
      });
    });

    // 연결 해제
    socket.on('disconnect', () => {
      console.log('클라이언트 연결 해제됨:', socket.id);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> NextJS + Socket.IO 서버 실행 중: http://${hostname}:${port}`);
    });
});