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

export const PrivacyPolicyScreen = () => {
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
        <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>개인정보 처리방침</Text>
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
            1. 개인정보의 수집 및 이용 목적
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            Glimpse(이하 "회사")는 익명 기반의 매칭 서비스를 제공하기 위해 다음과 같은 목적으로 개인정보를 수집·이용합니다:
            {'\n\n'}
            • 회원 가입 및 관리: 본인 확인, 회원제 서비스 이용에 따른 본인 식별
            {'\n'}• 익명 매칭 서비스 제공: 그룹 기반 관심 표현 및 상호 매칭
            {'\n'}• 결제 및 정산: 프리미엄 서비스 이용료 결제, 구매 및 요금 결제
            {'\n'}• 서비스 개선: 신규 서비스 개발 및 맞춤 서비스 제공
            {'\n'}• 부정 이용 방지: 개인정보 도용 및 부정거래 방지
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            2. 수집하는 개인정보 항목
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            <Text style={styles.bold}>필수 항목:</Text>
            {'\n'}• 휴대폰 번호 (SMS 인증용)
            {'\n'}• 닉네임
            {'\n'}• 나이
            {'\n'}• 성별
            {'\n\n'}
            <Text style={styles.bold}>선택 항목:</Text>
            {'\n'}• 프로필 사진
            {'\n'}• 자기소개
            {'\n'}• 회사명 (회사 인증 시)
            {'\n'}• 이메일 (회사 인증 시)
            {'\n'}• 위치 정보 (위치 기반 서비스 이용 시)
            {'\n\n'}
            <Text style={styles.bold}>자동 수집 항목:</Text>
            {'\n'}• 서비스 이용 기록
            {'\n'}• 접속 로그
            {'\n'}• 쿠키
            {'\n'}• 접속 IP 정보
            {'\n'}• 기기 정보 (OS, 앱 버전 등)
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            3. 개인정보 보유 및 이용 기간
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
            {'\n\n'}
            • 회원 정보: 회원 탈퇴 시까지
            {'\n'}• 결제 정보: 전자상거래법에 따라 5년
            {'\n'}• 본인확인 정보: 정보통신망법에 따라 6개월
            {'\n'}• 서비스 부정이용 기록: 1년
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            4. 개인정보의 제3자 제공
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:
            {'\n\n'}
            • 이용자가 사전에 동의한 경우
            {'\n'}• 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우
            {'\n'}• 결제 처리를 위해 필요한 경우 (PG사: 토스페이먼츠, 카카오페이)
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            5. 익명성 보장
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            <Text style={styles.bold}>Glimpse의 핵심 가치는 익명성입니다:</Text>
            {'\n\n'}
            • 상호 매칭 전까지 실명 비공개
            {'\n'}• 닉네임 기반 활동
            {'\n'}• 프로필 사진 선택적 공개
            {'\n'}• 회사 인증 정보는 인증 목적으로만 사용
            {'\n'}• 위치 정보는 근처 그룹 찾기에만 활용, 개인 위치 추적 불가
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            6. 개인정보의 파기
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
            {'\n\n'}
            • 전자적 파일 형태: 복구 불가능한 방법으로 영구 삭제
            {'\n'}• 종이 문서: 분쇄기로 분쇄하거나 소각
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            7. 이용자의 권리
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            이용자는 언제든지 다음의 권리를 행사할 수 있습니다:
            {'\n\n'}
            • 개인정보 열람 요구
            {'\n'}• 오류 등이 있을 경우 정정 요구
            {'\n'}• 삭제 요구
            {'\n'}• 처리정지 요구
            {'\n\n'}
            권리 행사는 앱 내 설정 메뉴 또는 고객센터를 통해 가능합니다.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            8. 개인정보 보호책임자
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            개인정보 보호책임자
            {'\n'}이메일: privacy@glimpse.com
            {'\n\n'}
            기타 개인정보침해에 대한 신고나 상담이 필요하신 경우:
            {'\n'}• 개인정보침해신고센터 (privacy.kisa.or.kr / 118)
            {'\n'}• 대검찰청 사이버수사과 (www.spo.go.kr / 1301)
            {'\n'}• 경찰청 사이버안전국 (cyberbureau.police.go.kr / 182)
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            9. 개인정보 처리방침 변경
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            이 개인정보 처리방침은 2025년 1월 1일부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
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