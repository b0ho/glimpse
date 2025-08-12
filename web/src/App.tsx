import { useState, useEffect } from 'react';

function App() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-blue-600 relative overflow-hidden">
      {/* 배경 애니메이션 요소들 */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-40 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-500"></div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className={`relative z-10 min-h-screen flex flex-col transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        
        {/* 헤더 */}
        <header className="pt-8 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <span className="text-2xl">💝</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Glimpse</h1>
                <p className="text-white/60 text-sm">익명 데이팅 앱</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-white/80 hover:text-white transition-colors">기능</a>
              <a href="#testimonials" className="text-white/80 hover:text-white transition-colors">후기</a>
              <a href="#download" className="text-white/80 hover:text-white transition-colors">다운로드</a>
              <button className="bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-full border border-white/30 hover:bg-white/30 transition-all">
                로그인
              </button>
            </nav>
          </div>
        </header>

        {/* 히어로 섹션 */}
        <main className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="max-w-6xl mx-auto text-center">
            <div className="mb-8">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20 mb-8">
                <span className="text-yellow-300">✨</span>
                <span className="text-white/90 font-medium">완전히 새로운 만남의 방식</span>
                <span className="text-yellow-300">⭐</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                익명으로 시작하는
                <br />
                <span className="bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                  진정한 만남
                </span>
              </h1>
              
              <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed mb-12">
                회사, 대학교, 취미 그룹에서 시작하는 완전 익명 데이팅. 
                <br className="hidden md:block" />
                서로의 진정한 모습을 알아가며 자연스럽게 연결되는 새로운 경험을 만나보세요.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                <button className="group bg-gradient-to-r from-pink-500 to-violet-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg flex items-center space-x-3 hover:shadow-2xl hover:shadow-pink-500/25 transform hover:scale-105 transition-all duration-300">
                  <span>📱</span>
                  <span>앱 다운로드</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
                
                <button className="group bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-semibold text-lg flex items-center space-x-3 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <span>▶️</span>
                  <span>데모 보기</span>
                </button>
              </div>
            </div>
            
            {/* 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="text-4xl font-bold text-white mb-2">15K+</div>
                <div className="text-white/70">활성 사용자</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="text-4xl font-bold text-white mb-2">3.4K</div>
                <div className="text-white/70">성공적인 매칭</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="text-4xl font-bold text-white mb-2">4.8★</div>
                <div className="text-white/70">평균 평점</div>
              </div>
            </div>
          </div>
        </main>

        {/* 특징 섹션 */}
        <section id="features" className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                왜 <span className="bg-gradient-to-r from-pink-300 to-violet-300 bg-clip-text text-transparent">Glimpse</span>인가?
              </h2>
              <p className="text-xl text-white/70 max-w-2xl mx-auto">
                기존 데이팅 앱과는 완전히 다른 접근 방식으로 진정한 연결을 만들어갑니다
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-violet-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🛡️</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">🎭 완전 익명</h3>
                <p className="text-white/70 leading-relaxed">
                  매칭이 성사되기 전까지는 완전한 익명으로 상호작용. 외모나 선입견 없이 진정한 마음으로 소통하세요.
                </p>
              </div>
              
              <div className="group bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">👥</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">🏢 그룹 기반</h3>
                <p className="text-white/70 leading-relaxed">
                  회사, 대학교, 취미 그룹 내에서 만나기 때문에 더 안전하고 자연스러운 만남이 가능합니다.
                </p>
              </div>
              
              <div className="group bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">💬</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">💬 안전한 채팅</h3>
                <p className="text-white/70 leading-relaxed">
                  종단간 암호화로 보호되는 안전한 메시징. 개인정보는 철저히 보호하면서 깊은 대화를 나누세요.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 후기 섹션 */}
        <section id="testimonials" className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                사용자들의 <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">진솔한 후기</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-violet-400 rounded-full flex items-center justify-center text-white font-bold">
                    김
                  </div>
                  <div className="ml-4">
                    <div className="font-semibold text-white">김서연</div>
                    <div className="text-white/60 text-sm">네이버 직원</div>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">⭐</span>
                  ))}
                </div>
                <p className="text-white/80">
                  "같은 회사 사람들과 자연스럽게 만날 수 있어서 좋았어요. 익명으로 시작해서 부담이 적었습니다!"
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold">
                    박
                  </div>
                  <div className="ml-4">
                    <div className="font-semibold text-white">박민준</div>
                    <div className="text-white/60 text-sm">연세대 학생</div>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">⭐</span>
                  ))}
                </div>
                <p className="text-white/80">
                  "대학교 그룹에서 만난 사람과 현재 6개월째 만나고 있어요. 진짜 좋은 앱입니다!"
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                    이
                  </div>
                  <div className="ml-4">
                    <div className="font-semibold text-white">이지은</div>
                    <div className="text-white/60 text-sm">스타트업 직원</div>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">⭐</span>
                  ))}
                </div>
                <p className="text-white/80">
                  "익명으로 시작해서 진정한 대화를 나눌 수 있었어요. 다른 앱들과는 차원이 다릅니다."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 다운로드 섹션 */}
        <section id="download" className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 border border-white/20">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                지금 바로 <span className="bg-gradient-to-r from-pink-300 to-violet-300 bg-clip-text text-transparent">시작하세요!</span>
              </h2>
              <p className="text-xl text-white/70 mb-8">
                새로운 만남이 당신을 기다리고 있습니다
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <button className="group bg-gradient-to-r from-pink-500 to-violet-500 text-white px-10 py-4 rounded-2xl font-semibold text-lg flex items-center space-x-3 hover:shadow-2xl hover:shadow-pink-500/25 transform hover:scale-105 transition-all duration-300">
                  <span>🍎</span>
                  <span>App Store에서 다운로드</span>
                </button>
                
                <button className="group bg-gradient-to-r from-green-500 to-blue-500 text-white px-10 py-4 rounded-2xl font-semibold text-lg flex items-center space-x-3 hover:shadow-2xl hover:shadow-green-500/25 transform hover:scale-105 transition-all duration-300">
                  <span>🤖</span>
                  <span>Google Play에서 다운로드</span>
                </button>
              </div>
              
              <div className="flex items-center justify-center space-x-8 text-white/60">
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">✅</span>
                  <span>무료 다운로드</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">✅</span>
                  <span>안전한 앱</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">✅</span>
                  <span>개인정보 보호</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="py-12 px-6 border-t border-white/10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-3 mb-6 md:mb-0">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                  <span className="text-xl">💝</span>
                </div>
                <div>
                  <div className="font-bold text-white">Glimpse</div>
                  <div className="text-white/60 text-sm">익명 데이팅 앱</div>
                </div>
              </div>
              
              <div className="flex space-x-6 text-white/60">
                <a href="#" className="hover:text-white transition-colors">이용약관</a>
                <a href="#" className="hover:text-white transition-colors">개인정보처리방침</a>
                <a href="#" className="hover:text-white transition-colors">고객지원</a>
                <a href="#" className="hover:text-white transition-colors">문의하기</a>
              </div>
            </div>
            
            <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/50">
              <p>&copy; 2024 Glimpse. 모든 권리 보유.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;