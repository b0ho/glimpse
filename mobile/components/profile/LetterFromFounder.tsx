/**
 * LetterFromFounder 컴포넌트 (StyleSheet 버전)
 *
 * @module LetterFromFounder
 * @description 프로필 화면에서 창업자의 편지를 보여주는 인터랙티브 카드 및 모달 컴포넌트 (StyleSheet 스타일링 적용)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * LetterFromFounder Props 인터페이스
 *
 * @interface LetterFromFounderProps
 */
interface LetterFromFounderProps {
  /** 카드 클릭 시 실행될 선택적 핸들러 */
  onPress?: () => void;
}

/**
 * LetterFromFounder 컴포넌트
 *
 * @component
 * @param {LetterFromFounderProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 창업자 편지 카드 및 모달 UI
 *
 * @description
 * 프로필 화면에 표시되는 그라디언트 카드로, 클릭하면 창업자의 편지를 전체 화면 모달로 보여줍니다. (StyleSheet 버전)
 * - 그라디언트 배경의 인터랙티브 카드
 * - BlurView 배경의 편지 모달
 * - 한국어/영어 번역 지원
 * - 데코레이션 요소 (스탬프, 하트 등)
 * - 스크롤 가능한 편지 내용
 * - 반응형 디자인 (화면 크기에 맞춤)
 *
 * @example
 * ```tsx
 * <LetterFromFounder onPress={() => console.log('Letter opened')} />
 * ```
 *
 * @category Component
 * @subcategory Profile
 */
export const LetterFromFounder: React.FC<LetterFromFounderProps> = ({ onPress }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { t } = useAndroidSafeTranslation();

  /** 카드 클릭 핸들러 - 모달 열기 */
  const handlePress = () => {
    setIsModalVisible(true);
    onPress?.();
  };

  /** 모달 닫기 핸들러 */
  const closeModal = () => {
    setIsModalVisible(false);
  };

  const letterContent = {
    ko: {
      greeting: "안녕하세요, Glimpse 사용자 여러분 💜",
      intro: "이 작은 편지를 통해 여러분께 진심 어린 감사의 마음을 전하고 싶습니다.",
      body1: "우리는 모두 진정한 연결을 갈망합니다. 하지만 때로는 첫걸음을 내딛는 것이 두렵기도 하죠. 그래서 Glimpse를 만들었습니다.",
      body2: "익명성이라는 안전한 베일 뒤에서, 여러분은 진짜 자신의 모습으로 누군가와 만날 수 있습니다. 외모나 스펙이 아닌, 마음과 마음이 먼저 만나는 곳.",
      body3: "여러분의 용기 있는 '좋아요' 하나가 누군가에게는 큰 설렘이 될 수 있습니다. 그리고 그 설렘이 진정한 인연으로 이어지길 바랍니다.",
      closing: "Glimpse와 함께 하는 여러분의 여정이 따뜻하고 의미 있기를 진심으로 응원합니다.",
      signature: "감사합니다.\nGlimpse 팀 드림",
      ps: "P.S. 여러분의 소중한 피드백은 언제나 환영합니다. 더 나은 Glimpse를 만들어가겠습니다. 💌"
    },
    en: {
      greeting: "Dear Glimpse Users 💜",
      intro: "I want to express my heartfelt gratitude through this small letter.",
      body1: "We all crave genuine connections. But sometimes, taking that first step can be daunting. That's why we created Glimpse.",
      body2: "Behind the safe veil of anonymity, you can meet someone as your true self. A place where hearts meet hearts first, not appearances or specs.",
      body3: "Your courageous 'like' could be someone's flutter of excitement. And we hope that excitement leads to a genuine connection.",
      closing: "We sincerely hope your journey with Glimpse is warm and meaningful.",
      signature: "Thank you.\nFrom the Glimpse Team",
      ps: "P.S. Your valuable feedback is always welcome. We'll continue making Glimpse better. 💌"
    }
  };

  const currentLanguage = t('common:language') as 'ko' | 'en';
  const content = letterContent[currentLanguage] || letterContent.ko;

  return (
    <>
      <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.8}>
        <LinearGradient
          colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <MaterialCommunityIcons name="email-outline" size={24} color="#FFFFFF" />
            </View>
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>{t('profile:profile.letterFromFounder')}</Text>
            <Text style={styles.subtitle}>{t('profile:profile.letterSubtitle')}</Text>
          </View>
          
          <View style={styles.arrowContainer}>
            <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.8)" />
          </View>

          {/* Decorative Elements */}
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
        </LinearGradient>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={100} style={StyleSheet.absoluteFillObject}>
            <TouchableOpacity 
              style={styles.modalBackground} 
              activeOpacity={1} 
              onPress={closeModal}
            >
              <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                <View style={styles.letterContainer}>
                  {/* Letter Header */}
                  <LinearGradient
                    colors={['#8B5CF6', '#7C3AED']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.letterHeader}
                  >
                    <View style={styles.stampContainer}>
                      <View style={styles.stamp}>
                        <MaterialCommunityIcons name="heart" size={20} color="#FFFFFF" />
                      </View>
                    </View>
                    <Text style={styles.letterTitle}>💌 {t('profile:profile.letterFromFounder')}</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                      <Ionicons name="close" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </LinearGradient>

                  {/* Letter Content */}
                  <ScrollView 
                    style={styles.letterScrollView}
                    contentContainerStyle={styles.letterContentContainer}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.letterPaper}>
                      <Text style={styles.greeting}>{content.greeting}</Text>
                      <Text style={styles.letterText}>{content.intro}</Text>
                      <Text style={styles.letterText}>{content.body1}</Text>
                      <Text style={styles.letterText}>{content.body2}</Text>
                      <Text style={styles.letterText}>{content.body3}</Text>
                      <Text style={styles.letterText}>{content.closing}</Text>
                      
                      <View style={styles.signatureContainer}>
                        <Text style={styles.signature}>{content.signature}</Text>
                      </View>

                      <View style={styles.psContainer}>
                        <Text style={styles.ps}>{content.ps}</Text>
                      </View>

                      {/* Decorative Bottom */}
                      <View style={styles.letterDecoration}>
                        <View style={styles.decorativeLine} />
                        <MaterialCommunityIcons name="heart-multiple" size={24} color="#8B5CF6" />
                        <View style={styles.decorativeLine} />
                      </View>
                    </View>
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  gradientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
  },
  iconContainer: {
    marginRight: 12,
  },
  iconBackground: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  arrowContainer: {
    padding: 4,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -20,
    right: -20,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: -10,
    left: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  letterContainer: {
    width: SCREEN_WIDTH - 40,
    maxWidth: 400,
    maxHeight: SCREEN_HEIGHT * 0.8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  letterHeader: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  stampContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  stamp: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-15deg' }],
  },
  letterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 4,
  },
  letterScrollView: {
    flex: 1,
  },
  letterContentContainer: {
    padding: 20,
  },
  letterPaper: {
    backgroundColor: '#FDFBF7',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0E6D6',
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 16,
    textAlign: 'center',
  },
  letterText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4A5568',
    marginBottom: 12,
    textAlign: 'justify',
  },
  signatureContainer: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  signature: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#718096',
    textAlign: 'right',
  },
  psContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6',
  },
  ps: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6B46C1',
    fontStyle: 'italic',
  },
  letterDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingTop: 16,
  },
  decorativeLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
});