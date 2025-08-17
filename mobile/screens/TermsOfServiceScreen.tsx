import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

export const TermsOfServiceScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <View style={[styles.header, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>서비스 이용약관</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.updateDate, { color: colors.TEXT.SECONDARY }]}>
            시행일: 2025년 1월 1일
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            제1조 (목적)
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            이 약관은 Glimpse(이하 "회사")가 제공하는 익명 기반 매칭 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            제2조 (정의)
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            ① "서비스"란 회사가 제공하는 익명 기반 그룹 매칭 플랫폼을 의미합니다.
            {'\n'}② "회원"이란 이 약관에 동의하고 회사와 서비스 이용계약을 체결한 자를 의미합니다.
            {'\n'}③ "익명 프로필"이란 실명을 공개하지 않고 닉네임으로 활동하는 프로필을 의미합니다.
            {'\n'}④ "매칭"이란 상호 관심 표현으로 연결되는 것을 의미합니다.
            {'\n'}⑤ "그룹"이란 공통 관심사나 소속을 기반으로 형성된 커뮤니티를 의미합니다.
            {'\n'}⑥ "프리미엄 서비스"란 유료로 제공되는 추가 기능을 의미합니다.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            제3조 (약관의 효력 및 변경)
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            ① 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.
            {'\n'}② 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있습니다.
            {'\n'}③ 변경된 약관은 적용일자 7일 전부터 공지하며, 회원에게 불리한 변경의 경우 30일 전부터 공지합니다.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            제4조 (회원가입 및 계정)
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            ① 회원가입은 휴대폰 번호 인증을 통해 이루어집니다.
            {'\n'}② 회원은 정확한 정보를 제공해야 하며, 변경 시 즉시 수정해야 합니다.
            {'\n'}③ 타인의 정보를 도용하여 가입한 경우 서비스 이용이 제한됩니다.
            {'\n'}④ 회원은 자신의 계정 관리 책임이 있으며, 제3자에게 이용을 허락할 수 없습니다.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            제5조 (서비스 이용)
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            ① 서비스는 연중무휴 24시간 제공을 원칙으로 합니다.
            {'\n'}② 다음의 경우 서비스가 제한될 수 있습니다:
            {'\n'}  • 시스템 정기점검, 보수, 교체
            {'\n'}  • 천재지변, 정전 등 불가항력적 사유
            {'\n'}  • 서비스 개선을 위한 업데이트
            {'\n'}③ 무료 회원은 하루 1회 관심 표현이 가능하며, 프리미엄 회원은 무제한입니다.
            {'\n'}④ 매칭된 상대와만 채팅이 가능합니다.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            제6조 (이용 제한)
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            다음의 행위는 금지되며, 위반 시 서비스 이용이 제한됩니다:
            {'\n\n'}
            • 타인의 개인정보 도용 또는 허위 정보 등록
            {'\n'}• 음란물, 욕설, 비방 등 부적절한 콘텐츠 게시
            {'\n'}• 상업적 광고, 홍보 활동
            {'\n'}• 서비스 운영을 방해하는 행위
            {'\n'}• 타 회원에게 불쾌감을 주는 행위
            {'\n'}• 매칭 후 금전 요구 등 사기 행위
            {'\n'}• 스토킹, 협박 등 범죄 행위
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            제7조 (프리미엄 서비스)
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            ① 프리미엄 서비스 이용료:
            {'\n'}  • 월간: ₩9,900
            {'\n'}  • 연간: ₩99,000 (17% 할인)
            {'\n\n'}
            ② 프리미엄 혜택:
            {'\n'}  • 무제한 관심 표현
            {'\n'}  • 받은 관심 확인
            {'\n'}  • 우선 매칭
            {'\n'}  • 되돌리기 기능
            {'\n'}  • 읽음 확인
            {'\n\n'}
            ③ 결제는 앱스토어 또는 구글플레이를 통해 이루어집니다.
            {'\n'}④ 환불은 각 스토어의 정책을 따릅니다.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            제8조 (콘텐츠 및 저작권)
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            ① 회원이 서비스에 게시한 콘텐츠의 저작권은 회원에게 있습니다.
            {'\n'}② 회사는 서비스 운영, 홍보 등을 위해 회원의 콘텐츠를 사용할 수 있습니다.
            {'\n'}③ 타인의 저작권을 침해하는 콘텐츠는 즉시 삭제됩니다.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            제9조 (개인정보 보호)
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            ① 회사는 관련 법령에 따라 회원의 개인정보를 보호합니다.
            {'\n'}② 개인정보 처리에 관한 자세한 사항은 개인정보 처리방침을 따릅니다.
            {'\n'}③ 익명성은 서비스의 핵심 가치로, 상호 매칭 전까지 실명이 공개되지 않습니다.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            제10조 (책임 제한)
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            ① 회사는 무료로 제공되는 서비스에 대해 관련 법령에 특별한 규정이 없는 한 책임을 지지 않습니다.
            {'\n'}② 회사는 회원 간 발생한 분쟁에 개입하지 않으며, 이로 인한 손해를 배상하지 않습니다.
            {'\n'}③ 회원이 서비스 이용 중 타인에게 손해를 입힌 경우, 해당 회원이 책임을 집니다.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            제11조 (회원 탈퇴)
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            ① 회원은 언제든지 탈퇴를 요청할 수 있습니다.
            {'\n'}② 탈퇴 시 회원 정보는 즉시 삭제되나, 관련 법령에 따라 일정 기간 보관될 수 있습니다.
            {'\n'}③ 부정 이용 방지를 위해 탈퇴 후 30일간 재가입이 제한됩니다.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            제12조 (분쟁 해결)
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            ① 이 약관에 명시되지 않은 사항은 관련 법령 및 상관례에 따릅니다.
            {'\n'}② 서비스 이용과 관련한 분쟁은 대한민국 법원을 관할 법원으로 합니다.
            {'\n'}③ 회원과 회사 간 분쟁 발생 시, 상호 협의하여 원만히 해결합니다.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            부칙
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            이 약관은 2025년 1월 1일부터 시행됩니다.
            {'\n\n'}
            문의사항: support@glimpse.com
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: SPACING.SM,
  },
  headerTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  content: {
    paddingVertical: SPACING.MD,
  },
  section: {
    marginHorizontal: SPACING.MD,
    marginBottom: SPACING.MD,
    padding: SPACING.MD,
    borderRadius: 12,
  },
  updateDate: {
    fontSize: FONT_SIZES.SM,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    marginBottom: SPACING.SM,
  },
  sectionContent: {
    fontSize: FONT_SIZES.SM,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '600',
  },
});