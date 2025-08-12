import { motion } from 'framer-motion';
import { Download, Play, Heart, Users, Shield } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* 배경 그라디언트 및 애니메이션 */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 animate-pulse" />
        <motion.div 
          className="absolute top-20 left-20 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl"
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className="absolute bottom-20 right-20 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl"
          animate={{ 
            x: [0, -80, 0],
            y: [0, 60, 0],
          }}
          transition={{ 
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-6 pt-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen py-20">
          {/* 왼쪽 컨텐츠 */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* 배지 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20"
            >
              <Shield className="w-4 h-4 text-primary-400" />
              <span className="text-sm font-medium text-white">완전 익명 보장</span>
            </motion.div>

            {/* 메인 타이틀 */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-5xl lg:text-7xl font-bold text-white leading-tight"
            >
              새로운 만남,{' '}
              <span className="gradient-text">안전하게</span>
            </motion.h1>

            {/* 서브타이틀 */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-xl text-slate-300 leading-relaxed max-w-lg"
            >
              회사, 대학, 취미 그룹 기반의 익명 매칭으로 
              진짜 연결을 만들어보세요. 프라이버시는 보장합니다.
            </motion.p>

            {/* 통계 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex items-center space-x-8"
            >
              <div className="text-center">
                <div className="flex items-center space-x-1">
                  <Users className="w-5 h-5 text-primary-400" />
                  <span className="text-2xl font-bold text-white">50K+</span>
                </div>
                <p className="text-sm text-slate-400">활성 사용자</p>
              </div>
              <div className="text-center">
                <div className="flex items-center space-x-1">
                  <Heart className="w-5 h-5 text-pink-400" />
                  <span className="text-2xl font-bold text-white">12K+</span>
                </div>
                <p className="text-sm text-slate-400">성공한 매칭</p>
              </div>
            </motion.div>

            {/* CTA 버튼들 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4"
            >
              <button className="btn-primary inline-flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <span>앱 다운로드</span>
              </button>
              <button className="btn-secondary inline-flex items-center space-x-2">
                <Play className="w-5 h-5" />
                <span>데모 보기</span>
              </button>
            </motion.div>

            {/* 신뢰성 지표 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex items-center space-x-6 text-sm text-slate-400"
            >
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span>SSL 보안</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span>GDPR 준수</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span>한국 서버</span>
              </div>
            </motion.div>
          </motion.div>

          {/* 오른쪽 앱 화면 모형 */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative flex justify-center lg:justify-end"
          >
            <div className="relative">
              {/* 폰 프레임 */}
              <div className="relative w-80 h-[600px] bg-slate-800 rounded-[3rem] p-4 shadow-2xl">
                <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-50 rounded-[2.5rem] overflow-hidden">
                  {/* 상단 노치 */}
                  <div className="h-6 bg-slate-900 rounded-b-2xl mx-20 mb-4" />
                  
                  {/* 앱 콘텐츠 영역 */}
                  <div className="px-6 space-y-4">
                    {/* 헤더 */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-800">Glimpse</h3>
                      <div className="w-8 h-8 bg-primary-500 rounded-full" />
                    </div>
                    
                    {/* 스토리 섹션 */}
                    <div className="flex space-x-3 overflow-x-auto pb-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex-shrink-0">
                          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full p-0.5">
                            <div className="w-full h-full bg-slate-300 rounded-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* 피드 카드들 */}
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-slate-300 rounded-full" />
                            <div className="flex-1">
                              <div className="h-3 bg-slate-300 rounded w-20 mb-1" />
                              <div className="h-2 bg-slate-200 rounded w-16" />
                            </div>
                          </div>
                          <div className="h-32 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl mb-3" />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Heart className="w-5 h-5 text-slate-400" />
                              <Users className="w-5 h-5 text-slate-400" />
                            </div>
                            <div className="h-2 bg-slate-200 rounded w-12" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 플로팅 카드들 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="absolute -left-8 top-20 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/20"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">안전 보장</p>
                    <p className="text-xs text-slate-600">익명성 유지</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1.4 }}
                className="absolute -right-12 bottom-32 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/20"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">새로운 매칭!</p>
                    <p className="text-xs text-slate-600">회사 동료와 연결</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;