/**
 * 위치 기반 그룹 화면
 *
 * @screen
 * @description GPS를 활용하여 주변 그룹을 탐색하고 QR 코드로 참여하는 화면
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useTheme } from '@/store/slices/themeSlice';
// BarCodeScanner를 조건부로 import (Expo Go 호환성)
let BarCodeScanner: any = null;
try {
  const barcodeScannerModule = require('expo-barcode-scanner');
  BarCodeScanner = barcodeScannerModule.BarCodeScanner;
} catch (error) {
  console.warn('BarCodeScanner not available in this environment');
}
import { locationService } from '@/services/locationService';
import { cn } from '@/lib/utils';

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
 *
 * @component
 * @returns {JSX.Element}
 *
 * @description
 * GPS를 활용하여 주변 그룹을 탐색하고 참여하는 화면
 * - 현재 위치 기반 5km 반경 내 그룹 검색
 * - 각 그룹까지의 거리 표시 (m/km)
 * - QR 코드 스캔을 통한 그룹 참여
 * - 현재 위치에서 새 위치 그룹 생성
 * - 위치 권한 요청 및 관리
 * - 카메라 권한 요청 (QR 스캔용)
 * - Pull-to-refresh 기능
 *
 * @navigation
 * - From: 그룹 탭의 위치 그룹 버튼
 * - To: 그룹 상세 화면, QR 스캐너
 *
 * @example
 * ```tsx
 * <Stack.Screen
 *   name="LocationGroup"
 *   component={LocationGroupScreen}
 *   options={{ title: '주변 그룹' }}
 * />
 * ```
 */
const LocationGroupScreen = () => {
  const navigation = useNavigation();
  const [nearbyGroups, setNearbyGroups] = useState<LocationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [scanning, setScanning] = useState(false);
  const { t } = useAndroidSafeTranslation('location');
  const { isDarkMode } = useTheme();
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
          console.log(t('common:permissions.cameraRequired'));
        }
      }
    } catch (error) {
      console.error(t('common:errors.permissionError'), error);
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
      Alert.alert(t('common:errors.title'), t('common:errors.loadNearbyFailed'));
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
        Alert.alert(t('common:notifications.info'), t('locationgroup:group.alreadyMember'));
      } else {
        Alert.alert(t('common:actions.success'), t('locationgroup:group.joinSuccess'));
        await loadNearbyGroups();
      }
    } catch (error: any) {
      Alert.alert(t('common:errors.title'), error.message || t('group:group.joinError'));
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
        Alert.alert(t('common:notifications.info'), t('locationgroup:group.alreadyMember'));
      } else {
        Alert.alert(t('common:actions.success'), t('locationgroup:qr.success'));
        await loadNearbyGroups();
      }
    } catch (error: any) {
      Alert.alert(t('common:errors.title'), error.message || t('qr:qr.error'));
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
      Alert.alert(t('common:errors.title'), t('form:form.nameRequired'));
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
        t('locationgroup:group.createSuccess'),
        [
          {
            text: t('locationgroup:group.viewQRCode'),
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
      Alert.alert(t('common:errors.title'), error.message || t('group:group.createError'));
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
      <View className="flex-1 justify-center items-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-gray-900">
        <Ionicons name="location-outline" size={60} color="#9CA3AF" />
        <Text className="text-base mt-4 text-gray-600 dark:text-gray-300">
          {t('common:permissions.required')}
        </Text>
        <TouchableOpacity 
          className="mt-4 px-6 py-3 bg-blue-500 rounded-lg"
          onPress={checkPermissionsAndLoadGroups}
        >
          <Text className="text-white text-sm font-medium">
            {t('common:permissions.request')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-row justify-between items-center px-4 py-4 border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <Text className="text-xl font-bold text-gray-900 dark:text-white">
          {t('title')}
        </Text>
        <View className="flex-row space-x-4">
          <TouchableOpacity
            className="p-2"
            onPress={() => setScanning(true)}
          >
            <Ionicons name="qr-code-outline" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            className="p-2"
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#3B82F6" />
        }
      >
        {nearbyGroups.length === 0 ? (
          <View className="flex-1 justify-center items-center pt-24">
            <Ionicons name="location-outline" size={60} color="#9CA3AF" />
            <Text className={cn(
              "text-base mt-4",
    "text-gray-600 dark:text-gray-300"
            )}>
              {t('locationgroup:emptyState.title')}
            </Text>
            <Text className={cn(
              "text-sm mt-2",
    "text-gray-500 dark:text-gray-400"
            )}>
              {t('locationgroup:emptyState.subtitle')}
            </Text>
          </View>
        ) : (
          nearbyGroups.map((group) => (
            <TouchableOpacity
              key={group.id}
              className="flex-row justify-between items-center mx-4 my-1 p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              onPress={() => handleJoinGroup(group.id)}
            >
              <View className="flex-1 mr-4">
                <Text className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">
                  {group.name}
                </Text>
                <Text className="text-sm text-gray-600 dark:text-gray-300">
                  {group.description || group.address}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-lg font-bold text-blue-500">
                  {formatDistance(group.distance)}
                </Text>
                <Text className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                  <Ionicons name="people" size={14} color="#6B7280" />
                  {' '}{t('group:group.memberCount', { count: group._count.members })}
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
        <View className="flex-1 bg-black">
          <View className="absolute top-0 left-0 right-0 z-10 flex-row justify-between items-center px-4 pt-12 pb-4 bg-black/80">
            <TouchableOpacity onPress={() => setScanning(false)}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-white">
              {t('locationgroup:qr.title')}
            </Text>
            <View className="w-7" />
          </View>
          
          {BarCodeScanner ? (
            <>
              <BarCodeScanner
                onBarCodeScanned={scanning ? handleBarCodeScanned : undefined}
                style={{ flex: 1 }}
              />
              
              <View className="absolute inset-0 justify-center items-center">
                <View className="w-64 h-64 border-2 border-blue-500 bg-transparent" />
                <Text className="text-white text-sm mt-4 bg-black/70 px-4 py-2 rounded">
                  {t('locationgroup:qr.instruction')}
                </Text>
              </View>
            </>
          ) : (
            <View className="flex-1 justify-center items-center">
              <Text className="text-white text-sm">
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
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="w-11/12 rounded-lg p-6 bg-white dark:bg-gray-800">
            <Text className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {t('locationgroup:group.create')}
            </Text>
            
            <TextInput
              className="border rounded-lg px-4 py-3 mb-4 text-base bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
              placeholder={t('locationgroup:form.name')}
              placeholderTextColor="#6B7280"
              value={createForm.name}
              onChangeText={(text) => setCreateForm({ ...createForm, name: text })}
            />
            
            <TextInput
              className="border rounded-lg px-4 py-3 mb-4 text-base h-20 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
              placeholder={t('locationgroup:form.description')}
              placeholderTextColor="#6B7280"
              value={createForm.description}
              onChangeText={(text) => setCreateForm({ ...createForm, description: text })}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            
            <View className="flex-row justify-between mb-4">
              <View className="flex-1 mr-2">
                <Text className="text-sm mb-1 text-gray-600 dark:text-gray-300">
                  {t('locationgroup:form.radius')}
                </Text>
                <TextInput
                  className="border rounded-lg px-4 py-3 text-base bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                  placeholder="100"
                  placeholderTextColor="#6B7280"
                  value={createForm.radius}
                  onChangeText={(text) => setCreateForm({ ...createForm, radius: text })}
                  keyboardType="numeric"
                />
              </View>
              
              <View className="flex-1 ml-2">
                <Text className="text-sm mb-1 text-gray-600 dark:text-gray-300">
                  {t('locationgroup:form.maxMembers')}
                </Text>
                <TextInput
                  className="border rounded-lg px-4 py-3 text-base bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                  placeholder="50"
                  placeholderTextColor="#6B7280"
                  value={createForm.maxMembers}
                  onChangeText={(text) => setCreateForm({ ...createForm, maxMembers: text })}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View className="flex-row justify-between mt-4">
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg items-center mr-2 bg-gray-200 dark:bg-gray-600"
                onPress={() => setShowCreateModal(false)}
              >
                <Text className="text-base font-medium text-gray-700 dark:text-gray-300">
                  {t('locationgroup:form.cancel')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-1 py-3 bg-blue-500 rounded-lg items-center ml-2"
                onPress={handleCreateGroup}
              >
                <Text className="text-white text-base font-medium">
                  {t('locationgroup:form.create')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export { LocationGroupScreen };