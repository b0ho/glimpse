import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  FlatList,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
import { groupApi } from '@/services/api/groupApi';
import { useGroupStore } from '@/store/slices/groupSlice';
import { Group, GroupType } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

interface GroupInfo {
  id: string;
  name: string;
  type: string;
  description?: string;
  memberCount?: number;
}

const CATEGORIES = [
  { id: 'all', name: '전체', icon: 'apps-outline' },
  { id: GroupType.OFFICIAL, name: '공식', icon: 'business-outline' },
  { id: GroupType.CREATED, name: '일반', icon: 'people-outline' },
  { id: GroupType.LOCATION, name: '장소', icon: 'location-outline' },
  { id: 'hobby', name: '취미', icon: 'heart-outline' },
  { id: 'study', name: '스터디', icon: 'school-outline' },
  { id: 'sports', name: '운동', icon: 'fitness-outline' },
];

export const JoinGroupScreen = () => {
  const { t } = useAndroidSafeTranslation('group');
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { inviteCode: initialCode } = route.params as { inviteCode: string };
  
  const groupStore = useGroupStore();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [inviteCode, setInviteCode] = useState(initialCode || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [popularGroups, setPopularGroups] = useState<Group[]>([]);
  const [searchResults, setSearchResults] = useState<Group[]>([]);

  useEffect(() => {
    loadPopularGroups();
  }, []);

  const loadPopularGroups = async () => {
    try {
      // 인기 그룹 로드 (현재는 샘플 데이터)
      const sampleGroups = groupStore.groups.slice(0, 5);
      setPopularGroups(sampleGroups);
    } catch (error) {
      console.error('Failed to load popular groups:', error);
    }
  };

  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    
    // 검색 결과 필터링
    const filtered = groupStore.groups.filter(group => {
      const matchesQuery = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          group.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || group.type === selectedCategory;
      return matchesQuery && matchesCategory;
    });
    
    setSearchResults(filtered);
    setHasSearched(true);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (searchQuery) {
      handleSearch();
    }
  };

  const handleJoinGroupByCode = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('오류', '초대 코드를 입력해주세요');
      return;
    }
    
    setIsJoining(true);
    try {
      const result = await groupApi.joinGroupByInvite(inviteCode);
      
      // 그룹 스토어 업데이트
      const group = await groupApi.getGroupById(result.group.id);
      groupStore.joinGroup(group);

      Alert.alert(
        '성공',
        `${result.group.name} 그룹에 참여했습니다!`,
        [
          {
            text: '확인',
            onPress: () => navigation.navigate('GroupDetail' as never, { groupId: result.group.id } as never),
          },
        ]
      );
    } catch (error: any) {
      console.error('Join group error:', error);
      Alert.alert('오류', '유효하지 않은 초대 코드입니다');
    } finally {
      setIsJoining(false);
    }
  };

  const handleGroupPress = (group: Group) => {
    navigation.navigate('GroupDetail' as never, { groupId: group.id } as never);
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity 
      style={[styles.groupCard, { backgroundColor: colors.SURFACE }]}
      onPress={() => handleGroupPress(item)}
    >
      <View style={styles.groupCardHeader}>
        <Text style={styles.groupEmoji}>
          {item.type === GroupType.OFFICIAL ? '🏢' : 
           item.type === GroupType.LOCATION ? '📍' : '👥'}
        </Text>
        <View style={styles.groupCardInfo}>
          <Text style={[styles.groupCardName, { color: colors.TEXT.PRIMARY }]}>{item.name}</Text>
          <Text style={[styles.groupCardMembers, { color: colors.TEXT.SECONDARY }]}>
            {item.memberCount}명 참여중
          </Text>
        </View>
      </View>
      {item.description && (
        <Text style={[styles.groupCardDesc, { color: colors.TEXT.SECONDARY }]} numberOfLines={2}>
          {item.description}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={[styles.header, { backgroundColor: colors.SURFACE }]}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.TEXT.PRIMARY }]}>그룹 찾기</Text>
        </View>

        {/* 초대 코드 섹션 */}
        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>초대 코드로 참여</Text>
          <View style={styles.inviteCodeContainer}>
            <TextInput
              style={[styles.inviteCodeInput, { 
                backgroundColor: colors.BACKGROUND, 
                color: colors.TEXT.PRIMARY,
                borderColor: colors.BORDER 
              }]}
              placeholder="초대 코드 입력"
              placeholderTextColor={colors.TEXT.SECONDARY}
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.joinCodeButton, { backgroundColor: colors.PRIMARY }]}
              onPress={handleJoinGroupByCode}
              disabled={isJoining}
            >
              {isJoining ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.joinCodeButtonText}>참여</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 검색 섹션 */}
        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>그룹 검색</Text>
          
          {/* 카테고리 */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryContainer}
          >
            {CATEGORIES.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  { 
                    backgroundColor: selectedCategory === category.id ? colors.PRIMARY : colors.BACKGROUND,
                    borderColor: selectedCategory === category.id ? colors.PRIMARY : colors.BORDER,
                  }
                ]}
                onPress={() => handleCategoryChange(category.id)}
              >
                <Icon 
                  name={category.icon} 
                  size={16} 
                  color={selectedCategory === category.id ? '#FFFFFF' : colors.TEXT.SECONDARY} 
                />
                <Text style={[
                  styles.categoryText,
                  { color: selectedCategory === category.id ? '#FFFFFF' : colors.TEXT.SECONDARY }
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 검색 입력 */}
          <View style={styles.searchContainer}>
            <View style={[styles.searchInputContainer, { 
              backgroundColor: colors.BACKGROUND,
              borderColor: colors.BORDER 
            }]}>
              <Icon name="search" size={20} color={colors.TEXT.SECONDARY} />
              <TextInput
                style={[styles.searchInput, { color: colors.TEXT.PRIMARY }]}
                placeholder="그룹 이름 또는 설명 검색"
                placeholderTextColor={colors.TEXT.SECONDARY}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
              />
            </View>
            <TouchableOpacity
              style={[styles.searchButton, { backgroundColor: colors.PRIMARY }]}
              onPress={handleSearch}
            >
              <Text style={styles.searchButtonText}>검색</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 검색 결과 */}
        {hasSearched && (
          <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
              검색 결과 {searchResults.length > 0 && `(${searchResults.length})`}
            </Text>
            {searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderGroupItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              />
            ) : (
              <View style={styles.emptySearchResult}>
                <Icon name="search-outline" size={48} color={colors.TEXT.TERTIARY} />
                <Text style={[styles.emptySearchTitle, { color: colors.TEXT.PRIMARY }]}>
                  검색 결과가 없습니다
                </Text>
                <Text style={[styles.emptySearchDesc, { color: colors.TEXT.SECONDARY }]}>
                  '{searchQuery}'에 대한 그룹을 찾을 수 없습니다.{'\n'}
                  다른 키워드로 검색해보세요.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* 인기 그룹 */}
        <View style={[styles.section, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>인기 그룹</Text>
          {popularGroups.length > 0 ? (
            <FlatList
              data={popularGroups}
              renderItem={renderGroupItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
          ) : (
            <Text style={[styles.emptyText, { color: colors.TEXT.SECONDARY }]}>
              인기 그룹을 불러오는 중...
            </Text>
          )}
        </View>
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
    padding: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  backButton: {
    marginRight: SPACING.MD,
  },
  title: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  section: {
    margin: SPACING.MD,
    padding: SPACING.MD,
    borderRadius: 12,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    marginBottom: SPACING.MD,
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  inviteCodeInput: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    paddingHorizontal: SPACING.MD,
    borderWidth: 1,
    fontSize: FONT_SIZES.MD,
  },
  joinCodeButton: {
    paddingHorizontal: SPACING.LG,
    justifyContent: 'center',
    borderRadius: 8,
  },
  joinCodeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: FONT_SIZES.MD,
  },
  categoryContainer: {
    marginBottom: SPACING.MD,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: SPACING.SM,
    gap: SPACING.XS,
  },
  categoryText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 8,
    paddingHorizontal: SPACING.MD,
    borderWidth: 1,
    gap: SPACING.SM,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.MD,
  },
  searchButton: {
    paddingHorizontal: SPACING.LG,
    justifyContent: 'center',
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: FONT_SIZES.MD,
  },
  groupCard: {
    padding: SPACING.MD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  groupCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  groupEmoji: {
    fontSize: 24,
    marginRight: SPACING.SM,
  },
  groupCardInfo: {
    flex: 1,
  },
  groupCardName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  groupCardMembers: {
    fontSize: FONT_SIZES.SM,
  },
  groupCardDesc: {
    fontSize: FONT_SIZES.SM,
    lineHeight: 18,
  },
  emptyText: {
    fontSize: FONT_SIZES.MD,
    textAlign: 'center',
    padding: SPACING.LG,
  },
  emptySearchResult: {
    alignItems: 'center',
    paddingVertical: SPACING.XL * 2,
  },
  emptySearchTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    marginTop: SPACING.MD,
  },
  emptySearchDesc: {
    fontSize: FONT_SIZES.SM,
    textAlign: 'center',
    marginTop: SPACING.SM,
    lineHeight: 20,
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