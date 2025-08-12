import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { groupApi } from '@/services/api/groupApi';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import QRCode from 'react-native-qrcode-svg';

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

export const GroupInviteScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupId } = route.params as { groupId: string };
  const { t } = useTranslation();
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

  const inviteByPhoneNumbers = async () => {
    if (!phoneNumbers.trim()) {
      Alert.alert(t('group:invite.alerts.phoneRequired.title'), t('group:invite.alerts.phoneRequired.message'));
      return;
    }

    const numbers = phoneNumbers.split(',').map(num => num.trim()).filter(num => num);
    if (numbers.length === 0) {
      Alert.alert(t('group:invite.alerts.phoneInvalid.title'), t('group:invite.alerts.phoneInvalid.message'));
      return;
    }

    setIsInviting(true);
    try {
      const result = await groupApi.inviteToGroup(groupId, numbers);
      
      const invited = result.filter((r: any) => r.status === 'invited').length;
      const notFound = result.filter((r: any) => r.status === 'user_not_found').length;
      const errors = result.filter((r: any) => r.status === 'error').length;

      let message = '';
      if (invited > 0) message += t('group:invite.alerts.inviteResult.invited', { count: invited }) + '\n';
      if (notFound > 0) message += t('group:invite.alerts.inviteResult.notFound', { count: notFound }) + '\n';
      if (errors > 0) message += t('group:invite.alerts.inviteResult.errors', { count: errors });

      Alert.alert(t('group:invite.alerts.inviteResult.title'), message.trim());
      setPhoneNumbers('');
    } catch (error: any) {
      Alert.alert(t('group:invite.alerts.inviteError.title'), error.response?.data?.message || t('group:invite.alerts.inviteError.message'));
    } finally {
      setIsInviting(false);
    }
  };

  const revokeInvite = async (inviteId: string) => {
    Alert.alert(
      t('group:invite.alerts.revokeConfirm.title'),
      t('group:invite.alerts.revokeConfirm.message'),
      [
        { text: t('group:invite.alerts.revokeConfirm.cancel'), style: 'cancel' },
        {
          text: t('group:invite.alerts.revokeConfirm.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await groupApi.revokeInvite(inviteId);
              await loadInvites();
              Alert.alert(t('group:invite.alerts.revokeSuccess.title'), t('group:invite.alerts.revokeSuccess.message'));
            } catch (error: any) {
              Alert.alert(t('group:invite.alerts.revokeError.title'), error.response?.data?.message || t('group:invite.alerts.revokeError.message'));
            }
          },
        },
      ]
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
        <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>{t('group:invite.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={[styles.content, { backgroundColor: colors.BACKGROUND }]}>
        {/* QR 코드 섹션 */}
        <View style={styles.qrSection}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>{t('group:invite.qr.title')}</Text>
          {inviteLink ? (
            <View style={[styles.qrContainer, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}>
              <QRCode
                value={inviteLink}
                size={200}
                backgroundColor="white"
              />
              <Text style={[styles.qrHelperText, { color: colors.TEXT.SECONDARY }]}>
                {t('group:invite.qr.helperText')}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.generateButton, { backgroundColor: colors.PRIMARY }]}
              onPress={generateInviteLink}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={[styles.generateButtonText, { color: colors.TEXT.WHITE }]}>{t('group:invite.qr.generate')}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* 링크 공유 섹션 */}
        {inviteLink && (
          <View style={styles.linkSection}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>{t('group:invite.link.title')}</Text>
            <View style={[styles.linkContainer, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}>
              <Text style={[styles.linkText, { color: colors.TEXT.SECONDARY }]} numberOfLines={1}>
                {inviteLink}
              </Text>
              <View style={styles.linkActions}>
                <TouchableOpacity
                  style={[styles.linkButton, { backgroundColor: colors.TEXT.LIGHT }]}
                  onPress={copyToClipboard}
                >
                  <Text style={[styles.linkButtonText, { color: colors.TEXT.WHITE }]}>{t('group:invite.link.copy')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.linkButton, styles.shareButton, { backgroundColor: colors.PRIMARY }]}
                  onPress={shareInviteLink}
                >
                  <Text style={[styles.linkButtonText, { color: colors.TEXT.WHITE }]}>{t('group:invite.link.share')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* 전화번호로 초대 섹션 */}
        <View style={styles.phoneSection}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>{t('group:invite.phone.title')}</Text>
          <Text style={[styles.helperText, { color: colors.TEXT.SECONDARY }]}>
            {t('group:invite.phone.helperText')}
          </Text>
          <TextInput
            style={[styles.phoneInput, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER, color: colors.TEXT.PRIMARY }]}
            placeholder={t('group:invite.phone.placeholder')}
            placeholderTextColor={colors.TEXT.LIGHT}
            value={phoneNumbers}
            onChangeText={setPhoneNumbers}
            keyboardType="phone-pad"
          />
          <TouchableOpacity
            style={[
              [styles.inviteButton, { backgroundColor: colors.PRIMARY }],
              !phoneNumbers.trim() && [styles.inviteButtonDisabled, { backgroundColor: colors.TEXT.LIGHT }]
            ]}
            onPress={inviteByPhoneNumbers}
            disabled={isInviting || !phoneNumbers.trim()}
          >
            {isInviting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={[styles.inviteButtonText, { color: colors.TEXT.WHITE }]}>{t('group:invite.phone.button')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 활성 초대 목록 */}
        {invites.length > 0 && (
          <View style={styles.invitesSection}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>{t('group:invite.active.title')}</Text>
            {invites.map(invite => {
              const isExpired = new Date(invite.expiresAt) < new Date();
              return (
                <View key={invite.id} style={[
                  styles.inviteItem,
                  { backgroundColor: colors.SURFACE, borderColor: colors.BORDER },
                  isExpired && styles.inviteItemExpired
                ]}>
                  <View style={styles.inviteInfo}>
                    <Text style={[styles.inviteCode, { color: colors.TEXT.PRIMARY }]}>{t('group:invite.active.code', { code: invite.inviteCode })}</Text>
                    <Text style={[styles.inviteStats, { color: colors.TEXT.SECONDARY }]}>
                      {t('group:invite.active.stats', {
                        uses: invite.uses,
                        maxUses: invite.maxUses ? t('group:invite.active.maxUses', { count: invite.maxUses }) : '',
                        expiry: isExpired ? t('group:invite.active.expired') : t('group:invite.active.expiresOn', { date: new Date(invite.expiresAt).toLocaleDateString() })
                      })}
                    </Text>
                  </View>
                  {!isExpired && (
                    <TouchableOpacity
                      style={styles.revokeButton}
                      onPress={() => revokeInvite(invite.id)}
                    >
                      <Text style={[styles.revokeButtonText, { color: colors.ERROR }]}>{t('group:invite.active.revoke')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}
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
  qrSection: {
    marginBottom: SPACING.XL,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.MD,
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    padding: SPACING.LG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  qrHelperText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginTop: SPACING.MD,
    textAlign: 'center',
  },
  generateButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.MD,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateButtonText: {
    color: 'white',
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  linkSection: {
    marginBottom: SPACING.XL,
  },
  linkContainer: {
    backgroundColor: COLORS.SURFACE,
    padding: SPACING.MD,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  linkText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SPACING.SM,
  },
  linkActions: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  linkButton: {
    flex: 1,
    backgroundColor: COLORS.TEXT.LIGHT,
    paddingVertical: SPACING.SM,
    borderRadius: 6,
    alignItems: 'center',
  },
  shareButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  linkButtonText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: 'white',
  },
  phoneSection: {
    marginBottom: SPACING.XL,
  },
  helperText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SPACING.SM,
  },
  phoneInput: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    padding: SPACING.MD,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.MD,
  },
  inviteButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.MD,
    borderRadius: 8,
    alignItems: 'center',
  },
  inviteButtonDisabled: {
    backgroundColor: COLORS.TEXT.LIGHT,
  },
  inviteButtonText: {
    color: 'white',
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  invitesSection: {
    marginBottom: SPACING.XL,
  },
  inviteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    padding: SPACING.MD,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginBottom: SPACING.SM,
  },
  inviteItemExpired: {
    opacity: 0.6,
  },
  inviteInfo: {
    flex: 1,
  },
  inviteCode: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  inviteStats: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 2,
  },
  revokeButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  revokeButtonText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.ERROR,
    fontWeight: '600',
  },
});