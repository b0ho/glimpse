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

export const GroupInviteScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupId } = route.params as { groupId: string };

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
      Alert.alert('성공', '새로운 초대 링크가 생성되었습니다.');
    } catch (error: any) {
      Alert.alert('오류', error.response?.data?.message || '초대 링크 생성에 실패했습니다.');
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
        message: `Glimpse 그룹에 초대합니다!\n\n${inviteLink}\n\n위 링크를 클릭하여 그룹에 참여하세요.`,
        title: 'Glimpse 그룹 초대',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const copyToClipboard = () => {
    if (!inviteLink) return;
    
    Clipboard.setString(inviteLink);
    Alert.alert('복사됨', '초대 링크가 클립보드에 복사되었습니다.');
  };

  const inviteByPhoneNumbers = async () => {
    if (!phoneNumbers.trim()) {
      Alert.alert('오류', '전화번호를 입력해주세요.');
      return;
    }

    const numbers = phoneNumbers.split(',').map(num => num.trim()).filter(num => num);
    if (numbers.length === 0) {
      Alert.alert('오류', '유효한 전화번호를 입력해주세요.');
      return;
    }

    setIsInviting(true);
    try {
      const result = await groupApi.inviteToGroup(groupId, numbers);
      
      const invited = result.filter((r: any) => r.status === 'invited').length;
      const notFound = result.filter((r: any) => r.status === 'user_not_found').length;
      const errors = result.filter((r: any) => r.status === 'error').length;

      let message = '';
      if (invited > 0) message += `${invited}명 초대 완료\n`;
      if (notFound > 0) message += `${notFound}명 미가입 사용자\n`;
      if (errors > 0) message += `${errors}명 초대 실패`;

      Alert.alert('초대 결과', message.trim());
      setPhoneNumbers('');
    } catch (error: any) {
      Alert.alert('오류', error.response?.data?.message || '초대에 실패했습니다.');
    } finally {
      setIsInviting(false);
    }
  };

  const revokeInvite = async (inviteId: string) => {
    Alert.alert(
      '초대 취소',
      '이 초대 링크를 취소하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupApi.revokeInvite(inviteId);
              await loadInvites();
              Alert.alert('성공', '초대가 취소되었습니다.');
            } catch (error: any) {
              Alert.alert('오류', error.response?.data?.message || '초대 취소에 실패했습니다.');
            }
          },
        },
      ]
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
          <Text style={styles.headerButton}>닫기</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>그룹 초대</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* QR 코드 섹션 */}
        <View style={styles.qrSection}>
          <Text style={styles.sectionTitle}>QR 코드로 초대</Text>
          {inviteLink ? (
            <View style={styles.qrContainer}>
              <QRCode
                value={inviteLink}
                size={200}
                backgroundColor="white"
              />
              <Text style={styles.qrHelperText}>
                QR 코드를 스캔하여 그룹에 참여할 수 있습니다
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.generateButton}
              onPress={generateInviteLink}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.generateButtonText}>초대 링크 생성</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* 링크 공유 섹션 */}
        {inviteLink && (
          <View style={styles.linkSection}>
            <Text style={styles.sectionTitle}>초대 링크</Text>
            <View style={styles.linkContainer}>
              <Text style={styles.linkText} numberOfLines={1}>
                {inviteLink}
              </Text>
              <View style={styles.linkActions}>
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={copyToClipboard}
                >
                  <Text style={styles.linkButtonText}>복사</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.linkButton, styles.shareButton]}
                  onPress={shareInviteLink}
                >
                  <Text style={styles.linkButtonText}>공유</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* 전화번호로 초대 섹션 */}
        <View style={styles.phoneSection}>
          <Text style={styles.sectionTitle}>전화번호로 초대</Text>
          <Text style={styles.helperText}>
            콤마(,)로 구분하여 여러 번호를 입력할 수 있습니다
          </Text>
          <TextInput
            style={styles.phoneInput}
            placeholder="010-1234-5678, 010-9876-5432"
            placeholderTextColor={COLORS.TEXT.LIGHT}
            value={phoneNumbers}
            onChangeText={setPhoneNumbers}
            keyboardType="phone-pad"
          />
          <TouchableOpacity
            style={[styles.inviteButton, !phoneNumbers.trim() && styles.inviteButtonDisabled]}
            onPress={inviteByPhoneNumbers}
            disabled={isInviting || !phoneNumbers.trim()}
          >
            {isInviting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.inviteButtonText}>초대하기</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 활성 초대 목록 */}
        {invites.length > 0 && (
          <View style={styles.invitesSection}>
            <Text style={styles.sectionTitle}>활성 초대 링크</Text>
            {invites.map(invite => {
              const isExpired = new Date(invite.expiresAt) < new Date();
              return (
                <View key={invite.id} style={[styles.inviteItem, isExpired && styles.inviteItemExpired]}>
                  <View style={styles.inviteInfo}>
                    <Text style={styles.inviteCode}>코드: {invite.inviteCode}</Text>
                    <Text style={styles.inviteStats}>
                      사용: {invite.uses}{invite.maxUses ? `/${invite.maxUses}` : ''} • 
                      {isExpired ? ' 만료됨' : ` ${new Date(invite.expiresAt).toLocaleDateString()} 까지`}
                    </Text>
                  </View>
                  {!isExpired && (
                    <TouchableOpacity
                      style={styles.revokeButton}
                      onPress={() => revokeInvite(invite.id)}
                    >
                      <Text style={styles.revokeButtonText}>취소</Text>
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