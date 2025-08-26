import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';

export const TermsOfServiceScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <View style={[styles.header, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>{t('terms:title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.updateDate, { color: colors.TEXT.SECONDARY }]}>
            {t('terms:effectiveDate', { date: '2025년 1월 1일' })}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('terms:sections.purpose.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            {t('terms:sections.purpose.content')}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('terms:sections.definitions.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            {t('terms:sections.definitions.items.service')}
            {'\n'}{t('terms:sections.definitions.items.member')}
            {'\n'}{t('terms:sections.definitions.items.anonymousProfile')}
            {'\n'}{t('terms:sections.definitions.items.matching')}
            {'\n'}{t('terms:sections.definitions.items.group')}
            {'\n'}{t('terms:sections.definitions.items.premium')}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('terms:sections.validity.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            {t('terms:sections.validity.items.effectiveness')}
            {'\n'}{t('terms:sections.validity.items.changes')}
            {'\n'}{t('terms:sections.validity.items.notice')}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('terms:sections.membership.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            {t('terms:sections.membership.items.registration')}
            {'\n'}{t('terms:sections.membership.items.accuracy')}
            {'\n'}{t('terms:sections.membership.items.identity')}
            {'\n'}{t('terms:sections.membership.items.responsibility')}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('terms:sections.serviceUsage.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            {t('terms:sections.serviceUsage.items.availability')}
            {'\n'}{t('terms:sections.serviceUsage.items.restrictions')}
            {'\n'}  {t('terms:sections.serviceUsage.items.restrictionReasons.maintenance')}
            {'\n'}  {t('terms:sections.serviceUsage.items.restrictionReasons.force')}
            {'\n'}  {t('terms:sections.serviceUsage.items.restrictionReasons.update')}
            {'\n'}{t('terms:sections.serviceUsage.items.limits')}
            {'\n'}{t('terms:sections.serviceUsage.items.chat')}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('terms:sections.prohibited.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            {t('terms:sections.prohibited.description')}
            {'\n\n'}
            {t('terms:sections.prohibited.items.identity')}
            {'\n'}{t('terms:sections.prohibited.items.content')}
            {'\n'}{t('terms:sections.prohibited.items.commercial')}
            {'\n'}{t('terms:sections.prohibited.items.interference')}
            {'\n'}{t('terms:sections.prohibited.items.harassment')}
            {'\n'}{t('terms:sections.prohibited.items.fraud')}
            {'\n'}{t('terms:sections.prohibited.items.crime')}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('terms:sections.premium.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            {t('terms:sections.premium.pricing.title')}
            {'\n'}  {t('terms:sections.premium.pricing.monthly')}
            {'\n'}  {t('terms:sections.premium.pricing.yearly')}
            {'\n\n'}
            {t('terms:sections.premium.benefits.title')}
            {'\n'}  {t('terms:sections.premium.benefits.unlimited')}
            {'\n'}  {t('terms:sections.premium.benefits.received')}
            {'\n'}  {t('terms:sections.premium.benefits.priority')}
            {'\n'}  {t('terms:sections.premium.benefits.undo')}
            {'\n'}  {t('terms:sections.premium.benefits.readReceipt')}
            {'\n\n'}
            {t('terms:sections.premium.payment')}
            {'\n'}{t('terms:sections.premium.refund')}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('terms:sections.content.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            {t('terms:sections.content.items.ownership')}
            {'\n'}{t('terms:sections.content.items.usage')}
            {'\n'}{t('terms:sections.content.items.infringement')}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('terms:sections.privacy.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            {t('terms:sections.privacy.items.protection')}
            {'\n'}{t('terms:sections.privacy.items.policy')}
            {'\n'}{t('terms:sections.privacy.items.anonymity')}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('terms:sections.liability.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            {t('terms:sections.liability.items.free')}
            {'\n'}{t('terms:sections.liability.items.dispute')}
            {'\n'}{t('terms:sections.liability.items.responsibility')}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('terms:sections.withdrawal.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            {t('terms:sections.withdrawal.items.request')}
            {'\n'}{t('terms:sections.withdrawal.items.deletion')}
            {'\n'}{t('terms:sections.withdrawal.items.restriction')}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('terms:sections.disputes.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            {t('terms:sections.disputes.items.law')}
            {'\n'}{t('terms:sections.disputes.items.jurisdiction')}
            {'\n'}{t('terms:sections.disputes.items.resolution')}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('terms:sections.appendix.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            {t('terms:sections.appendix.effective')}
            {'\n\n'}
            {t('terms:sections.appendix.contact')}
          </Text>
        </View>
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
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: SPACING.SM,
  },
  headerTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  content: {
    paddingVertical: SPACING.MD,
  },
  section: {
    marginHorizontal: SPACING.MD,
    marginBottom: SPACING.MD,
    padding: SPACING.MD,
    borderRadius: 12,
  },
  updateDate: {
    fontSize: FONT_SIZES.SM,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    marginBottom: SPACING.SM,
  },
  sectionContent: {
    fontSize: FONT_SIZES.SM,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '600',
  },
});