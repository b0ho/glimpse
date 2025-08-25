import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
// BarCodeScanner를 조건부로 import (Expo Go 호환성)
let BarCodeScanner: any = null;
try {
  const barcodeScannerModule = require('expo-barcode-scanner');
  BarCodeScanner = barcodeScannerModule.BarCodeScanner;
} catch (error) {
  console.warn('BarCodeScanner not available in this environment');
}
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { locationService } from '../services/locationService';
// ContentItem 대신 직접 렌더링

/**
 * 위치 기반 그룹 인터페이스
 * @interface LocationGroup
 * @property {string} id - 그룹 ID
 * @property {string} name - 그룹 이름
 * @property {string} [description] - 그룹 설명
 * @property {number} distance - 현재 위치로부터의 거리 (m)
 * @property {string} address - 그룹 주소
 * @property {Object} _count - 그룹 통계
 * @property {Object} creator - 그룹 생성자 정보
 */
interface LocationGroup {
  id: string;
  name: string;
  description?: string;
  distance: number;
  address: string;
  _count: {
    members: number;
  };
  creator: {
    nickname: string;
  };
}

/**
 * 위치 기반 그룹 화면 컴포넌트
 * @component
 * @returns {JSX.Element} 위치 그룹 화면 UI
 * @description GPS 기반 주변 그룹 탐색, QR 코드 스캔, 그룹 생성 기능을 제공하는 화면
 */
const LocationGroupScreen = () => {
  const navigation = useNavigation();
  const [nearbyGroups, setNearbyGroups] = useState<LocationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [scanning, setScanning] = useState(false);
  const { t } = useTranslation('location');
  const { colors } = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    radius: '100',
    maxMembers: '50',
  });

  useEffect(() => {
    checkPermissionsAndLoadGroups();
  }, []);

  /**
   * 권한 확인 및 그룹 로드
   * @returns {Promise<void>}
   * @description 위치 및 카메라 권한을 확인하고 주변 그룹을 로드
   */
  const checkPermissionsAndLoadGroups = async () => {
    try {
      // 위치 권한 확인
      const locationPermission = await locationService.requestLocationPermission();
      setHasPermission(locationPermission);

      if (locationPermission) {
        await loadNearbyGroups();
      }

      // 카메라 권한 확인 (QR 스캔용)
      if (BarCodeScanner) {
        const { status } = await BarCodeScanner.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log(t('permissions.cameraRequired'));
        }
      }
    } catch (error) {
      console.error(t('errors.permissionError'), error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 주변 그룹 로드
   * @returns {Promise<void>}
   * @description 5km 반경 내의 위치 기반 그룹을 가져오기
   */
  const loadNearbyGroups = async () => {
    try {
      const groups = await locationService.getNearbyGroups(5); // 5km 반경
      setNearbyGroups(groups);
    } catch (error) {
      console.error('주변 그룹 로드 오류:', error);
      Alert.alert(t('errors.title'), t('errors.loadNearbyFailed'));
    }
  };

  /**
   * 새로고침 핸들러
   * @returns {Promise<void>}
   * @description Pull-to-refresh로 주변 그룹 목록을 다시 로드
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNearbyGroups();
    setRefreshing(false);
  };

  /**
   * 그룹 참여 핸들러
   * @param {string} groupId - 참여할 그룹 ID
   * @returns {Promise<void>}
   * @description 선택한 위치 기반 그룹에 참여
   */
  const handleJoinGroup = async (groupId: string) => {
    try {
      setLoading(true);
      const result = await locationService.joinLocationGroup(groupId);
      
      if (result.alreadyMember) {
        Alert.alert(t('common:notifications.info'), t('group.alreadyMember'));
      } else {
        Alert.alert(t('common:actions.success'), t('group.joinSuccess'));
        await loadNearbyGroups();
      }
    } catch (error: any) {
      Alert.alert(t('errors.title'), error.message || t('group.joinError'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * QR 코드 스캔 핸들러
   * @param {Object} params - 스캔 데이터
   * @param {string} params.type - 바코드 타입
   * @param {string} params.data - QR 코드 데이터
   * @returns {Promise<void>}
   * @description QR 코드를 통해 그룹에 참여
   */
  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanning(false);
    
    try {
      setLoading(true);
      const result = await locationService.joinGroupByQRCode(data);
      
      if (result.alreadyMember) {
        Alert.alert(t('common:notifications.info'), t('group.alreadyMember'));
      } else {
        Alert.alert(t('common:actions.success'), t('qr.success'));
        await loadNearbyGroups();
      }
    } catch (error: any) {
      Alert.alert(t('errors.title'), error.message || t('qr.error'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * 그룹 생성 핸들러
   * @returns {Promise<void>}
   * @description 현재 위치에 새로운 위치 기반 그룹 생성
   */
  const handleCreateGroup = async () => {
    if (!createForm.name.trim()) {
      Alert.alert(t('errors.title'), t('form.nameRequired'));
      return;
    }

    try {
      setLoading(true);
      const group = await locationService.createLocationGroup({
        name: createForm.name,
        description: createForm.description,
        radius: parseInt(createForm.radius),
        maxMembers: parseInt(createForm.maxMembers),
      });

      // QR 코드 표시
      Alert.alert(
        t('common:actions.completed'),
        t('group.createSuccess'),
        [
          {
            text: t('group.viewQRCode'),
            onPress: () => {
              // QR 코드 모달 표시
              Alert.alert(t('common:actions.completed'), `QR Code: ${group.qrCode}`);
            },
          },
          { text: t('common:actions.confirm') },
        ]
      );

      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', radius: '100', maxMembers: '50' });
      await loadNearbyGroups();
    } catch (error: any) {
      Alert.alert(t('errors.title'), error.message || t('group.createError'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * 거리 포맷팅
   * @param {number} meters - 미터 단위 거리
   * @returns {string} 포맷팅된 거리 문자열
   * @description 미터를 km 단위로 변환하여 표시
   */
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.BACKGROUND }]}>
        <ActivityIndicator size="large" color={colors.PRIMARY} />
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.BACKGROUND }]}>
        <Ionicons name="location-outline" size={60} color={colors.TEXT.LIGHT} />
        <Text style={[styles.permissionText, { color: colors.TEXT.SECONDARY }]}>{t('permissions.required')}</Text>
        <TouchableOpacity 
          style={[styles.permissionButton, { backgroundColor: colors.PRIMARY }]}
          onPress={checkPermissionsAndLoadGroups}
        >
          <Text style={[styles.permissionButtonText, { color: colors.TEXT.WHITE }]}>{t('permissions.request')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <View style={[styles.header, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
        <Text style={[styles.title, { color: colors.TEXT.PRIMARY }]}>{t('title')}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setScanning(true)}
          >
            <Ionicons name="qr-code-outline" size={24} color={colors.PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={24} color={colors.PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.PRIMARY} />
        }
      >
        {nearbyGroups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={60} color={colors.TEXT.LIGHT} />
            <Text style={[styles.emptyText, { color: colors.TEXT.SECONDARY }]}>{t('emptyState.title')}</Text>
            <Text style={[styles.emptySubText, { color: colors.TEXT.LIGHT }]}>{t('emptyState.subtitle')}</Text>
          </View>
        ) : (
          nearbyGroups.map((group) => (
            <TouchableOpacity
              key={group.id}
              style={[styles.groupItem, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
              onPress={() => handleJoinGroup(group.id)}
            >
              <View style={styles.groupContent}>
                <Text style={[styles.groupName, { color: colors.TEXT.PRIMARY }]}>{group.name}</Text>
                <Text style={[styles.groupDescription, { color: colors.TEXT.SECONDARY }]}>
                  {group.description || group.address}
                </Text>
              </View>
              <View style={styles.groupInfo}>
                <Text style={[styles.distance, { color: colors.PRIMARY }]}>{formatDistance(group.distance)}</Text>
                <Text style={[styles.memberCount, { color: colors.TEXT.LIGHT }]}>
                  <Ionicons name="people" size={14} color={colors.TEXT.LIGHT} />
                  {' '}{t('group.memberCount', { count: group._count.members })}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* QR 스캐너 모달 */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={scanning}
        onRequestClose={() => setScanning(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.BACKGROUND }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setScanning(false)}>
              <Ionicons name="close" size={28} color={colors.TEXT.WHITE} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.TEXT.WHITE }]}>{t('qr.title')}</Text>
            <View style={{ width: 28 }} />
          </View>
          
          {BarCodeScanner ? (
            <>
              <BarCodeScanner
                onBarCodeScanned={scanning ? handleBarCodeScanned : undefined}
                style={StyleSheet.absoluteFillObject}
              />
              
              <View style={styles.scanOverlay}>
                <View style={styles.scanFrame} />
                <Text style={[styles.scanText, { color: colors.TEXT.WHITE }]}>{t('qr.instruction')}</Text>
              </View>
            </>
          ) : (
            <View style={styles.scanOverlay}>
              <Text style={[styles.scanText, { color: colors.TEXT.WHITE }]}>
                카메라를 사용할 수 없습니다
              </Text>
            </View>
          )}
        </View>
      </Modal>

      {/* 그룹 생성 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCreateModal}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.createModalContent, { backgroundColor: colors.SURFACE }]}>
            <Text style={[styles.createModalTitle, { color: colors.TEXT.PRIMARY }]}>{t('group.create')}</Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.BACKGROUND, borderColor: colors.BORDER, color: colors.TEXT.PRIMARY }]}
              placeholder={t('form.name')}
              placeholderTextColor={colors.TEXT.LIGHT}
              value={createForm.name}
              onChangeText={(text) => setCreateForm({ ...createForm, name: text })}
            />
            
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.BACKGROUND, borderColor: colors.BORDER, color: colors.TEXT.PRIMARY }]}
              placeholder={t('form.description')}
              placeholderTextColor={colors.TEXT.LIGHT}
              value={createForm.description}
              onChangeText={(text) => setCreateForm({ ...createForm, description: text })}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.TEXT.SECONDARY }]}>{t('form.radius')}</Text>
                <TextInput
                  style={[styles.input, styles.smallInput, { backgroundColor: colors.BACKGROUND, borderColor: colors.BORDER, color: colors.TEXT.PRIMARY }]}
                  placeholder="100"
                  placeholderTextColor={colors.TEXT.LIGHT}
                  value={createForm.radius}
                  onChangeText={(text) => setCreateForm({ ...createForm, radius: text })}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.TEXT.SECONDARY }]}>{t('form.maxMembers')}</Text>
                <TextInput
                  style={[styles.input, styles.smallInput, { backgroundColor: colors.BACKGROUND, borderColor: colors.BORDER, color: colors.TEXT.PRIMARY }]}
                  placeholder="50"
                  placeholderTextColor={colors.TEXT.LIGHT}
                  value={createForm.maxMembers}
                  onChangeText={(text) => setCreateForm({ ...createForm, maxMembers: text })}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.TEXT.LIGHT }]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.TEXT.SECONDARY }]}>{t('form.cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton, { backgroundColor: colors.PRIMARY }]}
                onPress={handleCreateGroup}
              >
                <Text style={[styles.createButtonText, { color: colors.TEXT.WHITE }]}>{t('form.create')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.black,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: SIZES.padding,
  },
  headerButton: {
    padding: SIZES.base,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    ...FONTS.body2,
    color: COLORS.gray,
    marginTop: SIZES.padding,
  },
  emptySubText: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginTop: SIZES.base,
  },
  groupInfo: {
    alignItems: 'flex-end',
  },
  distance: {
    ...FONTS.h3,
    color: COLORS.primary,
  },
  memberCount: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginTop: 4,
  },
  permissionText: {
    ...FONTS.body2,
    color: COLORS.gray,
    marginTop: SIZES.padding,
  },
  permissionButton: {
    marginTop: SIZES.padding,
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
  },
  permissionButtonText: {
    ...FONTS.body3,
    color: COLORS.white,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingTop: 50,
    paddingBottom: SIZES.padding,
    backgroundColor: 'rgba(0,0,0,0.8)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  modalTitle: {
    ...FONTS.h3,
    color: COLORS.white,
  },
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  scanText: {
    ...FONTS.body3,
    color: COLORS.white,
    marginTop: SIZES.padding,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.base,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createModalContent: {
    width: '90%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding * 2,
  },
  createModalTitle: {
    ...FONTS.h2,
    color: COLORS.black,
    marginBottom: SIZES.padding,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.base,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    marginBottom: SIZES.padding,
    ...FONTS.body3,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.padding,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: SIZES.base / 2,
  },
  inputLabel: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginBottom: SIZES.base / 2,
  },
  smallInput: {
    marginBottom: 0,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.padding,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.base,
    alignItems: 'center',
    marginHorizontal: SIZES.base / 2,
  },
  cancelButton: {
    backgroundColor: COLORS.lightGray,
  },
  cancelButtonText: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
  createButton: {
    backgroundColor: COLORS.primary,
  },
  createButtonText: {
    ...FONTS.body3,
    color: COLORS.white,
  },
  groupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.padding,
    marginVertical: SIZES.base / 2,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  groupContent: {
    flex: 1,
    marginRight: SIZES.padding,
  },
  groupName: {
    ...FONTS.h3,
    color: COLORS.black,
    marginBottom: 4,
  },
  groupDescription: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
});

export { LocationGroupScreen };