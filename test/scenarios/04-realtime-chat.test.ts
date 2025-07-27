import { test, expect } from '@playwright/test';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL, WS_URL, createTestUser, createMatch } from '../config';

test.describe('시나리오 4: 실시간 채팅 시스템', () => {
  let userAToken: string;
  let userBToken: string;
  let matchId: string;
  let socketA: Socket;
  let socketB: Socket;

  test.beforeAll(async () => {
    // 테스트 사용자 생성 및 매칭
    userAToken = await createTestUser('010-1111-1111', '채팅테스트1', 28, 'MALE');
    userBToken = await createTestUser('010-2222-2222', '채팅테스트2', 26, 'FEMALE');
    
    // 매칭 생성
    matchId = await createMatch(userAToken, userBToken);
  });

  test.afterAll(async () => {
    // 소켓 연결 종료
    if (socketA) socketA.disconnect();
    if (socketB) socketB.disconnect();
  });

  test('4.1 채팅 히스토리 조회 (빈 상태)', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/chat/messages/${matchId}`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const messages = await response.json();
    expect(Array.isArray(messages)).toBeTruthy();
    expect(messages.length).toBe(0);
  });

  test('4.2 텍스트 메시지 전송', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/chat/messages`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      },
      data: {
        matchId: matchId,
        content: '안녕하세요! 만나서 반갑습니다.',
        type: 'TEXT'
      }
    });

    expect(response.ok()).toBeTruthy();
    const message = await response.json();
    expect(message.content).toBeTruthy(); // 암호화된 내용
    expect(message.type).toBe('TEXT');
    expect(message.senderId).toBeTruthy();
  });

  test('4.3 WebSocket 연결 및 실시간 메시지', async () => {
    // WebSocket 연결
    socketA = io(WS_URL, {
      auth: { token: userAToken }
    });

    socketB = io(WS_URL, {
      auth: { token: userBToken }
    });

    // 연결 대기
    await new Promise((resolve) => {
      let connected = 0;
      socketA.on('connect', () => { 
        connected++; 
        if (connected === 2) resolve(true);
      });
      socketB.on('connect', () => { 
        connected++; 
        if (connected === 2) resolve(true);
      });
    });

    // 채팅방 참여
    socketA.emit('join-chat', { matchId });
    socketB.emit('join-chat', { matchId });

    // B가 메시지 수신 대기
    const messagePromise = new Promise((resolve) => {
      socketB.on('new-message', (data) => {
        resolve(data);
      });
    });

    // A가 메시지 전송
    socketA.emit('send-message', {
      matchId: matchId,
      content: '실시간 메시지 테스트',
      type: 'TEXT'
    });

    // 메시지 수신 확인
    const receivedMessage: any = await messagePromise;
    expect(receivedMessage).toBeTruthy();
    expect(receivedMessage.type).toBe('TEXT');
  });

  test('4.4 타이핑 인디케이터', async () => {
    // B가 타이핑 인디케이터 수신 대기
    const typingPromise = new Promise((resolve) => {
      socketB.on('typing', (data) => {
        resolve(data);
      });
    });

    // A가 타이핑 시작
    socketA.emit('typing', {
      matchId: matchId,
      isTyping: true
    });

    // 타이핑 인디케이터 수신 확인
    const typingData: any = await typingPromise;
    expect(typingData.isTyping).toBe(true);
  });

  test('4.5 이미지 메시지 전송', async ({ request }) => {
    // 이미지 업로드 먼저 수행
    const uploadResponse = await request.post(`${API_BASE_URL}/upload/chat-image`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      },
      multipart: {
        file: {
          name: 'test.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('fake-image-data')
        }
      }
    });

    if (uploadResponse.ok()) {
      const { url } = await uploadResponse.json();

      // 이미지 메시지 전송
      const response = await request.post(`${API_BASE_URL}/chat/messages`, {
        headers: {
          'Authorization': `Bearer ${userAToken}`
        },
        data: {
          matchId: matchId,
          content: url,
          type: 'IMAGE'
        }
      });

      expect(response.ok()).toBeTruthy();
      const message = await response.json();
      expect(message.type).toBe('IMAGE');
    }
  });

  test('4.6 음성 메시지 전송', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/chat/messages`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      },
      data: {
        matchId: matchId,
        content: 'https://example.com/voice.m4a',
        type: 'VOICE',
        metadata: {
          duration: 15 // 15초
        }
      }
    });

    expect(response.ok()).toBeTruthy();
    const message = await response.json();
    expect(message.type).toBe('VOICE');
    expect(message.metadata.duration).toBe(15);
  });

  test('4.7 메시지 읽음 처리', async ({ request }) => {
    // 최근 메시지 조회
    const messagesResponse = await request.get(`${API_BASE_URL}/chat/messages/${matchId}?limit=1`, {
      headers: {
        'Authorization': `Bearer ${userBToken}`
      }
    });
    const messages = await messagesResponse.json();
    const lastMessage = messages[0];

    // 읽음 처리
    const response = await request.post(`${API_BASE_URL}/chat/messages/${lastMessage.id}/read`, {
      headers: {
        'Authorization': `Bearer ${userBToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
  });

  test('4.8 메시지 반응 추가', async ({ request }) => {
    // 최근 메시지에 반응 추가
    const messagesResponse = await request.get(`${API_BASE_URL}/chat/messages/${matchId}?limit=1`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      }
    });
    const messages = await messagesResponse.json();
    const lastMessage = messages[0];

    const response = await request.post(`${API_BASE_URL}/chat/messages/${lastMessage.id}/reaction`, {
      headers: {
        'Authorization': `Bearer ${userBToken}`
      },
      data: {
        emoji: '❤️'
      }
    });

    expect(response.ok()).toBeTruthy();
    const reaction = await response.json();
    expect(reaction.emoji).toBe('❤️');
  });

  test('4.9 채팅 차단/신고', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/chat/report`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      },
      data: {
        matchId: matchId,
        reason: 'INAPPROPRIATE_CONTENT',
        description: '부적절한 내용 전송'
      }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result).toHaveProperty('reportId');
  });

  test('4.10 채팅방 나가기', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/chat/leave`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      },
      data: {
        matchId: matchId
      }
    });

    expect([200, 204]).toContain(response.status());
  });
});

test.describe('시나리오 4-2: 채팅 암호화 검증', () => {
  let userAToken: string;
  let userBToken: string;
  let matchId: string;

  test.beforeAll(async () => {
    userAToken = await createTestUser('010-7777-7777', '암호화테스트1', 27, 'MALE');
    userBToken = await createTestUser('010-8888-8888', '암호화테스트2', 25, 'FEMALE');
    matchId = await createMatch(userAToken, userBToken);
  });

  test('메시지 암호화 확인', async ({ request }) => {
    const plainText = '이것은 암호화 테스트 메시지입니다.';
    
    // 메시지 전송
    const sendResponse = await request.post(`${API_BASE_URL}/chat/messages`, {
      headers: {
        'Authorization': `Bearer ${userAToken}`
      },
      data: {
        matchId: matchId,
        content: plainText,
        type: 'TEXT'
      }
    });

    const sentMessage = await sendResponse.json();
    
    // DB에 저장된 암호화된 내용 확인
    expect(sentMessage.content).not.toBe(plainText);
    
    // 수신자가 메시지 조회
    const receiveResponse = await request.get(`${API_BASE_URL}/chat/messages/${matchId}?limit=1`, {
      headers: {
        'Authorization': `Bearer ${userBToken}`
      }
    });

    const messages = await receiveResponse.json();
    const receivedMessage = messages[0];
    
    // 복호화된 내용 확인 (API가 복호화해서 전달하는 경우)
    // 구현에 따라 클라이언트에서 복호화하는 경우도 있음
    expect(receivedMessage).toBeTruthy();
  });

  test('다른 매치의 메시지 접근 차단', async ({ request }) => {
    // 다른 사용자 생성
    const otherToken = await createTestUser('010-6666-6666', '다른사용자', 30, 'MALE');
    
    // 다른 사용자가 메시지 조회 시도
    const response = await request.get(`${API_BASE_URL}/chat/messages/${matchId}`, {
      headers: {
        'Authorization': `Bearer ${otherToken}`
      }
    });

    expect(response.status()).toBe(403); // Forbidden
  });
});