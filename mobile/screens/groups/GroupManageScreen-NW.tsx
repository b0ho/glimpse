import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useTheme } from '@/hooks/useTheme';
import { groupApi } from '@/services/api/groupApi';
import { formatDateKorean } from '@/shared/utils';
import { cn } from '@/lib/utils';

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
  const { t } = useAndroidSafeTranslation();
  const { colors, isDarkMode } = useTheme();

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
      <View key={member.id} className={cn(
        "mb-4 p-4 rounded-xl border",
        "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
      )}>
        <View className="flex-row mb-4">
          <Image
            source={{ 
              uri: member.user.profileImage || 'https://via.placeholder.com/100' 
            }}
            className="w-15 h-15 rounded-full mr-4"
          />
          <View className="flex-1">
            <Text className={cn(
              "text-base font-semibold mb-0.5",
              "text-gray-900 dark:text-white"
            )}>{member.user.nickname}</Text>
            {member.user.age && member.user.gender && (
              <Text className={cn(
                "text-sm mb-1",
                "text-gray-600 dark:text-gray-400"
              )}>
                {member.user.age}{t('common:age')} • {member.user.gender === 'MALE' ? t('common:gender.male') : t('common:gender.female')}
              </Text>
            )}
            {member.user.bio && (
              <Text className={cn(
                "text-sm mb-1 leading-5",
                "text-gray-600 dark:text-gray-400"
              )} numberOfLines={2}>
                {member.user.bio}
              </Text>
            )}
            <Text className={cn(
              "text-xs",
              "text-gray-400 dark:text-gray-500"
            )}>
              {t('group:manage.requestDate', { date: formatDateKorean(new Date(member.joinedAt)) })}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          <TouchableOpacity
            className={cn(
              "flex-1 py-2.5 rounded-lg items-center justify-center",
              isProcessing ? "opacity-60" : "",
              "bg-blue-500"
            )}
            onPress={() => handleApprove(member)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white text-sm font-semibold">{t('group:manage.actions.approve')}</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            className={cn(
              "flex-1 py-2.5 rounded-lg items-center justify-center border",
              isProcessing ? "opacity-60" : "",
              "bg-white dark:bg-gray-900 border-red-500"
            )}
            onPress={() => handleReject(member)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.ERROR} />
            ) : (
              <Text className="text-red-500 text-sm font-semibold">{t('group:manage.actions.reject')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View className={cn(
        "flex-1 justify-center items-center",
        "bg-gray-50 dark:bg-gray-950"
      )}>
        <ActivityIndicator size="large" color={colors.PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView className={cn("flex-1 bg-gray-50 dark:bg-gray-950")}>
      <View className={cn(
        "flex-row justify-between items-center px-4 py-3 border-b",
        "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
      )}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className={cn(
            "text-base",
            "text-blue-500 dark:text-blue-400"
          )}>{t('common:buttons.close')}</Text>
        </TouchableOpacity>
        <Text className={cn(
          "text-lg font-bold",
          "text-gray-900 dark:text-white"
        )}>{t('group:manage.title')}</Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.PRIMARY}
          />
        }
      >
        {pendingMembers.length === 0 ? (
          <View className="flex-1 justify-center items-center py-24">
            <Text className={cn(
              "text-base",
              "text-gray-400 dark:text-gray-500"
            )}>{t('group:manage.empty')}</Text>
          </View>
        ) : (
          <>
            <Text className={cn(
              "text-base mb-4",
              "text-gray-600 dark:text-gray-400"
            )}>
              {t('group:manage.countText', { count: pendingMembers.length })}
            </Text>
            {pendingMembers.map(renderMember)}
          </>
        )}

        <View className={cn(
          "p-4 rounded-lg border mt-4",
          "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
        )}>
          <Text className={cn(
            "text-sm font-semibold mb-2",
            "text-gray-900 dark:text-white"
          )}>{t('group:manage.info.title')}</Text>
          <Text className={cn(
            "text-sm leading-5",
            "text-gray-600 dark:text-gray-400"
          )}>
            {t('group:manage.info.approval')}{'\n'}
            {t('group:manage.info.reapply')}{'\n'}
            {t('group:manage.info.inappropriate')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};