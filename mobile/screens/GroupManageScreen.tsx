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
import { groupApi } from '@/services/api/groupApi';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { formatDateKorean } from '@shared/utils';

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
      <View key={member.id} style={styles.memberCard}>
        <View style={styles.memberInfo}>
          <Image
            source={{ 
              uri: member.user.profileImage || 'https://via.placeholder.com/100' 
            }}
            style={styles.profileImage}
          />
          <View style={styles.memberDetails}>
            <Text style={styles.nickname}>{member.user.nickname}</Text>
            {member.user.age && member.user.gender && (
              <Text style={styles.ageGender}>
                {member.user.age}{t('common:age')} • {member.user.gender === 'MALE' ? t('common:gender.male') : t('common:gender.female')}
              </Text>
            )}
            {member.user.bio && (
              <Text style={styles.bio} numberOfLines={2}>
                {member.user.bio}
              </Text>
            )}
            <Text style={styles.requestDate}>
              {t('group:manage.requestDate', { date: formatDateKorean(new Date(member.joinedAt)) })}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(member)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.approveButtonText}>{t('group:manage.actions.approve')}</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(member)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={COLORS.ERROR} />
            ) : (
              <Text style={styles.rejectButtonText}>{t('group:manage.actions.reject')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerButton}>{t('common:buttons.close')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('group:manage.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.PRIMARY}
          />
        }
      >
        {pendingMembers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('group:manage.empty')}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.countText}>
              {t('group:manage.countText', { count: pendingMembers.length })}
            </Text>
            {pendingMembers.map(renderMember)}
          </>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>{t('group:manage.info.title')}</Text>
          <Text style={styles.infoText}>
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