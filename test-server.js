const express = require('express');
const path = require('path');
const app = express();
const PORT = 8081;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Mock API endpoints for testing
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/v1/users/me', (req, res) => {
  res.json({ 
    id: 'test-user', 
    nickname: 'Test User',
    credits: 5 
  });
});

app.get('/api/v1/groups', (req, res) => {
  res.json([
    { id: 1, name: 'Test Group 1', type: 'official' },
    { id: 2, name: 'Test Group 2', type: 'created' }
  ]);
});

// Serve a basic HTML page for testing
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Glimpse Dating App - Test</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 20px; 
          max-width: 800px; 
          margin: 0 auto;
        }
        .nav-tabs { 
          display: flex; 
          gap: 10px; 
          margin: 20px 0; 
          border-bottom: 1px solid #ccc;
        }
        .nav-tabs button { 
          padding: 10px 20px; 
          border: none; 
          background: #f0f0f0; 
          cursor: pointer;
        }
        .nav-tabs button.active { 
          background: #007bff; 
          color: white; 
        }
        .screen { 
          display: none; 
          padding: 20px; 
        }
        .screen.active { 
          display: block; 
        }
        .content-item, .group-item { 
          border: 1px solid #ddd; 
          padding: 15px; 
          margin: 10px 0; 
          border-radius: 5px;
        }
        button { 
          padding: 8px 16px; 
          margin: 5px; 
          border: 1px solid #ccc; 
          background: white; 
          cursor: pointer;
        }
        button:hover { 
          background: #f0f0f0; 
        }
        input { 
          padding: 8px; 
          margin: 5px; 
          border: 1px solid #ccc; 
          border-radius: 3px;
        }
      </style>
    </head>
    <body>
      <div data-testid="auth-screen" id="auth-screen">
        <h1>Glimpse Dating App</h1>
        <div class="auth-form">
          <h2>로그인 / Login</h2>
          <input type="tel" placeholder="전화번호 / Phone Number" id="phone-input">
          <button onclick="handleAuth()">인증 / Login</button>
        </div>
      </div>

      <div id="main-app" style="display: none;">
        <nav class="nav-tabs">
          <button data-tab="home" onclick="showScreen('home')" class="active">Home / 홈</button>
          <button data-tab="groups" onclick="showScreen('groups')">Groups / 그룹</button>
          <button data-tab="matches" onclick="showScreen('matches')">Matches / 매치</button>
          <button data-tab="profile" onclick="showScreen('profile')">Profile / 프로필</button>
        </nav>

        <div id="home-screen" class="screen active" data-testid="home-screen">
          <h2>Home / 홈</h2>
          <div data-testid="content-list">
            <div class="content-item" data-testid="content-item">
              <h3>User Content 1</h3>
              <button onclick="handleLike(1)">좋아요 / Like</button>
            </div>
            <div class="content-item" data-testid="content-item">
              <h3>User Content 2</h3>
              <button onclick="handleLike(2)">좋아요 / Like</button>
            </div>
          </div>
        </div>

        <div id="groups-screen" class="screen" data-testid="groups-screen">
          <h2>Groups / 그룹</h2>
          <button onclick="showCreateGroup()" data-testid="create-group-btn">Create Group / 그룹 생성</button>
          <div data-testid="group-list">
            <div class="group-item" data-testid="group-item">
              <h3>Test Company Group</h3>
              <button onclick="joinGroup(1)">Join / 참여</button>
            </div>
            <div class="group-item" data-testid="group-item">
              <h3>Hobby Interest Group</h3>
              <button onclick="joinGroup(2)">Join / 참여</button>
            </div>
          </div>
        </div>

        <div id="matches-screen" class="screen" data-testid="matches-screen">
          <h2>Matches / 매치</h2>
          <div class="match-item">
            <h3>김소영 (Anonymous until matched)</h3>
            <button onclick="openChat(1)" data-testid="chat-btn">Chat / 채팅</button>
          </div>
        </div>

        <div id="profile-screen" class="screen" data-testid="profile-screen">
          <h2>Profile / 프로필</h2>
          <p>Credits: <span data-testid="credit-count">5</span></p>
          <button onclick="showPremium()">Premium / 프리미엄</button>
          <div>
            <input placeholder="Nickname / 닉네임" value="Test User">
            <button>Update / 업데이트</button>
          </div>
        </div>

        <div id="chat-screen" class="screen" data-testid="chat-screen" style="display: none;">
          <h2>Chat / 채팅</h2>
          <div data-testid="message-list" style="height: 300px; border: 1px solid #ccc; padding: 10px; overflow-y: auto;">
            <div class="message-bubble">Hello! / 안녕하세요!</div>
            <div class="message-bubble">How are you? / 어떻게 지내세요?</div>
          </div>
          <div>
            <input data-testid="message-input" placeholder="Type a message... / 메시지를 입력하세요..." style="width: 70%;">
            <button onclick="sendMessage()" data-testid="send-btn">Send / 전송</button>
          </div>
        </div>

        <div id="premium-screen" class="screen" style="display: none;">
          <h2>Premium Features / 프리미엄 기능</h2>
          <div data-testid="pricing-card" style="border: 1px solid #ddd; padding: 20px; margin: 10px;">
            <h3>Monthly / 월간</h3>
            <p>₩9,900</p>
            <ul>
              <li>무제한 좋아요 / Unlimited likes</li>
              <li>우선 매칭 / Priority matching</li>
              <li>읽음 표시 / Read receipts</li>
            </ul>
            <button onclick="handlePayment('monthly')">구매 / Purchase</button>
          </div>
          <div data-testid="pricing-card" style="border: 1px solid #ddd; padding: 20px; margin: 10px;">
            <h3>Yearly / 연간</h3>
            <p>₩99,000</p>
            <button onclick="handlePayment('yearly')">구매 / Purchase</button>
          </div>
        </div>
      </div>

      <script>
        let currentScreen = 'home';
        let authenticated = false;

        function handleAuth() {
          const phone = document.getElementById('phone-input').value;
          if (phone.length > 8) {
            document.getElementById('auth-screen').style.display = 'none';
            document.getElementById('main-app').style.display = 'block';
            authenticated = true;
          } else {
            alert('Please enter a valid phone number');
          }
        }

        function showScreen(screenName) {
          // Hide all screens
          document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
          });
          
          // Remove active class from tabs
          document.querySelectorAll('.nav-tabs button').forEach(b => {
            b.classList.remove('active');
          });
          
          // Show selected screen
          const screen = document.getElementById(screenName + '-screen');
          if (screen) {
            screen.classList.add('active');
            screen.style.display = 'block';
          }
          
          // Add active class to tab
          const tab = document.querySelector('[data-tab="' + screenName + '"]');
          if (tab) {
            tab.classList.add('active');
          }
          
          currentScreen = screenName;
        }

        function showCreateGroup() {
          const name = prompt('Group name / 그룹 이름:');
          if (name) {
            alert('Group created: ' + name);
          }
        }

        function joinGroup(id) {
          alert('Joined group ' + id);
        }

        function handleLike(id) {
          alert('Liked content ' + id);
          // Decrease credit count
          const creditElement = document.querySelector('[data-testid="credit-count"]');
          if (creditElement) {
            let credits = parseInt(creditElement.textContent);
            if (credits > 0) {
              creditElement.textContent = credits - 1;
            } else {
              alert('No credits remaining! Purchase more or upgrade to Premium.');
            }
          }
        }

        function openChat(id) {
          document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
          document.getElementById('chat-screen').style.display = 'block';
        }

        function sendMessage() {
          const input = document.querySelector('[data-testid="message-input"]');
          const messageList = document.querySelector('[data-testid="message-list"]');
          if (input.value.trim()) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message-bubble';
            messageDiv.textContent = input.value;
            messageList.appendChild(messageDiv);
            input.value = '';
            messageList.scrollTop = messageList.scrollHeight;
          }
        }

        function showPremium() {
          document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
          document.getElementById('premium-screen').style.display = 'block';
        }

        function handlePayment(plan) {
          alert('Payment initiated for ' + plan + ' plan');
          // Mock payment modal
          const modal = document.createElement('div');
          modal.setAttribute('data-testid', 'payment-modal');
          modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border: 1px solid #ccc; z-index: 1000;';
          modal.innerHTML = '<h3>결제 / Payment</h3><p>Processing payment for ' + plan + '...</p><button onclick="this.parentElement.remove()">Close</button>';
          document.body.appendChild(modal);
        }

        // Mock API calls
        async function mockApiCall(endpoint) {
          console.log('API call to:', endpoint);
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({ success: true, data: {} });
            }, 100);
          });
        }

        // Initialize app
        document.addEventListener('DOMContentLoaded', function() {
          console.log('Glimpse app initialized');
        });
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
});

module.exports = app;