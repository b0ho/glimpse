import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { groupApi } from '@/services/api/groupApi';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { formatDateKorean } from '../shared/utils';

interface PendingMember {
  id: string;
  userId: string;
  user: {
    id: string;
    nickname: string;
    profileImage?: string;
    age?: number;
    gender?: string;
    bio?: string;
  };
  joinedAt: Date;
}

export const GroupManageScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupId } = route.params as { groupId: string };
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  useEffect(() => {
    loadPendingMembers();
  }, [groupId]);

  const loadPendingMembers = async () => {
    try {
      const members = await groupApi.getPendingMembers(groupId);
      setPendingMembers(members);
    } catch (error: any) {
      console.error('Failed to load pending members:', error);
      if (error.response?.status === 403) {
        Alert.alert(t('group:manage.alerts.noPermission.title'), t('group:manage.alerts.noPermission.message'), [
          { text: t('common:buttons.confirm'), onPress: () => navigation.goBack() }
        ]);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPendingMembers();
  };

  const handleApprove = async (member: PendingMember) => {
    Alert.alert(
      t('group:manage.alerts.approveConfirm.title'),
      t('group:manage.alerts.approveConfirm.message', { nickname: member.user.nickname }),
      [
        { text: t('group:manage.alerts.approveConfirm.cancel'), style: 'cancel' },
        {
          text: t('group:manage.alerts.approveConfirm.approve'),
          onPress: async () => {
            setProcessingIds(prev => [...prev, member.id]);
            try {
              await groupApi.approveMember(groupId, member.userId);
              setPendingMembers(prev => prev.filter(m => m.id !== member.id));
              Alert.alert(t('group:manage.alerts.approveSuccess.title'), t('group:manage.alerts.approveSuccess.message'));
            } catch (error: any) {
              Alert.alert(t('group:manage.alerts.approveError.title'), error.response?.data?.message || t('group:manage.alerts.approveError.message'));
            } finally {
              setProcessingIds(prev => prev.filter(id => id !== member.id));
            }
          },
        },
      ]
    );
  };

  const handleReject = async (member: PendingMember) => {
    Alert.alert(
      t('group:manage.alerts.rejectConfirm.title'),
      t('group:manage.alerts.rejectConfirm.message', { nickname: member.user.nickname }),
      [
        { text: t('group:manage.alerts.rejectConfirm.cancel'), style: 'cancel' },
        {
          text: t('group:manage.alerts.rejectConfirm.reject'),
          style: 'destructive',
          onPress: async () => {
            setProcessingIds(prev => [...prev, member.id]);
            try {
              await groupApi.rejectMember(groupId, member.userId);
              setPendingMembers(prev => prev.filter(m => m.id !== member.id));
              Alert.alert(t('group:manage.alerts.rejectSuccess.title'), t('group:manage.alerts.rejectSuccess.message'));
            } catch (error: any) {
              Alert.alert(t('group:manage.alerts.rejectError.title'), error.response?.data?.message || t('group:manage.alerts.rejectError.message'));
            } finally {
              setProcessingIds(prev => prev.filter(id => id !== member.id));
            }
          },
        },
      ]
    );
  };

  const renderMember = (member: PendingMember) => {
    const isProcessing = processingIds.includes(member.id);

    return (
      <View key={member.id} style={[styles.memberCard, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}>
        <View style={styles.memberInfo}>
          <Image
            source={{ 
              uri: member.user.profileImage || 'https://via.placeholder.com/100' 
            }}
            style={styles.profileImage}
          />
          <View style={styles.memberDetails}>
            <Text style={[styles.nickname, { color: colors.TEXT.PRIMARY }]}>{member.user.nickname}</Text>
            {member.user.age && member.user.gender && (
              <Text style={[styles.ageGender, { color: colors.TEXT.SECONDARY }]}>
                {member.user.age}{t('common:age')} • {member.user.gender === 'MALE' ? t('common:gender.male') : t('common:gender.female')}
              </Text>
            )}
            {member.user.bio && (
              <Text style={[styles.bio, { color: colors.TEXT.SECONDARY }]} numberOfLines={2}>
                {member.user.bio}
              </Text>
            )}
            <Text style={[styles.requestDate, { color: colors.TEXT.LIGHT }]}>
              {t('group:manage.requestDate', { date: formatDateKorean(new Date(member.joinedAt)) })}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton, { backgroundColor: colors.PRIMARY }]}
            onPress={() => handleApprove(member)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={[styles.approveButtonText, { color: colors.TEXT.WHITE }]}>{t('group:manage.actions.approve')}</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton, { backgroundColor: colors.SURFACE, borderColor: colors.ERROR }]}
            onPress={() => handleReject(member)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.ERROR} />
            ) : (
              <Text style={[styles.rejectButtonText, { color: colors.ERROR }]}>{t('group:manage.actions.reject')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.BACKGROUND }]}>
        <ActivityIndicator size="large" color={colors.PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <View style={[styles.header, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.headerButton, { color: colors.PRIMARY }]}>{t('common:buttons.close')}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>{t('group:manage.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={[styles.content, { backgroundColor: colors.BACKGROUND }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.PRIMARY}
          />
        }
      >
        {pendingMembers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.TEXT.LIGHT }]}>{t('group:manage.empty')}</Text>
          </View>
        ) : (
          <>
            <Text style={[styles.countText, { color: colors.TEXT.SECONDARY }]}>
              {t('group:manage.countText', { count: pendingMembers.length })}
            </Text>
            {pendingMembers.map(renderMember)}
          </>
        )}

        <View style={[styles.infoBox, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}>
          <Text style={[styles.infoTitle, { color: colors.TEXT.PRIMARY }]}>{t('group:manage.info.title')}</Text>
          <Text style={[styles.infoText, { color: colors.TEXT.SECONDARY }]}>
            {t('group:manage.info.approval')}{'\n'}
            {t('group:manage.info.reapply')}{'\n'}
            {t('group:manage.info.inappropriate')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerButton: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.PRIMARY,
  },
  headerTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  content: {
    flex: 1,
    padding: SPACING.MD,
  },
  countText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SPACING.MD,
  },
  memberCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  memberInfo: {
    flexDirection: 'row',
    marginBottom: SPACING.MD,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: SPACING.MD,
  },
  memberDetails: {
    flex: 1,
  },
  nickname: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 2,
  },
  ageGender: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 4,
  },
  bio: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 4,
    lineHeight: 18,
  },
  requestDate: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.LIGHT,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.SM,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  approveButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  rejectButton: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.ERROR,
  },
  approveButtonText: {
    color: 'white',
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
  },
  rejectButtonText: {
    color: COLORS.ERROR,
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XXL * 2,
  },
  emptyText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.LIGHT,
  },
  infoBox: {
    backgroundColor: COLORS.SURFACE,
    padding: SPACING.MD,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginTop: SPACING.MD,
  },
  infoTitle: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.SM,
  },
  infoText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    lineHeight: 20,
  },
});