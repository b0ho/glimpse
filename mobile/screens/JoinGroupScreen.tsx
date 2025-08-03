import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { groupApi } from '@/services/api/groupApi';
import { useGroupStore } from '@/store/slices/groupSlice';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

interface GroupInfo {
  id: string;
  name: string;
  type: string;
  description?: string;
  memberCount?: number;
}

export const JoinGroupScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { inviteCode } = route.params as { inviteCode: string };
  
  const groupStore = useGroupStore();
  const [isLoading, setIsLoading] = useState(false);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    // 초대 코드에서 그룹 정보를 가져오는 로직이 필요할 수 있음
    // 현재는 바로 가입 시도
  }, [inviteCode]);

  const handleJoinGroup = async () => {
    setIsJoining(true);
    try {
      const result = await groupApi.joinGroupByInvite(inviteCode);
      
      // 그룹 스토어 업데이트
      const group = await groupApi.getGroupById(result.group.id);
      groupStore.joinGroup(group);

      if (result.requiresApproval) {
        Alert.alert(
          '가입 신청 완료',
          '그룹 관리자의 승인을 기다리고 있습니다.',
          [
            {
              text: '확인',
              onPress: () => navigation.navigate('Groups' as never),
            },
          ]
        );
      } else {
        Alert.alert(
          '가입 완료! 🎉',
          `${result.group.name} 그룹에 성공적으로 가입했습니다.`,
          [
            {
              text: '그룹으로 이동',
              onPress: () => navigation.navigate('GroupDetail' as never, { groupId: result.group.id } as never),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Join group error:', error);
      
      let errorMessage = '그룹 가입에 실패했습니다.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('오류', errorMessage, [
        {
          text: '확인',
          onPress: () => navigation.goBack(),
        },
      ]);
    } finally {
      setIsJoining(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>그룹 초대</Text>
          
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>초대 코드</Text>
            <Text style={styles.codeText}>{inviteCode}</Text>
          </View>

          {groupInfo && (
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{groupInfo.name}</Text>
              {groupInfo.description && (
                <Text style={styles.groupDescription}>{groupInfo.description}</Text>
              )}
              {groupInfo.memberCount && (
                <Text style={styles.groupMembers}>
                  현재 {groupInfo.memberCount}명 참여 중
                </Text>
              )}
            </View>
          )}

          <Text style={styles.description}>
            이 그룹에 가입하시겠습니까?{'\n'}
            가입 후 그룹 멤버들과 익명으로 매칭될 수 있습니다.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isJoining}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.joinButton]}
              onPress={handleJoinGroup}
              disabled={isJoining}
            >
              {isJoining ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.joinButtonText}>가입하기</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>안내사항</Text>
          <Text style={styles.noticeText}>
            • 그룹 가입은 무료입니다{'\n'}
            • 언제든지 그룹을 나갈 수 있습니다{'\n'}
            • 부적절한 행동 시 그룹에서 제외될 수 있습니다
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    flex: 1,
    padding: SPACING.MD,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: SPACING.XL,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },
  codeContainer: {
    backgroundColor: COLORS.BACKGROUND,
    padding: SPACING.MD,
    borderRadius: 8,
    marginBottom: SPACING.LG,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SPACING.XS,
  },
  codeText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    letterSpacing: 2,
  },
  groupInfo: {
    marginBottom: SPACING.LG,
    paddingBottom: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  groupName: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.SM,
  },
  groupDescription: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SPACING.SM,
  },
  groupMembers: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.LIGHT,
  },
  description: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.XL,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.MD,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.MD,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: COLORS.TEXT.LIGHT,
  },
  joinButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  joinButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: 'white',
  },
  notice: {
    marginTop: SPACING.XL,
    padding: SPACING.MD,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  noticeTitle: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.SM,
  },
  noticeText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    lineHeight: 20,
  },
});