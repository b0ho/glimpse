import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '@/utils/constants';
import { useAuthStore } from '@/store/slices/authSlice';
import { authService } from '@/services/api/authService';

export const DeleteAccountScreen = () => {
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const { user, clearAuth } = useAuthStore();
  
  const [deleteReason, setDeleteReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const reasons = [
    { id: 'not_useful', text: '앱이 더 이상 필요하지 않아요' },
    { id: 'privacy_concern', text: '개인정보 보호가 걱정돼요' },
    { id: 'found_partner', text: '좋은 사람을 만났어요' },
    { id: 'technical_issues', text: '기술적 문제가 많아요' },
    { id: 'other', text: '기타 이유' },
  ];
  
  const handleDelete = async () => {
    if (confirmText !== '탈퇴하기') {
      Alert.alert('알림', '확인 문구를 정확히 입력해주세요.');
      return;
    }
    
    Alert.alert(
      '최종 확인',
      '정말로 계정을 삭제하시겠습니까?\n\n• 30일 내 로그인 시 복구 가능\n• 30일 후 모든 데이터 영구 삭제\n• 프리미엄 구독은 즉시 해지',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴',
          style: 'destructive',
          onPress: handleDeleteConfirmed,
        },
      ]
    );
  };
  
  const handleDeleteConfirmed = async () => {
    setIsDeleting(true);
    
    try {
      // API 호출
      const response = await authService.deleteAccount({
        reason: deleteReason,
      });
      
      if (response.success) {
        Alert.alert(
          '탈퇴 완료',
          '계정이 비활성화되었습니다.\n30일 내 로그인 시 복구할 수 있습니다.',
          [
            {
              text: '확인',
              onPress: async () => {
                // 로그아웃 및 스토어 초기화
                await signOut();
                clearAuth();
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert('오류', response.message || '탈퇴 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      Alert.alert('오류', '탈퇴 처리 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>회원 탈퇴</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={48} color={COLORS.ERROR} />
          <Text style={styles.warningTitle}>탈퇴 전 확인해주세요</Text>
          <Text style={styles.warningText}>
            회원 탈퇴 시 다음과 같은 작업이 수행됩니다:
          </Text>
          
          <View style={styles.warningList}>
            <View style={styles.warningItem}>
              <Text style={styles.warningBullet}>•</Text>
              <Text style={styles.warningItemText}>
                모든 프로필 정보와 사진이 삭제됩니다
              </Text>
            </View>
            <View style={styles.warningItem}>
              <Text style={styles.warningBullet}>•</Text>
              <Text style={styles.warningItemText}>
                모든 매칭과 대화 내용이 삭제됩니다
              </Text>
            </View>
            <View style={styles.warningItem}>
              <Text style={styles.warningBullet}>•</Text>
              <Text style={styles.warningItemText}>
                구매한 크레딧과 프리미엄 구독이 취소됩니다
              </Text>
            </View>
            <View style={styles.warningItem}>
              <Text style={styles.warningBullet}>•</Text>
              <Text style={styles.warningItemText}>
                30일 간 계정 복구 기간이 주어집니다
              </Text>
            </View>
            <View style={styles.warningItem}>
              <Text style={styles.warningBullet}>•</Text>
              <Text style={styles.warningItemText}>
                30일 후 모든 데이터가 영구적으로 삭제됩니다
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>탈퇴 사유 (선택)</Text>
          <View style={styles.reasonContainer}>
            {reasons.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonItem,
                  deleteReason === reason.id && styles.reasonItemSelected,
                ]}
                onPress={() => setDeleteReason(reason.id)}
              >
                <View style={[
                  styles.radio,
                  deleteReason === reason.id && styles.radioSelected,
                ]}>
                  {deleteReason === reason.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Text style={styles.reasonText}>{reason.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>탈퇴 확인</Text>
          <Text style={styles.confirmDescription}>
            탈퇴를 진행하려면 아래에 <Text style={styles.confirmHighlight}>탈퇴하기</Text>를 입력해주세요.
          </Text>
          <TextInput
            style={styles.confirmInput}
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder="탈퇴하기"
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isDeleting}
          />
        </View>
        
        <TouchableOpacity
          style={[
            styles.deleteButton,
            confirmText !== '탈퇴하기' && styles.deleteButtonDisabled,
          ]}
          onPress={handleDelete}
          disabled={confirmText !== '탈퇴하기' || isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.deleteButtonText}>회원 탈퇴</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isDeleting}
        >
          <Text style={styles.cancelButtonText}>취소</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  warningCard: {
    backgroundColor: COLORS.ERROR + '10',
    borderRadius: 12,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.ERROR + '20',
  },
  warningTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.ERROR,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  warningText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  warningList: {
    width: '100%',
  },
  warningItem: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  warningBullet: {
    ...TYPOGRAPHY.body,
    color: COLORS.ERROR,
    marginRight: SPACING.xs,
  },
  warningItemText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
  },
  section: {
    marginTop: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  reasonContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  reasonItemSelected: {
    backgroundColor: COLORS.primary + '05',
    marginHorizontal: -SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  reasonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  confirmDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  confirmHighlight: {
    fontWeight: '700',
    color: COLORS.ERROR,
  },
  confirmInput: {
    ...TYPOGRAPHY.body,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    color: COLORS.text,
  },
  deleteButton: {
    backgroundColor: COLORS.ERROR,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  deleteButtonDisabled: {
    backgroundColor: COLORS.gray300,
  },
  deleteButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  cancelButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
});