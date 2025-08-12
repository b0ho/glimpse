import { motion } from 'framer-motion';
import { 
  Heart, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Github,
  Shield,
  FileText,
  Users
} from 'lucide-react';

const Footer = () => {
  const footerLinks = {
    product: [
      { name: '기능', href: '#features' },
      { name: '요금제', href: '#pricing' },
      { name: '보안', href: '#security' },
      { name: '업데이트', href: '#updates' }
    ],
    company: [
      { name: '회사 소개', href: '#about' },
      { name: '팀', href: '#team' },
      { name: '채용', href: '#careers' },
      { name: '언론 보도', href: '#press' }
    ],
    support: [
      { name: '도움말', href: '#help' },
      { name: '고객센터', href: '#support' },
      { name: '안전 가이드', href: '#safety' },
      { name: '신고하기', href: '#report' }
    ],
    legal: [
      { name: '개인정보처리방침', href: '#privacy' },
      { name: '이용약관', href: '#terms' },
      { name: '쿠키 정책', href: '#cookies' },
      { name: '법적 고지', href: '#legal' }
    ]
  };

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Github, href: '#', label: 'GitHub' }
  ];

  return (
    <footer className="bg-slate-900 text-white">
      {/* CTA 섹션 */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-secondary-500/20" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="relative container mx-auto px-6 py-20"
        >
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              지금 시작해보세요!
            </h2>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              수천 명이 이미 Glimpse를 통해 의미있는 만남을 만들고 있습니다. 
              당신도 지금 바로 시작해보세요.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
              <button className="btn-primary text-lg px-8 py-4">
                무료로 시작하기
              </button>
              <button className="btn-secondary text-lg px-8 py-4">
                앱 다운로드
              </button>
            </div>
            
            {/* 다운로드 배지 */}
            <div className="flex items-center justify-center space-x-4 mt-8">
              <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on App Store" className="h-12" />
              <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" className="h-12" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* 메인 푸터 */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-6 gap-8">
          {/* 로고 및 설명 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">Glimpse</span>
            </div>
            
            <p className="text-slate-400 leading-relaxed mb-6 max-w-sm">
              안전하고 의미있는 연결을 위한 익명 데이팅 플랫폼. 
              회사, 대학, 취미 그룹 기반으로 진짜 인연을 만나보세요.
            </p>

            {/* 연락처 정보 */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-slate-400">
                <Mail className="w-4 h-4" />
                <span>hello@glimpse.kr</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-slate-400">
                <Phone className="w-4 h-4" />
                <span>1588-1234</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-slate-400">
                <MapPin className="w-4 h-4" />
                <span>서울시 강남구 테헤란로 123</span>
              </div>
            </div>
          </motion.div>

          {/* 링크 섹션들 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <h4 className="font-semibold mb-4">제품</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-slate-400 hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <h4 className="font-semibold mb-4">회사</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-slate-400 hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <h4 className="font-semibold mb-4">고객지원</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-slate-400 hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <h4 className="font-semibold mb-4">법적사항</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-slate-400 hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* 소셜 미디어 및 추가 정보 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-16 pt-8 border-t border-slate-800"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            {/* 소셜 링크 */}
            <div className="flex items-center space-x-4">
              <span className="text-slate-400 text-sm">팔로우하기:</span>
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    aria-label={social.label}
                    className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>

            {/* 보안 인증 */}
            <div className="flex items-center space-x-6 text-slate-400 text-sm">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>SSL 보안</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>GDPR 준수</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>ISO 27001</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 저작권 */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-8 pt-8 border-t border-slate-800 text-center"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-sm text-slate-400">
            <div>
              © 2025 Glimpse. All rights reserved. | 사업자등록번호: 123-45-67890
            </div>
            <div className="flex items-center space-x-4">
              <span>대표이사: 김글림스</span>
              <span>•</span>
              <span>고객센터: 1588-1234</span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;