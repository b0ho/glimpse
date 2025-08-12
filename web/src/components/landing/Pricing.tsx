import { motion } from 'framer-motion';
import { Check, Zap, Crown, Heart, Users, MessageCircle, Shield, Star } from 'lucide-react';

const Pricing = () => {
  const plans = [
    {
      name: "Free",
      price: "0",
      period: "무료",
      description: "기본 기능으로 시작해보세요",
      icon: Users,
      color: "from-slate-500 to-slate-600",
      features: [
        "일일 좋아요 1개",
        "기본 매칭 기능",
        "그룹 참여 (3개까지)",
        "기본 채팅 기능",
        "프로필 작성",
        "안전한 익명 시스템"
      ],
      limitations: [
        "프리미엄 매칭 제한",
        "고급 필터 사용 불가",
        "좋아요 받은 사람 확인 불가"
      ]
    },
    {
      name: "Premium",
      price: "9,900",
      period: "월",
      description: "가장 인기있는 요금제",
      icon: Crown,
      color: "from-primary-500 to-secondary-500",
      popular: true,
      features: [
        "무제한 좋아요",
        "좋아요 받은 사람 확인",
        "우선 매칭 시스템",
        "고급 필터 (나이, 직업, 취미)",
        "무제한 그룹 참여",
        "프리미엄 채팅 기능",
        "좋아요 되돌리기",
        "슈퍼 좋아요 (월 5개)",
        "읽음 표시",
        "온라인 상태 표시",
        "프리미엄 배지",
        "우선 고객지원"
      ],
      savings: "년간 결제시 17% 할인!"
    },
    {
      name: "Credits",
      price: "2,500",
      period: "5개",
      description: "필요할 때만 구매하세요",
      icon: Zap,
      color: "from-orange-500 to-red-500",
      features: [
        "좋아요 5개 추가",
        "슈퍼 좋아요 1개 포함",
        "24시간 부스트 기능",
        "프리미엄 필터 1일 체험",
        "유효기간 30일",
        "언제든지 사용 가능"
      ],
      note: "10개(4,500원), 25개(9,900원), 50개(17,900원) 패키지 제공"
    }
  ];

  const faqs = [
    {
      question: "언제든지 취소할 수 있나요?",
      answer: "네, 프리미엄 구독은 언제든지 취소할 수 있습니다. 취소 시 현재 구독 기간이 끝날 때까지 서비스를 계속 이용할 수 있어요."
    },
    {
      question: "결제는 안전한가요?",
      answer: "모든 결제는 국내 주요 PG사(토스페이, 카카오페이)를 통해 처리되며, SSL 암호화로 안전하게 보호됩니다."
    },
    {
      question: "크레딧은 어떻게 사용하나요?",
      answer: "크레딧으로 추가 좋아요를 보낼 수 있고, 슈퍼 좋아요나 부스트 기능을 사용할 수 있습니다. 유효기간은 30일입니다."
    }
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-6">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
            당신에게 <span className="gradient-text">딱 맞는</span> 요금제
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            무료로 시작해서 필요에 따라 업그레이드하세요. 
            모든 요금제에서 완전한 익명성과 보안을 보장합니다.
          </p>
        </motion.div>

        {/* 요금제 카드들 */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative bg-white rounded-3xl p-8 shadow-sm border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${
                  plan.popular 
                    ? 'border-primary-500 shadow-primary-500/20' 
                    : 'border-slate-200'
                }`}
              >
                {/* 인기 배지 */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span>가장 인기</span>
                    </div>
                  </div>
                )}

                {/* 플랜 헤더 */}
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">{plan.name}</h3>
                  <p className="text-slate-600">{plan.description}</p>
                  
                  <div className="mt-6">
                    <div className="flex items-end justify-center space-x-1">
                      <span className="text-4xl font-bold text-slate-800">₩{plan.price}</span>
                      <span className="text-slate-600 pb-1">/{plan.period}</span>
                    </div>
                    {plan.savings && (
                      <p className="text-sm text-primary-600 font-medium mt-2">{plan.savings}</p>
                    )}
                    {plan.note && (
                      <p className="text-xs text-slate-500 mt-2">{plan.note}</p>
                    )}
                  </div>
                </div>

                {/* 기능 목록 */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3">
                      <div className={`flex-shrink-0 w-5 h-5 bg-gradient-to-br ${plan.color} rounded-full flex items-center justify-center`}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-slate-700">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.limitations?.map((limitation, limitIndex) => (
                    <div key={limitIndex} className="flex items-center space-x-3 opacity-50">
                      <div className="flex-shrink-0 w-5 h-5 bg-slate-300 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">✕</span>
                      </div>
                      <span className="text-slate-500 line-through">{limitation}</span>
                    </div>
                  ))}
                </div>

                {/* CTA 버튼 */}
                <button className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:scale-105 shadow-lg hover:shadow-primary-500/30'
                    : index === 0
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:scale-105'
                }`}>
                  {index === 0 ? '무료 시작하기' : index === 1 ? '프리미엄 시작하기' : '크레딧 구매하기'}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* 추가 혜택 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-8 md:p-12 mb-16"
        >
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-white mb-4">모든 요금제 공통 혜택</h3>
            <p className="text-slate-300 text-lg">Glimpse의 모든 사용자가 누리는 기본 혜택들</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: "완전한 익명성", desc: "매칭 전까지 신원 보호" },
              { icon: MessageCircle, title: "안전한 채팅", desc: "실시간 암호화 통신" },
              { icon: Users, title: "그룹 기반 매칭", desc: "회사/대학/취미 그룹" },
              { icon: Heart, title: "24/7 고객지원", desc: "언제든지 도움 요청" }
            ].map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl mb-3">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-white mb-1">{benefit.title}</h4>
                  <p className="text-sm text-slate-300">{benefit.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* FAQ 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <h3 className="text-3xl font-bold text-center text-slate-800 mb-8">자주 묻는 질문</h3>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
              >
                <h4 className="font-semibold text-slate-800 mb-3">{faq.question}</h4>
                <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;