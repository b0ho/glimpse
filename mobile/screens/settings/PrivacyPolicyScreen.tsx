/**
 * 개인정보 처리방침 화면
 *
 * @screen
 * @description 개인정보보호법에 따른 개인정보 처리방침을 표시하는 법적 문서 화면
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { cn } from '@/lib/utils';

/**
 * 개인정보 처리방침 화면 컴포넌트
 *
 * @component
 * @returns {JSX.Element}
 *
 * @description
 * Glimpse의 개인정보 처리방침을 상세히 표시하는 화면입니다.
 * - 개인정보의 처리목적
 * - 개인정보의 처리 및 보유기간
 * - 정보주체의 권리·의무 및 행사방법
 * - 개인정보의 안전성 확보조치
 * - 개인정보 보호책임자 정보
 *
 * @legal
 * - 개인정보보호법 준수
 * - GDPR 호환
 * - 시행일자 명시
 *
 * @content
 * - 회원가입 및 관리 목적
 * - 매칭 서비스 제공
 * - 개인정보 열람/정정/삭제 권리
 * - 암호화 및 접근통제 조치
 * - 보호책임자 연락처
 *
 * @navigation
 * - From: SettingsScreen (설정 화면)
 * - From: 회원가입 화면 (약관 동의 시)
 *
 * @example
 * ```tsx
 * // 설정 화면에서 이동
 * navigation.navigate('PrivacyPolicy');
 * ```
 */
export const PrivacyPolicyScreen = () => {
  const navigation = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const { t } = useAndroidSafeTranslation('legal');

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
        </TouchableOpacity>
        
        <Text 
          className="text-xl font-semibold ml-4"
          style={{ color: colors.TEXT.PRIMARY }}
        >
          개인정보 처리방침
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        <Text 
          className="text-base leading-7 mb-6"
          style={{ color: colors.TEXT.PRIMARY }}
        >
          Glimpse(이하 "회사")는 개인정보보호법에 따라 이용자의 개인정보 보호 및 권익을 보호하고 개인정보와 관련된 이용자의 고충을 원활하게 처리할 수 있도록 다음과 같은 처리방침을 두고 있습니다.
        </Text>

        <View className="mb-6">
          <Text 
            className="text-lg font-semibold mb-3"
            style={{ color: colors.TEXT.PRIMARY }}
          >
            1. 개인정보의 처리목적
          </Text>
          <Text 
            className="text-base leading-6 mb-3"
            style={{ color: colors.TEXT.SECONDARY }}
          >
            회사는 다음의 목적을 위하여 개인정보를 처리합니다:
          </Text>
          <View className="ml-4">
            <Text className="text-base leading-6 mb-2" style={{ color: colors.TEXT.SECONDARY }}>
              • 회원가입 및 관리
            </Text>
            <Text className="text-base leading-6 mb-2" style={{ color: colors.TEXT.SECONDARY }}>
              • 서비스 제공 및 계약 이행
            </Text>
            <Text className="text-base leading-6 mb-2" style={{ color: colors.TEXT.SECONDARY }}>
              • 회원제 서비스 이용에 따른 본인확인
            </Text>
            <Text className="text-base leading-6 mb-2" style={{ color: colors.TEXT.SECONDARY }}>
              • 매칭 서비스 제공
            </Text>
          </View>
        </View>

        <View className="mb-6">
          <Text 
            className="text-lg font-semibold mb-3"
            style={{ color: colors.TEXT.PRIMARY }}
          >
            2. 개인정보의 처리 및 보유기간
          </Text>
          <Text 
            className="text-base leading-6"
            style={{ color: colors.TEXT.SECONDARY }}
          >
            회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
          </Text>
        </View>

        <View className="mb-6">
          <Text 
            className="text-lg font-semibold mb-3"
            style={{ color: colors.TEXT.PRIMARY }}
          >
            3. 정보주체의 권리·의무 및 행사방법
          </Text>
          <Text 
            className="text-base leading-6"
            style={{ color: colors.TEXT.SECONDARY }}
          >
            이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다:
          </Text>
          <View className="ml-4 mt-3">
            <Text className="text-base leading-6 mb-2" style={{ color: colors.TEXT.SECONDARY }}>
              • 개인정보 처리현황 통지요구
            </Text>
            <Text className="text-base leading-6 mb-2" style={{ color: colors.TEXT.SECONDARY }}>
              • 개인정보 열람요구
            </Text>
            <Text className="text-base leading-6 mb-2" style={{ color: colors.TEXT.SECONDARY }}>
              • 개인정보 정정·삭제요구
            </Text>
            <Text className="text-base leading-6 mb-2" style={{ color: colors.TEXT.SECONDARY }}>
              • 개인정보 처리정지요구
            </Text>
          </View>
        </View>

        <View className="mb-6">
          <Text 
            className="text-lg font-semibold mb-3"
            style={{ color: colors.TEXT.PRIMARY }}
          >
            4. 개인정보의 안전성 확보조치
          </Text>
          <Text 
            className="text-base leading-6"
            style={{ color: colors.TEXT.SECONDARY }}
          >
            회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:
          </Text>
          <View className="ml-4 mt-3">
            <Text className="text-base leading-6 mb-2" style={{ color: colors.TEXT.SECONDARY }}>
              • 관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육
            </Text>
            <Text className="text-base leading-6 mb-2" style={{ color: colors.TEXT.SECONDARY }}>
              • 기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 암호화
            </Text>
            <Text className="text-base leading-6 mb-2" style={{ color: colors.TEXT.SECONDARY }}>
              • 물리적 조치: 전산실, 자료보관실 등의 접근통제
            </Text>
          </View>
        </View>

        <View className="mb-8">
          <Text 
            className="text-lg font-semibold mb-3"
            style={{ color: colors.TEXT.PRIMARY }}
          >
            5. 개인정보 보호책임자
          </Text>
          <Text 
            className="text-base leading-6 mb-3"
            style={{ color: colors.TEXT.SECONDARY }}
          >
            회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
          </Text>
          <View 
            className="p-4 rounded-lg"
            style={{ backgroundColor: colors.SURFACE }}
          >
            <Text className="text-base font-medium mb-2" style={{ color: colors.TEXT.PRIMARY }}>
              개인정보 보호책임자
            </Text>
            <Text className="text-sm mb-1" style={{ color: colors.TEXT.SECONDARY }}>
              이메일: privacy@glimpse.app
            </Text>
            <Text className="text-sm" style={{ color: colors.TEXT.SECONDARY }}>
              전화번호: 1588-0000
            </Text>
          </View>
        </View>

        <Text 
          className="text-sm text-center"
          style={{ color: colors.TEXT.LIGHT }}
        >
          본 방침은 2025년 1월 1일부터 시행됩니다.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};