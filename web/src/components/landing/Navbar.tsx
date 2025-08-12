import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Menu, X, Download } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: '기능', href: '#features' },
    { name: '후기', href: '#testimonials' },
    { name: '요금제', href: '#pricing' },
    { name: '고객지원', href: '#support' }
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/90 backdrop-blur-sm border-b border-slate-200' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <motion.div 
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className={`text-xl font-bold ${isScrolled ? 'text-slate-800' : 'text-white'}`}>
              Glimpse
            </span>
          </motion.div>

          {/* 데스크톱 메뉴 */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link, index) => (
              <motion.a
                key={index}
                href={link.href}
                className={`font-medium transition-colors hover:text-primary-500 ${
                  isScrolled ? 'text-slate-600' : 'text-slate-300'
                }`}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {link.name}
              </motion.a>
            ))}
          </div>

          {/* CTA 버튼 */}
          <div className="hidden md:flex items-center space-x-4">
            <motion.button
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isScrolled 
                  ? 'text-slate-600 hover:text-slate-800' 
                  : 'text-slate-300 hover:text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              로그인
            </motion.button>
            <motion.button
              className="btn-primary inline-flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download className="w-4 h-4" />
              <span>앱 다운로드</span>
            </motion.button>
          </div>

          {/* 모바일 메뉴 버튼 */}
          <motion.button
            className={`md:hidden p-2 rounded-lg ${
              isScrolled ? 'text-slate-600' : 'text-white'
            }`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>
        </div>

        {/* 모바일 메뉴 */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ 
            opacity: isMobileMenuOpen ? 1 : 0, 
            height: isMobileMenuOpen ? 'auto' : 0 
          }}
          transition={{ duration: 0.3 }}
          className="md:hidden overflow-hidden bg-white/95 backdrop-blur-sm border-t border-slate-200"
        >
          <div className="py-4 space-y-3">
            {navLinks.map((link, index) => (
              <motion.a
                key={index}
                href={link.href}
                className="block px-4 py-2 text-slate-600 font-medium hover:text-primary-500 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                {link.name}
              </motion.a>
            ))}
            <div className="px-4 pt-4 space-y-3 border-t border-slate-200">
              <button className="w-full text-left py-2 text-slate-600 font-medium">
                로그인
              </button>
              <button className="w-full btn-primary justify-center">
                <Download className="w-4 h-4 mr-2" />
                앱 다운로드
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
};

export default Navbar;