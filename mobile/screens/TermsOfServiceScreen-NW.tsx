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

export const TermsOfServiceScreen = () => {
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
          서비스 이용약관
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        <Text 
          className="text-base leading-7 mb-6"
          style={{ color: colors.TEXT.PRIMARY }}
        >
          본 약관은 Glimpse(이하 "회사")가 제공하는 서비스의 이용조건 및 절차, 회사와 회원간의 권리, 의무 및 책임사항 등을 규정함을 목적으로 합니다.
        </Text>

        <View className="mb-6">
          <Text 
            className="text-lg font-semibold mb-3"
            style={{ color: colors.TEXT.PRIMARY }}
          >
            제1조 (목적)
          </Text>
          <Text 
            className="text-base leading-6"
            style={{ color: colors.TEXT.SECONDARY }}
          >
            이 약관은 회사가 제공하는 익명 매칭 서비스(이하 "서비스")를 이용함에 있어 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
          </Text>
        </View>

        <View className="mb-6">
          <Text 
            className="text-lg font-semibold mb-3"
            style={{ color: colors.TEXT.PRIMARY }}
          >
            제2조 (정의)
          </Text>
          <Text 
            className="text-base leading-6 mb-3"
            style={{ color: colors.TEXT.SECONDARY }}
          >
            이 약관에서 사용하는 용어의 정의는 다음과 같습니다:
          </Text>
          <View className="ml-4">
            <Text className="text-base leading-6 mb-2" style={{ color: colors.TEXT.SECONDARY }}>
              1. "서비스"란 회사가 제공하는 익명 매칭 플랫폼을 말합니다.
            </Text>
            <Text className="text-base leading-6 mb-2" style={{ color: colors.TEXT.SECONDARY }}>
              2. "회원"이란 회사의 서비스에 접속하여 이 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 고객을 말합니다.
            </Text>
            <Text className="text-base leading-6 mb-2" style={{ color: colors.TEXT.SECONDARY }}>
              3. "매칭"이란 회사의 알고리즘을 통해 회원들이 서로를 발견하고 연결되는 과정을 말합니다.
            </Text>
          </View>
        </View>

        <View className="mb-6">
          <Text 
            className="text-lg font-semibold mb-3"
            style={{ color: colors.TEXT.PRIMARY }}
          >
            제3조 (약관의 효력 및 변경)
          </Text>
          <Text 
            className="text-base leading-6 mb-3"
            style={{ color: colors.TEXT.SECONDARY }}
          >
            1. 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.
          </Text>
          <Text 
            className="text-base leading-6"
            style={{ color: colors.TEXT.SECONDARY }}
          >
            2. 회사는 합리적인 사유가 발생할 경우에는 이 약관을 변경할 수 있으며, 약관을 변경하는 경우에는 적용일자 및 변경사유를 명시하여 현행약관과 함께 서비스의 초기화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.
          </Text>
        </View>

        <View className="mb-6">
          <Text 
            className="text-lg font-semibold mb-3"
            style={{ color: colors.TEXT.PRIMARY }}
          >
            제4조 (서비스의 제공 및 변경)
          </Text>
          <Text 
            className="text-base leading-6"
            style={{ color: colors.TEXT.SECONDARY }}
          >
            회사는 다음과 같은 서비스를 제공합니다:
          </Text>
          <View className="ml-4 mt-3">
            <Text className="text-base leading-6 mb-2" style={{ color: colors.TEXT.SECONDARY }}>
              1. 익명 프로필 기반 매칭 서비스
            </Text>
            <Text className="text-base leading-6 mb-2" style={{ color: colors.TEXT.SECONDARY }}>
              2. 그룹 기반 네트워킹 서비스
            </Text>
            <Text className="text-base leading-6 mb-2" style={{ color: colors.TEXT.SECONDARY }}>
              3. 실시간 채팅 서비스
            </Text>
            <Text className="text-base leading-6 mb-2" style={{ color: colors.TEXT.SECONDARY }}>
              4. 기타 회사가 추가 개발하거나 다른 회사와의 제휴계약 등을 통해 회원에게 제공하는 일체의 서비스
            </Text>
          </View>
        </View>

        <View className="mb-6">
          <Text 
            className="text-lg font-semibold mb-3"
            style={{ color: colors.TEXT.PRIMARY }}
          >
            제5조 (회원가입)
          </Text>
          <Text 
            className="text-base leading-6 mb-3"
            style={{ color: colors.TEXT.SECONDARY }}
          >
            1. 이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.
          </Text>
          <Text 
            className="text-base leading-6"
            style={{ color: colors.TEXT.SECONDARY }}
          >
            2. 회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각호에 해당하지 않는 한 회원으로 등록합니다.
          </Text>
        </View>

        <View className="mb-6">
          <Text 
            className="text-lg font-semibold mb-3"
            style={{ color: colors.TEXT.PRIMARY }}
          >
            제6조 (회원탈퇴 및 자격 상실)
          </Text>
          <Text 
            className="text-base leading-6 mb-3"
            style={{ color: colors.TEXT.SECONDARY }}
          >
            1. 회원은 회사에 언제든지 탈퇴를 요청할 수 있으며 회사는 즉시 회원탈퇴를 처리합니다.
          </Text>
          <Text 
            className="text-base leading-6"
            style={{ color: colors.TEXT.SECONDARY }}
          >
            2. 회원이 다음 각호의 사유에 해당하는 경우, 회사는 회원자격을 제한 및 정지시킬 수 있습니다.
          </Text>
        </View>

        <View className="mb-8">
          <Text 
            className="text-lg font-semibold mb-3"
            style={{ color: colors.TEXT.PRIMARY }}
          >
            제7조 (개인정보보호)
          </Text>
          <Text 
            className="text-base leading-6"
            style={{ color: colors.TEXT.SECONDARY }}
          >
            회사는 관련법령이 정하는 바에 따라서 회원 등록정보를 포함한 회원의 개인정보를 보호하기 위해 노력합니다. 회원의 개인정보보호에 관해서는 관련법령 및 회사의 개인정보처리방침이 적용됩니다.
          </Text>
        </View>

        <Text 
          className="text-sm text-center"
          style={{ color: colors.TEXT.LIGHT }}
        >
          본 약관은 2025년 1월 1일부터 시행됩니다.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};