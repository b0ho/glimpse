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
import { useTranslation } from 'react-i18next';
// import { useAuth } from '@clerk/clerk-expo';
import { useAuth } from '@/hooks/useDevAuth';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING, TYPOGRAPHY } from '@/utils/constants';
import { useAuthStore } from '@/store/slices/authSlice';
import { authService } from '@/services/api/authService';

export const DeleteAccountScreen = () => {
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const { user, clearAuth } = useAuthStore();
  const { t } = useTranslation();
  
  const [deleteReason, setDeleteReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const reasons = [
    { id: 'not_useful', text: t('settings:deleteAccount.reason.options.not_useful') },
    { id: 'privacy_concern', text: t('settings:deleteAccount.reason.options.privacy_concern') },
    { id: 'found_partner', text: t('settings:deleteAccount.reason.options.found_partner') },
    { id: 'technical_issues', text: t('settings:deleteAccount.reason.options.technical_issues') },
    { id: 'other', text: t('settings:deleteAccount.reason.options.other') },
  ];
  
  const handleDelete = async () => {
    if (confirmText !== t('settings:deleteAccount.confirm.confirmText')) {
      Alert.alert(t('settings:deleteAccount.alerts.confirmRequired.title'), t('settings:deleteAccount.alerts.confirmRequired.message'));
      return;
    }
    
    Alert.alert(
      t('settings:deleteAccount.alerts.finalConfirm.title'),
      t('settings:deleteAccount.alerts.finalConfirm.message'),
      [
        { text: t('settings:deleteAccount.alerts.finalConfirm.cancel'), style: 'cancel' },
        {
          text: t('settings:deleteAccount.alerts.finalConfirm.delete'),
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
          t('settings:deleteAccount.alerts.success.title'),
          t('settings:deleteAccount.alerts.success.message'),
          [
            {
              text: t('common:buttons.confirm'),
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
        Alert.alert(t('settings:deleteAccount.alerts.error.title'), response.message || t('settings:deleteAccount.alerts.error.message'));
      }
    } catch (error) {
      console.error('Delete account error:', error);
      Alert.alert(t('settings:deleteAccount.alerts.error.title'), t('settings:deleteAccount.alerts.error.message'));
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
        <Text style={styles.headerTitle}>{t('settings:deleteAccount.title')}</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={48} color={COLORS.ERROR} />
          <Text style={styles.warningTitle}>{t('settings:deleteAccount.warning.title')}</Text>
          <Text style={styles.warningText}>
            {t('settings:deleteAccount.warning.description')}
          </Text>
          
          <View style={styles.warningList}>
            <View style={styles.warningItem}>
              <Text style={styles.warningBullet}>•</Text>
              <Text style={styles.warningItemText}>
                {t('settings:deleteAccount.warning.items.profile')}
              </Text>
            </View>
            <View style={styles.warningItem}>
              <Text style={styles.warningBullet}>•</Text>
              <Text style={styles.warningItemText}>
                {t('settings:deleteAccount.warning.items.matches')}
              </Text>
            </View>
            <View style={styles.warningItem}>
              <Text style={styles.warningBullet}>•</Text>
              <Text style={styles.warningItemText}>
                {t('settings:deleteAccount.warning.items.credits')}
              </Text>
            </View>
            <View style={styles.warningItem}>
              <Text style={styles.warningBullet}>•</Text>
              <Text style={styles.warningItemText}>
                {t('settings:deleteAccount.warning.items.recovery')}
              </Text>
            </View>
            <View style={styles.warningItem}>
              <Text style={styles.warningBullet}>•</Text>
              <Text style={styles.warningItemText}>
                {t('settings:deleteAccount.warning.items.permanent')}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings:deleteAccount.reason.title')}</Text>
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
          <Text style={styles.sectionTitle}>{t('settings:deleteAccount.confirm.title')}</Text>
          <Text style={styles.confirmDescription}>
            {t('settings:deleteAccount.confirm.description')} <Text style={styles.confirmHighlight}>{t('settings:deleteAccount.confirm.confirmText')}</Text>{t('settings:deleteAccount.confirm.descriptionEnd')}
          </Text>
          <TextInput
            style={styles.confirmInput}
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder={t('settings:deleteAccount.confirm.placeholder')}
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isDeleting}
          />
        </View>
        
        <TouchableOpacity
          style={[
            styles.deleteButton,
            confirmText !== t('settings:deleteAccount.confirm.confirmText') && styles.deleteButtonDisabled,
          ]}
          onPress={handleDelete}
          disabled={confirmText !== t('settings:deleteAccount.confirm.confirmText') || isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.deleteButtonText}>{t('settings:deleteAccount.confirm.button')}</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isDeleting}
        >
          <Text style={styles.cancelButtonText}>{t('common:buttons.cancel')}</Text>
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