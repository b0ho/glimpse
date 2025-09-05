/**
 * 프로필 편집 화면 - 모듈화된 버전
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';
import { useTheme } from '@/hooks/useTheme';
import { useProfileEditForm } from '@/hooks/profile/useProfileEditForm';
import { useSocialAccounts } from '@/hooks/profile/useSocialAccounts';
import { BasicInfoSection } from '@/components/profile/edit/BasicInfoSection';
import { SocialAccountsSection } from '@/components/profile/edit/SocialAccountsSection';

export const ProfileEditScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  
  const {
    // Basic info
    nickname, setNickname,
    realName, setRealName,
    selectedGender, setSelectedGender,
    birthdate, setBirthdate,
    bio, setBio,
    
    // Contact info
    email, setEmail,
    phoneNumber, setPhoneNumber,
    
    // Social accounts
    socialIds, setSocialIds,
    platformIds, setPlatformIds,
    gameIds, setGameIds,
    
    // Work/Education
    companyName, setCompanyName,
    school, setSchool,
    major, setMajor,
    location, setLocation,
    appearance, setAppearance,
    
    // Part-time job
    partTimeJobPlace, setPartTimeJobPlace,
    partTimeJobPosition, setPartTimeJobPosition,
    partTimeJobHours, setPartTimeJobHours,
    
    // UI states
    toggles,
    toggleSection,
    loading,
    
    // Actions
    handleSave,
  } = useProfileEditForm();
  
  const {
    addSocialId,
    removeSocialId,
    updateSocialId,
    addPlatformId,
    removePlatformId,
    updatePlatformId,
    addGameId,
    removeGameId,
    updateGameId,
  } = useSocialAccounts(
    socialIds, setSocialIds,
    platformIds, setPlatformIds,
    gameIds, setGameIds
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.BORDER }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={28} color={colors.TEXT.PRIMARY} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>
            내 정보 편집
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.saveButton, { color: colors.PRIMARY }]}>
              {loading ? '저장 중...' : '저장'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 기본 정보 섹션 */}
          <BasicInfoSection
            nickname={nickname}
            setNickname={setNickname}
            realName={realName}
            setRealName={setRealName}
            selectedGender={selectedGender}
            setSelectedGender={setSelectedGender}
            birthdate={birthdate}
            setBirthdate={setBirthdate}
            bio={bio}
            setBio={setBio}
          />
          
          {/* 연락처 정보 섹션 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
              연락처 정보
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                이메일
              </Text>
              <CrossPlatformInput
                style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                placeholder="example@email.com"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                전화번호
              </Text>
              <CrossPlatformInput
                style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                placeholder="010-0000-0000"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>
          </View>
          
          {/* 소셜 계정 섹션 */}
          <SocialAccountsSection
            socialIds={socialIds}
            showSocialIds={toggles.showSocialIds}
            onToggle={() => toggleSection('showSocialIds')}
            onAdd={addSocialId}
            onRemove={removeSocialId}
            onUpdate={updateSocialId}
          />
          
          {/* 플랫폼 계정 섹션 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
                플랫폼 계정
              </Text>
              <TouchableOpacity onPress={() => toggleSection('showPlatformIds')}>
                <Icon 
                  name={toggles.showPlatformIds ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color={colors.TEXT.SECONDARY} 
                />
              </TouchableOpacity>
            </View>
            
            {toggles.showPlatformIds && (
              <View>
                {platformIds.map((platform, index) => (
                  <View key={index} style={styles.socialIdContainer}>
                    <CrossPlatformInput
                      style={[styles.socialInput, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                      placeholder="플랫폼 (유튜브, 트위치 등)"
                      placeholderTextColor={colors.TEXT.TERTIARY}
                      value={platform.platform}
                      onChangeText={(value) => updatePlatformId(index, 'platform', value)}
                    />
                    <CrossPlatformInput
                      style={[styles.socialInput, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                      placeholder="아이디"
                      placeholderTextColor={colors.TEXT.TERTIARY}
                      value={platform.id}
                      onChangeText={(value) => updatePlatformId(index, 'id', value)}
                    />
                    <TouchableOpacity onPress={() => removePlatformId(index)}>
                      <Icon name="trash-outline" size={24} color={colors.ERROR} />
                    </TouchableOpacity>
                  </View>
                ))}
                
                <TouchableOpacity style={[styles.addButton, { borderColor: colors.PRIMARY }]} onPress={addPlatformId}>
                  <Icon name="add" size={24} color={colors.PRIMARY} />
                  <Text style={[styles.addButtonText, { color: colors.PRIMARY }]}>
                    플랫폼 계정 추가
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* 게임 계정 섹션 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
                게임 계정
              </Text>
              <TouchableOpacity onPress={() => toggleSection('showGameIds')}>
                <Icon 
                  name={toggles.showGameIds ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color={colors.TEXT.SECONDARY} 
                />
              </TouchableOpacity>
            </View>
            
            {toggles.showGameIds && (
              <View>
                {gameIds.map((game, index) => (
                  <View key={index} style={styles.socialIdContainer}>
                    <CrossPlatformInput
                      style={[styles.socialInput, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                      placeholder="게임 (롤, 배그 등)"
                      placeholderTextColor={colors.TEXT.TERTIARY}
                      value={game.game}
                      onChangeText={(value) => updateGameId(index, 'game', value)}
                    />
                    <CrossPlatformInput
                      style={[styles.socialInput, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                      placeholder="닉네임"
                      placeholderTextColor={colors.TEXT.TERTIARY}
                      value={game.id}
                      onChangeText={(value) => updateGameId(index, 'id', value)}
                    />
                    <TouchableOpacity onPress={() => removeGameId(index)}>
                      <Icon name="trash-outline" size={24} color={colors.ERROR} />
                    </TouchableOpacity>
                  </View>
                ))}
                
                <TouchableOpacity style={[styles.addButton, { borderColor: colors.PRIMARY }]} onPress={addGameId}>
                  <Icon name="add" size={24} color={colors.PRIMARY} />
                  <Text style={[styles.addButtonText, { color: colors.PRIMARY }]}>
                    게임 계정 추가
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* 직업/학업 정보 섹션 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
              직업/학업 정보
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                회사명
              </Text>
              <CrossPlatformInput
                style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                placeholder="회사명을 입력하세요"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={companyName}
                onChangeText={setCompanyName}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                학교
              </Text>
              <CrossPlatformInput
                style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                placeholder="학교명을 입력하세요"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={school}
                onChangeText={setSchool}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                전공
              </Text>
              <CrossPlatformInput
                style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                placeholder="전공을 입력하세요"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={major}
                onChangeText={setMajor}
              />
            </View>
          </View>
          
          {/* 알바 정보 섹션 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
                알바 정보
              </Text>
              <TouchableOpacity onPress={() => toggleSection('showPartTimeJob')}>
                <Icon 
                  name={toggles.showPartTimeJob ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color={colors.TEXT.SECONDARY} 
                />
              </TouchableOpacity>
            </View>
            
            {toggles.showPartTimeJob && (
              <View>
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                    알바 장소
                  </Text>
                  <CrossPlatformInput
                    style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                    placeholder="예: 스타벅스 강남점"
                    placeholderTextColor={colors.TEXT.TERTIARY}
                    value={partTimeJobPlace}
                    onChangeText={setPartTimeJobPlace}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                    포지션
                  </Text>
                  <CrossPlatformInput
                    style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                    placeholder="예: 바리스타"
                    placeholderTextColor={colors.TEXT.TERTIARY}
                    value={partTimeJobPosition}
                    onChangeText={setPartTimeJobPosition}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                    근무 시간
                  </Text>
                  <CrossPlatformInput
                    style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                    placeholder="예: 평일 저녁 6-10시"
                    placeholderTextColor={colors.TEXT.TERTIARY}
                    value={partTimeJobHours}
                    onChangeText={setPartTimeJobHours}
                  />
                </View>
              </View>
            )}
          </View>
          
          {/* 기타 정보 섹션 */}
          <View style={[styles.section, { marginBottom: 40 }]}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
              기타 정보
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                지역
              </Text>
              <CrossPlatformInput
                style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                placeholder="거주 지역"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={location}
                onChangeText={setLocation}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                외모 특징
              </Text>
              <CrossPlatformInput
                style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                placeholder="예: 안경 착용, 긴 머리"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={appearance}
                onChangeText={setAppearance}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  socialIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  socialInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});