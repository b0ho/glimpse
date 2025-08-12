import { motion } from 'framer-motion';
import { 
  Shield, 
  Users, 
  MessageCircle, 
  Zap, 
  Lock, 
  Heart,
  Building,
  GraduationCap,
  MapPin
} from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Shield,
      title: "완전한 익명성",
      description: "매칭이 성사되기 전까지는 서로의 신원이 완전히 보호됩니다. 안전하고 자유로운 소통이 가능해요.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Building,
      title: "회사 기반 매칭",
      description: "같은 직장이나 업계 동료들과 자연스럽게 만날 수 있습니다. 공통 관심사로 더 깊은 연결을 만들어요.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: GraduationCap,
      title: "대학 네트워킹",
      description: "같은 대학교 선후배, 동문들과 연결됩니다. 학교 인증을 통해 신뢰할 수 있는 만남을 보장해요.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Users,
      title: "취미 그룹 매칭",
      description: "공통 취미나 관심사를 가진 사람들과 만날 수 있습니다. 자연스러운 대화 주제로 편안한 만남이 가능해요.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: MessageCircle,
      title: "안전한 실시간 채팅",
      description: "매칭 후 실시간 암호화 채팅으로 안전하게 대화하세요. 개인정보 유출 걱정 없이 소통할 수 있어요.",
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: MapPin,
      title: "위치 기반 서비스",
      description: "주변 지역의 그룹에 참여하거나 위치 기반 이벤트를 통해 가까운 사람들과 만날 수 있어요.",
      color: "from-teal-500 to-green-500"
    }
  ];

  const stats = [
    { label: "활성 사용자", value: "50,000+", icon: Users },
    { label: "성공한 매칭", value: "12,000+", icon: Heart },
    { label: "안전한 대화", value: "99.9%", icon: Shield },
    { label: "사용자 만족도", value: "4.8★", icon: Zap }
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
            왜 <span className="gradient-text">Glimpse</span>일까요?
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            기존 데이팅 앱의 한계를 넘어, 진정한 연결을 위한 새로운 방식을 제공합니다.
            안전하고 의미있는 만남을 경험해보세요.
          </p>
        </motion.div>

        {/* 통계 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200 card-hover"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* 기능 그리드 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 card-hover"
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl mb-6`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* 보안 강조 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-20 bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-8 md:p-12"
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">엔터프라이즈급 보안</h3>
              </div>
              
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                은행 수준의 암호화와 GDPR 준수로 여러분의 개인정보를 안전하게 보호합니다. 
                모든 데이터는 한국 서버에서 처리되어 더욱 안심할 수 있어요.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-sm text-slate-300">AES-256 암호화</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-sm text-slate-300">2FA 인증</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-sm text-slate-300">GDPR 완전 준수</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-sm text-slate-300">한국 데이터센터</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-slate-700 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400 font-mono">HTTPS</span>
                  </div>
                </div>
                
                <div className="space-y-2 font-mono text-sm">
                  <div className="text-green-400">✓ SSL Certificate Valid</div>
                  <div className="text-green-400">✓ Data Encryption Active</div>
                  <div className="text-green-400">✓ Anonymous Mode Enabled</div>
                  <div className="text-green-400">✓ Korea Server Connected</div>
                  <div className="text-slate-400">  Response Time: 15ms</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;