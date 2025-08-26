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
import { RootNavigationProp } from '@/types/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import { useInstantMeetingStore } from '@/store/instantMeetingStore';
import { COLORS_EXTENDED as COLORS, FONTS, SIZES } from '@/utils/constants';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';

export function InstantMeetingScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const { t } = useAndroidSafeTranslation();
  const { 
    currentMeeting, 
    participantCount,
    myStats,
    fetchMeetingDetails,
    leaveInstantMeeting,
    updateFeatures,
  } = useInstantMeetingStore();

  const [timeLeft, setTimeLeft] = useState('');
  const [isMatching, setIsMatching] = useState(false);

  useEffect(() => {
    if (currentMeeting) {
      fetchMeetingDetails(currentMeeting.id);
      
      // 남은 시간 계산
      const timer = setInterval(() => {
        const now = new Date();
        const expires = new Date(currentMeeting.expiresAt);
        const diff = expires.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeLeft(t('instant:meeting.expired'));
          clearInterval(timer);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(t('instant:meeting.timeFormat', { hours, minutes }));
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentMeeting]);

  const handleUpdateFeatures = () => {
    navigation.navigate('UpdateFeatures', { 
      meetingId: currentMeeting!.id 
    });
  };

  const handleViewMatches = () => {
    navigation.navigate('InstantMatches', { 
      meetingId: currentMeeting!.id 
    });
  };

  const handleLeaveMeeting = () => {
    Alert.alert(
      t('instant:meeting.leaveMeeting.title'),
      t('instant:meeting.leaveMeeting.message'),
      [
        { text: t('instant:meeting.leaveMeeting.cancel'), style: 'cancel' },
        { 
          text: t('instant:meeting.leaveMeeting.confirm'), 
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
          <Text style={styles.statsTitle}>{t('instant:meeting.participants')}</Text>
          <Text style={styles.statsValue}>{t('instant:meeting.participantsCount', { count: participantCount })}</Text>
          <Text style={styles.timeLeft}>{t('instant:meeting.timeLeft', { time: timeLeft })}</Text>
        </View>

        {/* 자동 매칭 상태 */}
        <View style={styles.matchingCard}>
          <Icon name="sync" size={32} color={COLORS.primary} />
          <Text style={styles.matchingTitle}>{t('instant:meeting.autoMatching')}</Text>
          <Text style={styles.matchingSubtext}>
            {t('instant:meeting.matchingDescription')}
          </Text>
          {myStats.matches === 0 && (
            <TouchableOpacity 
              style={styles.updateButton}
              onPress={handleUpdateFeatures}
            >
              <Text style={styles.updateButtonText}>{t('instant:meeting.updateFeatures')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 내 매칭 현황 */}
        <View style={styles.activityCard}>
          <Text style={styles.activityTitle}>{t('instant:meeting.myMatches')}</Text>
          <View style={styles.activityStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('instant:meeting.matchCount')}</Text>
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
              {t('instant:meeting.viewMatches', { count: myStats.matches })}
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
  matchingCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding * 1.5,
    alignItems: 'center',
    marginBottom: SIZES.padding,
    ...SIZES.shadow,
  },
  matchingTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    marginTop: SIZES.base,
  },
  matchingSubtext: {
    ...FONTS.body4,
    color: COLORS.textLight,
    marginTop: SIZES.base / 2,
    textAlign: 'center',
  },
  updateButton: {
    marginTop: SIZES.padding,
    paddingVertical: SIZES.padding * 0.75,
    paddingHorizontal: SIZES.padding * 1.5,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
  },
  updateButtonText: {
    ...FONTS.body3,
    color: COLORS.white,
    fontWeight: '600',
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