import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useInstantMeetingStore } from '@/store/instantMeetingStore';
import { COLORS, FONTS, SIZES } from '@/utils/constants';

export function InstantMeetingScreen() {
  const navigation = useNavigation();
  const { 
    currentMeeting, 
    participantCount,
    myStats,
    fetchMeetingDetails,
    leaveInstantMeeting,
  } = useInstantMeetingStore();

  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (currentMeeting) {
      fetchMeetingDetails(currentMeeting.id);
      
      // 남은 시간 계산
      const timer = setInterval(() => {
        const now = new Date();
        const expires = new Date(currentMeeting.expiresAt);
        const diff = expires.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeLeft('만료됨');
          clearInterval(timer);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${hours}시간 ${minutes}분`);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentMeeting]);

  const handleExpressInterest = () => {
    navigation.navigate('ExpressInterest', { 
      meetingId: currentMeeting.id 
    });
  };

  const handleViewMatches = () => {
    navigation.navigate('InstantMatches', { 
      meetingId: currentMeeting.id 
    });
  };

  const handleLeaveMeeting = () => {
    Alert.alert(
      '모임 나가기',
      '정말로 모임을 나가시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '나가기', 
          style: 'destructive',
          onPress: async () => {
            await leaveInstantMeeting();
            navigation.goBack();
          }
        }
      ]
    );
  };

  if (!currentMeeting) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{currentMeeting.name}</Text>
        <TouchableOpacity onPress={handleLeaveMeeting}>
          <Icon name="exit-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 참가자 현황 */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>참가자</Text>
          <Text style={styles.statsValue}>{participantCount}명</Text>
          <Text style={styles.timeLeft}>남은 시간: {timeLeft}</Text>
        </View>

        {/* 호감 표현 버튼 */}
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleExpressInterest}
        >
          <Icon name="heart" size={32} color={COLORS.white} />
          <Text style={styles.primaryButtonText}>호감 표현하기</Text>
          <Text style={styles.primaryButtonSubtext}>
            주변을 둘러보고 마음에 드는 사람을 찾아보세요
          </Text>
        </TouchableOpacity>

        {/* 내 활동 */}
        <View style={styles.activityCard}>
          <Text style={styles.activityTitle}>내 활동</Text>
          <View style={styles.activityStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>보낸 호감</Text>
              <Text style={styles.statValue}>{myStats.sentInterests}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>받은 호감</Text>
              <Text style={styles.statValue}>{myStats.receivedInterests}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>매칭</Text>
              <Text style={styles.statValue}>{myStats.matches}</Text>
            </View>
          </View>
        </View>

        {/* 매칭 확인 버튼 */}
        {myStats.matches > 0 && (
          <TouchableOpacity 
            style={styles.matchButton}
            onPress={handleViewMatches}
          >
            <Text style={styles.matchButtonText}>
              내 매칭 확인 ({myStats.matches})
            </Text>
            <Icon name="chevron-forward" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding * 0.5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: SIZES.padding,
  },
  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    alignItems: 'center',
    marginBottom: SIZES.padding,
    ...SIZES.shadow,
  },
  statsTitle: {
    ...FONTS.body3,
    color: COLORS.textLight,
    marginBottom: SIZES.base / 2,
  },
  statsValue: {
    ...FONTS.h1,
    color: COLORS.text,
    marginBottom: SIZES.base / 2,
  },
  timeLeft: {
    ...FONTS.body4,
    color: COLORS.primary,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: SIZES.padding * 1.5,
    alignItems: 'center',
    marginBottom: SIZES.padding,
    ...SIZES.shadow,
  },
  primaryButtonText: {
    ...FONTS.h3,
    color: COLORS.white,
    marginTop: SIZES.base,
  },
  primaryButtonSubtext: {
    ...FONTS.body4,
    color: COLORS.white,
    opacity: 0.8,
    marginTop: SIZES.base / 2,
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    ...SIZES.shadow,
  },
  activityTitle: {
    ...FONTS.h4,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  activityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    ...FONTS.body4,
    color: COLORS.textLight,
    marginBottom: SIZES.base / 2,
  },
  statValue: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: SIZES.base,
  },
  matchButton: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SIZES.shadow,
  },
  matchButtonText: {
    ...FONTS.body2,
    color: COLORS.primary,
    fontWeight: '600',
  },
});