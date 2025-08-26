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

export const PrivacyPolicyScreen = () => {
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
        <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>{t('privacy:title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.updateDate, { color: colors.TEXT.SECONDARY }]}>
            {t('privacy:effectiveDate', { date: '2025년 1월 1일' })}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('privacy:sections.purpose.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            {t('privacy:sections.purpose.description')}
            {'\n\n'}
            • {t('privacy:sections.purpose.items.registration')}
            {'\n'}• {t('privacy:sections.purpose.items.matching')}
            {'\n'}• {t('privacy:sections.purpose.items.payment')}
            {'\n'}• {t('privacy:sections.purpose.items.improvement')}
            {'\n'}• {t('privacy:sections.purpose.items.security')}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('privacy:sections.collection.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            <Text style={styles.bold}>{t('privacy:sections.collection.required.title')}</Text>
            {'\n'}• {t('privacy:sections.collection.required.items.phone')}
            {'\n'}• {t('privacy:sections.collection.required.items.nickname')}
            {'\n'}• {t('privacy:sections.collection.required.items.age')}
            {'\n'}• {t('privacy:sections.collection.required.items.gender')}
            {'\n\n'}
            <Text style={styles.bold}>{t('privacy:sections.collection.optional.title')}</Text>
            {'\n'}• {t('privacy:sections.collection.optional.items.photo')}
            {'\n'}• {t('privacy:sections.collection.optional.items.introduction')}
            {'\n'}• {t('privacy:sections.collection.optional.items.company')}
            {'\n'}• {t('privacy:sections.collection.optional.items.email')}
            {'\n'}• {t('privacy:sections.collection.optional.items.location')}
            {'\n\n'}
            <Text style={styles.bold}>{t('privacy:sections.collection.automatic.title')}</Text>
            {'\n'}• {t('privacy:sections.collection.automatic.items.usage')}
            {'\n'}• {t('privacy:sections.collection.automatic.items.logs')}
            {'\n'}• {t('privacy:sections.collection.automatic.items.cookies')}
            {'\n'}• {t('privacy:sections.collection.automatic.items.ip')}
            {'\n'}• {t('privacy:sections.collection.automatic.items.device')}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('privacy:sections.retention.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            {t('privacy:sections.retention.description')}
            {'\n\n'}
            • {t('privacy:sections.retention.items.member')}
            {'\n'}• {t('privacy:sections.retention.items.payment')}
            {'\n'}• {t('privacy:sections.retention.items.verification')}
            {'\n'}• {t('privacy:sections.retention.items.abuse')}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('privacy:sections.thirdParty.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            {t('privacy:sections.thirdParty.description')}
            {'\n\n'}
            • {t('privacy:sections.thirdParty.items.consent')}
            {'\n'}• {t('privacy:sections.thirdParty.items.legal')}
            {'\n'}• {t('privacy:sections.thirdParty.items.payment')}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('privacy:sections.anonymity.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            <Text style={styles.bold}>{t('privacy:sections.anonymity.description')}</Text>
            {'\n\n'}
            • {t('privacy:sections.anonymity.items.realName')}
            {'\n'}• {t('privacy:sections.anonymity.items.nickname')}
            {'\n'}• {t('privacy:sections.anonymity.items.photo')}
            {'\n'}• {t('privacy:sections.anonymity.items.company')}
            {'\n'}• {t('privacy:sections.anonymity.items.location')}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('privacy:sections.destruction.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            {t('privacy:sections.destruction.description')}
            {'\n\n'}
            • {t('privacy:sections.destruction.methods.electronic')}
            {'\n'}• {t('privacy:sections.destruction.methods.paper')}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('privacy:sections.rights.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            {t('privacy:sections.rights.description')}
            {'\n\n'}
            • {t('privacy:sections.rights.items.view')}
            {'\n'}• {t('privacy:sections.rights.items.correction')}
            {'\n'}• {t('privacy:sections.rights.items.deletion')}
            {'\n'}• {t('privacy:sections.rights.items.processing')}
            {'\n\n'}
            {t('privacy:sections.rights.exerciseNote')}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('privacy:sections.officer.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            {t('privacy:sections.officer.contact.title')}
            {'\n'}{t('privacy:sections.officer.contact.email')}
            {'\n\n'}
            {t('privacy:sections.officer.reports.title')}
            {'\n'}• {t('privacy:sections.officer.reports.items.kisa')}
            {'\n'}• {t('privacy:sections.officer.reports.items.prosecutor')}
            {'\n'}• {t('privacy:sections.officer.reports.items.police')}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('privacy:sections.changes.title')}
          </Text>
          <Text style={[styles.sectionContent, { color: colors.TEXT.SECONDARY }]}>
            {t('privacy:sections.changes.description')}
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