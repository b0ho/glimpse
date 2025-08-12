import { motion } from 'framer-motion';
import { Quote, Star, Heart, Briefcase, GraduationCap, Coffee } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      name: "김지은",
      role: "마케팅 매니저",
      company: "테크 스타트업",
      content: "회사 동료들과 자연스럽게 만날 수 있어서 정말 좋아요. 익명으로 시작해서 부담 없이 대화할 수 있고, 진짜 잘 맞는 사람을 만났어요!",
      rating: 5,
      icon: Briefcase,
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      name: "박민수",
      role: "소프트웨어 개발자",
      company: "서울대학교 졸업",
      content: "대학 동문들과 연결되는 기능이 정말 마음에 들어요. 공통 관심사가 많아서 대화가 자연스럽게 이어지고, 안전하다는 느낌이 들어요.",
      rating: 5,
      icon: GraduationCap,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      name: "이수진",
      role: "카페 사장",
      company: "취미: 등산, 요리",
      content: "취미 기반 매칭이 정말 좋네요. 같은 등산 동호회 사람들과 만나서 실제로 같이 산에도 가고, 자연스럽게 친해졌어요. 진짜 추천해요!",
      rating: 5,
      icon: Coffee,
      gradient: "from-orange-500 to-red-500"
    }
  ];

  const reviews = [
    { rating: 5, count: 2847, percentage: 78 },
    { rating: 4, count: 624, percentage: 17 },
    { rating: 3, count: 156, percentage: 4 },
    { rating: 2, count: 23, percentage: 1 },
    { rating: 1, count: 8, percentage: 0 }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            실제 사용자들의 <span className="gradient-text">진솔한 후기</span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            수천 명의 사용자가 Glimpse를 통해 의미있는 연결을 만들고 있습니다.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* 리뷰 통계 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:col-span-1 space-y-6"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-white mb-2">4.8</div>
                <div className="flex items-center justify-center space-x-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-300">3,658개의 리뷰 기준</p>
              </div>

              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.rating} className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 w-16">
                      <span className="text-sm text-slate-300">{review.rating}</span>
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    </div>
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
                        style={{ width: `${review.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-12 text-right">
                      {review.count}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex items-center justify-center space-x-2 text-green-400">
                  <Heart className="w-4 h-4" />
                  <span className="text-sm font-medium">95% 재방문율</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 사용자 후기들 */}
          <div className="lg:col-span-2 space-y-6">
            {testimonials.map((testimonial, index) => {
              const Icon = testimonial.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 card-hover"
                >
                  <div className="flex items-start space-x-4">
                    {/* 아바타 */}
                    <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${testimonial.gradient} rounded-full flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      {/* 헤더 */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-white">{testimonial.name}</h4>
                          <p className="text-sm text-slate-400">{testimonial.role}</p>
                          <p className="text-xs text-slate-500">{testimonial.company}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                          ))}
                        </div>
                      </div>
                      
                      {/* 인용 아이콘 */}
                      <Quote className="w-6 h-6 text-primary-400 mb-2" />
                      
                      {/* 후기 내용 */}
                      <p className="text-slate-300 leading-relaxed">
                        {testimonial.content}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 추가 신뢰 지표 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <div className="text-3xl font-bold text-white mb-2">50K+</div>
            <p className="text-sm text-slate-400">활성 사용자</p>
          </div>
          <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <div className="text-3xl font-bold text-white mb-2">12K+</div>
            <p className="text-sm text-slate-400">성공한 매칭</p>
          </div>
          <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <div className="text-3xl font-bold text-white mb-2">1,500+</div>
            <p className="text-sm text-slate-400">등록 회사</p>
          </div>
          <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <div className="text-3xl font-bold text-white mb-2">300+</div>
            <p className="text-sm text-slate-400">대학 인증</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;