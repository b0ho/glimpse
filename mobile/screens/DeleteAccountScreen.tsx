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
import { useTheme } from '@/hooks/useTheme';
import { COLORS, SPACING, TYPOGRAPHY } from '@/utils/constants';
import { useAuthStore } from '@/store/slices/authSlice';
import { authService } from '@/services/api/authService';

export const DeleteAccountScreen = () => {
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const { user, clearAuth } = useAuthStore();
  const { t } = useTranslation();
  const { colors } = useTheme();
  
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <View style={[styles.header, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>{t('settings:deleteAccount.title')}</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.warningCard, { backgroundColor: colors.ERROR + '10', borderColor: colors.ERROR + '20' }]}>
          <Ionicons name="warning" size={48} color={colors.ERROR} />
          <Text style={[styles.warningTitle, { color: colors.ERROR }]}>{t('settings:deleteAccount.warning.title')}</Text>
          <Text style={[styles.warningText, { color: colors.TEXT.PRIMARY }]}>
            {t('settings:deleteAccount.warning.description')}
          </Text>
          
          <View style={styles.warningList}>
            <View style={styles.warningItem}>
              <Text style={[styles.warningBullet, { color: colors.ERROR }]}>•</Text>
              <Text style={[styles.warningItemText, { color: colors.TEXT.PRIMARY }]}>
                {t('settings:deleteAccount.warning.items.profile')}
              </Text>
            </View>
            <View style={styles.warningItem}>
              <Text style={[styles.warningBullet, { color: colors.ERROR }]}>•</Text>
              <Text style={[styles.warningItemText, { color: colors.TEXT.PRIMARY }]}>
                {t('settings:deleteAccount.warning.items.matches')}
              </Text>
            </View>
            <View style={styles.warningItem}>
              <Text style={[styles.warningBullet, { color: colors.ERROR }]}>•</Text>
              <Text style={[styles.warningItemText, { color: colors.TEXT.PRIMARY }]}>
                {t('settings:deleteAccount.warning.items.credits')}
              </Text>
            </View>
            <View style={styles.warningItem}>
              <Text style={[styles.warningBullet, { color: colors.ERROR }]}>•</Text>
              <Text style={[styles.warningItemText, { color: colors.TEXT.PRIMARY }]}>
                {t('settings:deleteAccount.warning.items.recovery')}
              </Text>
            </View>
            <View style={styles.warningItem}>
              <Text style={[styles.warningBullet, { color: colors.ERROR }]}>•</Text>
              <Text style={[styles.warningItemText, { color: colors.TEXT.PRIMARY }]}>
                {t('settings:deleteAccount.warning.items.permanent')}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>{t('settings:deleteAccount.reason.title')}</Text>
          <View style={[styles.reasonContainer, { backgroundColor: colors.SURFACE }]}>
            {reasons.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonItem,
                  deleteReason === reason.id && [styles.reasonItemSelected, { backgroundColor: colors.PRIMARY + '05' }],
                ]}
                onPress={() => setDeleteReason(reason.id)}
              >
                <View style={[
                  styles.radio,
                  { borderColor: colors.BORDER },
                  deleteReason === reason.id && [styles.radioSelected, { borderColor: colors.PRIMARY }],
                ]}>
                  {deleteReason === reason.id && (
                    <View style={[styles.radioInner, { backgroundColor: colors.PRIMARY }]} />
                  )}
                </View>
                <Text style={[styles.reasonText, { color: colors.TEXT.PRIMARY }]}>{reason.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>{t('settings:deleteAccount.confirm.title')}</Text>
          <Text style={[styles.confirmDescription, { color: colors.TEXT.PRIMARY }]}>
            {t('settings:deleteAccount.confirm.description')} <Text style={[styles.confirmHighlight, { color: colors.ERROR }]}>{t('settings:deleteAccount.confirm.confirmText')}</Text>{t('settings:deleteAccount.confirm.descriptionEnd')}
          </Text>
          <TextInput
            style={[styles.confirmInput, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER, color: colors.TEXT.PRIMARY }]}
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder={t('settings:deleteAccount.confirm.placeholder')}
            placeholderTextColor={colors.TEXT.LIGHT}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isDeleting}
          />
        </View>
        
        <TouchableOpacity
          style={[
            styles.deleteButton,
            { backgroundColor: colors.ERROR },
            confirmText !== t('settings:deleteAccount.confirm.confirmText') && [styles.deleteButtonDisabled, { backgroundColor: colors.TEXT.LIGHT }],
          ]}
          onPress={handleDelete}
          disabled={confirmText !== t('settings:deleteAccount.confirm.confirmText') || isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={colors.TEXT.WHITE} />
          ) : (
            <Text style={[styles.deleteButtonText, { color: colors.TEXT.WHITE }]}>{t('settings:deleteAccount.confirm.button')}</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
          onPress={() => navigation.goBack()}
          disabled={isDeleting}
        >
          <Text style={[styles.cancelButtonText, { color: colors.TEXT.PRIMARY }]}>{t('common:buttons.cancel')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  warningCard: {
    borderRadius: 12,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  warningTitle: {
    ...TYPOGRAPHY.h3,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  warningText: {
    ...TYPOGRAPHY.body,
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
    marginRight: SPACING.xs,
  },
  warningItemText: {
    ...TYPOGRAPHY.body,
    flex: 1,
  },
  section: {
    marginTop: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.md,
  },
  reasonContainer: {
    borderRadius: 12,
    padding: SPACING.md,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  reasonItemSelected: {
    marginHorizontal: -SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  reasonText: {
    ...TYPOGRAPHY.body,
  },
  confirmDescription: {
    ...TYPOGRAPHY.body,
    marginBottom: SPACING.sm,
  },
  confirmHighlight: {
    fontWeight: '700',
  },
  confirmInput: {
    ...TYPOGRAPHY.body,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
  },
  deleteButton: {
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  deleteButtonDisabled: {
  },
  deleteButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 1,
  },
  cancelButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
});