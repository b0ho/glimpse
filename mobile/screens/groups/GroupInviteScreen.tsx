/**
 * 그룹 초대 화면
 *
 * @screen
 * @description 그룹 초대 링크 및 QR 코드를 생성하고 공유하는 화면, SMS 초대 기능 포함
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
  ScrollView,
  Clipboard,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useTheme } from '@/hooks/useTheme';
import { groupApi } from '@/services/api/groupApi';
import QRCode from 'react-native-qrcode-svg';
import { cn } from '@/lib/utils';
import Icon from 'react-native-vector-icons/Ionicons';

interface GroupInvite {
  id: string;
  inviteCode: string;
  createdBy: {
    id: string;
    nickname: string;
  };
  createdAt: Date;
  expiresAt: Date;
  uses: number;
  maxUses: number | null;
  link: string;
}

/**
 * 그룹 초대 화면 컴포넌트
 *
 * @component
 * @returns {JSX.Element}
 *
 * @description
 * 그룹 멤버를 초대하는 다양한 방법을 제공하는 화면
 * - QR 코드 생성 및 표시
 * - 초대 링크 생성 및 복사
 * - SNS 공유 기능
 * - SMS 초대 발송 (전화번호 입력)
 * - 활성 초대 목록 관리
 * - 초대 코드 삭제 기능
 *
 * @navigation
 * - From: 그룹 상세 화면의 초대 버튼
 * - To: 공유 화면, SMS 앱
 *
 * @example
 * ```tsx
 * navigation.navigate('GroupInvite', {
 *   groupId: 'group-123'
 * });
 * ```
 */
export const GroupInviteScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupId } = route.params as { groupId: string };
  const { t } = useAndroidSafeTranslation();
  const { colors } = useTheme();

  const [inviteLink, setInviteLink] = useState<string>('');
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    loadInvites();
  }, [groupId]);

  const loadInvites = async () => {
    try {
      const invitesList = await groupApi.getGroupInvites(groupId);
      setInvites(invitesList);
      
      // 활성 초대 링크가 있으면 사용
      const activeInvite = invitesList.find(inv => new Date(inv.expiresAt) > new Date());
      if (activeInvite) {
        setInviteLink(activeInvite.link);
      }
    } catch (error) {
      console.error('Failed to load invites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateInviteLink = async () => {
    setIsGenerating(true);
    try {
      const link = await groupApi.generateInviteLink(groupId);
      setInviteLink(link);
      await loadInvites(); // 초대 목록 새로고침
      Alert.alert(t('group:invite.alerts.generateSuccess.title'), t('group:invite.alerts.generateSuccess.message'));
    } catch (error: any) {
      Alert.alert(t('group:invite.alerts.generateError.title'), error.response?.data?.message || t('group:invite.alerts.generateError.message'));
    } finally {
      setIsGenerating(false);
    }
  };

  const shareInviteLink = async () => {
    if (!inviteLink) {
      await generateInviteLink();
      return;
    }

    try {
      await Share.share({
        message: t('group:invite.link.shareMessage', { link: inviteLink }),
        title: t('group:invite.link.shareTitle'),
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const copyToClipboard = () => {
    if (!inviteLink) return;
    
    Clipboard.setString(inviteLink);
    Alert.alert(t('group:invite.alerts.copied.title'), t('group:invite.alerts.copied.message'));
  };

  const sendSMSInvites = async () => {
    if (!phoneNumbers.trim()) {
      Alert.alert(t('group:invite.alerts.validation.title'), t('group:invite.alerts.validation.phone'));
      return;
    }

    setIsInviting(true);
    try {
      const numbers = phoneNumbers.split(',').map(num => num.trim());
      await groupApi.sendSMSInvites(groupId, numbers);
      Alert.alert(t('group:invite.alerts.smsSuccess.title'), t('group:invite.alerts.smsSuccess.message'));
      setPhoneNumbers('');
    } catch (error: any) {
      Alert.alert(t('group:invite.alerts.smsError.title'), error.response?.data?.message || t('group:invite.alerts.smsError.message'));
    } finally {
      setIsInviting(false);
    }
  };

  const revokeInvite = async (inviteId: string) => {
    try {
      await groupApi.revokeInvite(groupId, inviteId);
      await loadInvites();
      Alert.alert(t('group:invite.alerts.revokeSuccess.title'), t('group:invite.alerts.revokeSuccess.message'));
    } catch (error: any) {
      Alert.alert(t('group:invite.alerts.revokeError.title'), error.response?.data?.message || t('group:invite.alerts.revokeError.message'));
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className={cn('flex-1 justify-center items-center bg-gray-50 dark:bg-gray-950')}>
        <ActivityIndicator size="large" color={colors.PRIMARY} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={cn('flex-1 bg-gray-50 dark:bg-gray-950')}>
      <View className={cn(
        "flex-row items-center px-4 py-3 border-b",
        "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
      )}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} color={colors.TEXT.PRIMARY} />
        </TouchableOpacity>
        <Text className={cn(
          "flex-1 text-center text-lg font-semibold mr-6",
          "text-gray-900 dark:text-white"
        )}>{t('group:invite.title')}</Text>
      </View>

      <ScrollView className="flex-1">
        {/* QR Code Section */}
        <View className={cn(
          "m-4 p-4 rounded-xl items-center",
          "bg-white dark:bg-gray-900"
        )}>
          <Text className={cn(
            "text-lg font-semibold mb-4",
            "text-gray-900 dark:text-white"
          )}>{t('group:invite.qr.title')}</Text>
          
          {inviteLink ? (
            <View className="bg-white p-4 rounded-lg">
              <QRCode
                value={inviteLink}
                size={200}
                color="#000000"
                backgroundColor="#FFFFFF"
              />
            </View>
          ) : (
            <TouchableOpacity
              className="w-52 h-52 bg-gray-200 rounded-lg justify-center items-center"
              onPress={generateInviteLink}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="large" color={colors.PRIMARY} />
              ) : (
                <>
                  <Icon name="qr-code-outline" size={48} color="#9CA3AF" />
                  <Text className="text-gray-500 mt-2">{t('group:invite.qr.generate')}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Invite Link Section */}
        <View className={cn(
          "mx-4 mb-4 p-4 rounded-xl",
          "bg-white dark:bg-gray-900"
        )}>
          <Text className={cn(
            "text-lg font-semibold mb-3",
            "text-gray-900 dark:text-white"
          )}>{t('group:invite.link.title')}</Text>
          
          {inviteLink ? (
            <View className={cn(
              "p-3 rounded-lg mb-3",
              "bg-gray-100 dark:bg-gray-800"
            )}>
              <Text className={cn(
                "text-sm",
                "text-gray-700 dark:text-gray-300"
              )} numberOfLines={2}>{inviteLink}</Text>
            </View>
          ) : (
            <Text className={cn(
              "text-center py-4",
              "text-gray-400 dark:text-gray-500"
            )}>{t('group:invite.link.noLink')}</Text>
          )}
          
          <View className="flex-row justify-between gap-2">
            <TouchableOpacity
              className={cn(
                "flex-1 py-3 rounded-lg items-center",
                inviteLink ? "bg-primary-500" : "bg-gray-300"
              )}
              onPress={copyToClipboard}
              disabled={!inviteLink}
            >
              <Text className="text-white font-semibold">{t('group:invite.link.copy')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-1 bg-blue-500 py-3 rounded-lg items-center"
              onPress={shareInviteLink}
            >
              <Text className="text-white font-semibold">{t('group:invite.link.share')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SMS Invite Section */}
        <View className={cn(
          "mx-4 mb-4 p-4 rounded-xl",
          "bg-white dark:bg-gray-900"
        )}>
          <Text className={cn(
            "text-lg font-semibold mb-3",
            "text-gray-900 dark:text-white"
          )}>{t('group:invite.sms.title')}</Text>
          
          <TextInput
            className={cn(
              "p-3 rounded-lg mb-3",
              "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
            )}
            placeholder={t('group:invite.sms.placeholder')}
            placeholderTextColor={colors.TEXT.SECONDARY}
            value={phoneNumbers}
            onChangeText={setPhoneNumbers}
            keyboardType="phone-pad"
            multiline
          />
          
          <TouchableOpacity
            className={cn(
              "py-3 rounded-lg items-center",
              phoneNumbers.trim() ? "bg-green-500" : "bg-gray-300"
            )}
            onPress={sendSMSInvites}
            disabled={!phoneNumbers.trim() || isInviting}
          >
            {isInviting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-semibold">{t('group:invite.sms.send')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Active Invites List */}
        {invites.length > 0 && (
          <View className={cn(
            "mx-4 mb-4 p-4 rounded-xl",
            "bg-white dark:bg-gray-900"
          )}>
            <Text className={cn(
              "text-lg font-semibold mb-3",
              "text-gray-900 dark:text-white"
            )}>{t('group:invite.active.title')}</Text>
            
            {invites.map((invite) => (
              <View
                key={invite.id}
                className={cn(
                  "p-3 rounded-lg mb-2",
                  "bg-gray-100 dark:bg-gray-800"
                )}
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className={cn(
                      "text-sm font-medium",
                      "text-gray-900 dark:text-white"
                    )}>{invite.inviteCode}</Text>
                    <Text className={cn(
                      "text-xs mt-1",
                      "text-gray-600 dark:text-gray-400"
                    )}>
                      {t('group:invite.active.uses', { current: invite.uses, max: invite.maxUses || '∞' })}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => revokeInvite(invite.id)}
                    className="p-2"
                  >
                    <Icon name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};