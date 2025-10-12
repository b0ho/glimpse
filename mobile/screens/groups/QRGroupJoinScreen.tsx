/**
 * QR 코드 그룹 참여 화면
 *
 * @screen
 * @description QR 코드를 스캔하거나 생성하여 그룹에 참여하는 화면
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
// BarCodeScanner를 조건부로 import (Expo Go 호환성)
let BarCodeScanner: any = null;
try {
  const barcodeScannerModule = require('expo-barcode-scanner');
  BarCodeScanner = barcodeScannerModule.BarCodeScanner;
} catch (error) {
  console.warn('BarCodeScanner not available in this environment');
}
import Icon from 'react-native-vector-icons/Ionicons';
import QRCode from 'react-native-qrcode-svg';
import { useGroupStore } from '@/store/slices/groupSlice';
import { Group } from '@/types';

interface QRGroupData {
  groupId: string;
  groupName: string;
  timestamp: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * QR 코드 그룹 참여 화면 컴포넌트
 *
 * @component
 * @returns {JSX.Element}
 *
 * @description
 * QR 코드를 스캔하거나 생성하여 그룹에 참여하는 화면
 * - QR 코드 스캔 모드: 다른 사람의 QR 코드를 스캔하여 참여
 * - QR 코드 생성 모드: 내 그룹의 QR 코드 생성 및 표시
 * - 카메라 권한 요청 및 관리
 * - QR 코드 유효성 검증 (5분 타임아웃)
 * - 그룹 정보 표시 (이름, 멤버 수, 타입)
 * - QR 코드 재생성 기능
 * - 참여 확인 다이얼로그
 *
 * @navigation
 * - From: 그룹 탭의 QR 스캔 버튼, 그룹 상세의 QR 생성
 * - To: 그룹 목록 화면 (참여 성공 시)
 *
 * @example
 * ```tsx
 * // QR 스캔 모드
 * navigation.navigate('QRGroupJoin');
 *
 * // QR 생성 모드
 * navigation.navigate('QRGroupJoin', {
 *   groupId: 'group-123'
 * });
 * ```
 */
export const QRGroupJoinScreen = () => {
  const { t } = useAndroidSafeTranslation('group');
  const navigation = useNavigation();
  const route = useRoute();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'scan' | 'generate'>('scan');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const { joinGroup, groups } = useGroupStore();

  // URL 파라미터에서 그룹 ID 가져오기 (QR 생성 모드용)
  const groupId = (route.params as { groupId?: string })?.groupId;

  useEffect(() => {
    (async () => {
      if (BarCodeScanner) {
        const { status } = await BarCodeScanner.requestPermissionsAsync();
        setHasPermission(status === 'granted');
      } else {
        setHasPermission(false);
      }
    })();

    // 그룹 ID가 있으면 생성 모드로 시작
    if (groupId) {
      setMode('generate');
      const group = groups.find(g => g.id === groupId);
      setSelectedGroup(group || null);
    }
  }, [groupId, groups]);

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    setScanned(true);
    setIsLoading(true);

    try {
      // QR 코드 데이터 파싱
      const qrData: QRGroupData = JSON.parse(data);
      
      // 데이터 유효성 검사
      if (!qrData.groupId || !qrData.groupName || !qrData.timestamp) {
        throw new Error('Invalid QR code format');
      }

      // QR 코드가 너무 오래된 경우 (5분 이상)
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      if (now - qrData.timestamp > fiveMinutes) {
        Alert.alert(t('group:qrJoin.expiredTitle'), t('group:qrJoin.expiredMessage'));
        setScanned(false);
        setIsLoading(false);
        return;
      }

      // 그룹 참여 확인
      Alert.alert(
        t('group:qrJoin.joinTitle'),
        t('group:qrJoin.joinMessage', { groupName: qrData.groupName }),
        [
          {
            text: t('group:qrJoin.cancel'),
            style: 'cancel',
            onPress: () => {
              setScanned(false);
              setIsLoading(false);
            },
          },
          {
            text: t('group:qrJoin.joinButton'),
            onPress: async () => {
              try {
                // 그룹 ID로 그룹 정보 찾기
                const targetGroup = groups.find(g => g.id === qrData.groupId);
                if (!targetGroup) {
                  Alert.alert(t('group:qrJoin.error'), t('group:qrJoin.groupNotFound'));
                  setScanned(false);
                  setIsLoading(false);
                  return;
                }
                
                await joinGroup(targetGroup);
                // 참여 성공으로 간주
                Alert.alert(
                  t('group:qrJoin.successTitle'),
                  t('group:qrJoin.successMessage', { groupName: qrData.groupName }),
                  [
                    {
                      text: t('group:qrJoin.confirm'),
                      onPress: () => {
                        navigation.navigate('Groups' as never);
                      },
                    },
                  ]
                );
              } catch (error) {
                console.error('Join group error:', error);
                Alert.alert(t('group:qrJoin.error'), t('group:qrJoin.joinError'));
                setScanned(false);
              } finally {
                setIsLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('QR code parse error:', error);
      Alert.alert(t('group:qrJoin.invalidTitle'), t('group:qrJoin.invalidMessage'));
      setScanned(false);
      setIsLoading(false);
    }
  };

  const generateQRData = (group: Group): QRGroupData => {
    return {
      groupId: group.id,
      groupName: group.name,
      timestamp: Date.now(),
      location: group.location ? {
        latitude: group.location.latitude,
        longitude: group.location.longitude,
      } : undefined,
    };
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" className="text-blue-500" />
          <Text className="text-gray-600 dark:text-gray-400 text-base mt-4">{t('group:qrJoin.checkingPermission')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <TouchableOpacity
            className="p-2"
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} className="text-gray-900 dark:text-white" />
          </TouchableOpacity>
          <Text className="text-gray-900 dark:text-white text-lg font-semibold">{t('group:qrJoin.title')}</Text>
          <View className="w-10" />
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <Icon name="camera-outline" size={64} className="text-gray-500 dark:text-gray-500 mb-6" />
          <Text className="text-gray-900 dark:text-white text-xl font-semibold mb-3">{t('group:qrJoin.permissionRequired')}</Text>
          <Text className="text-gray-600 dark:text-gray-400 text-base text-center leading-6 mb-8">
            {t('group:qrJoin.permissionDescription')}
          </Text>
          <TouchableOpacity
            className="bg-blue-500 dark:bg-blue-600 px-8 py-4 rounded-xl"
            onPress={async () => {
              const { status } = await BarCodeScanner.requestPermissionsAsync();
              setHasPermission(status === 'granted');
            }}
          >
            <Text className="text-white text-base font-semibold">{t('group:qrJoin.allowPermission')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <TouchableOpacity
          className="p-2"
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} className="text-gray-900 dark:text-white" />
        </TouchableOpacity>
        <Text className="text-gray-900 dark:text-white text-lg font-semibold">{t('group:qrJoin.title')}</Text>
        <TouchableOpacity
          className="p-2"
          onPress={() => setMode(mode === 'scan' ? 'generate' : 'scan')}
        >
          <Icon 
            name={mode === 'scan' ? 'qr-code' : 'scan'} 
            size={20} 
            className="text-gray-600 dark:text-gray-400"
          />
        </TouchableOpacity>
      </View>

      {mode === 'scan' ? (
        <View className="px-4">
          <Text className="text-gray-900 dark:text-white text-xl font-semibold text-center mt-6 mb-3">{t('group:qrJoin.scanTitle')}</Text>
          <Text className="text-gray-600 dark:text-gray-400 text-base text-center leading-6 mb-8">
            {t('group:qrJoin.scanDescription')}
          </Text>

          <View className="flex-1 rounded-xl overflow-hidden mb-6">
            {BarCodeScanner ? (
              <>
                <BarCodeScanner
                  onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                  className="flex-1"
                />
                <View className="absolute inset-0 items-center justify-center">
                  <View className="w-50 h-50 border-2 border-blue-500 dark:border-blue-400 rounded-xl bg-transparent" />
                  <Text className="text-white text-sm text-center mt-6 bg-black/50 px-4 py-2 rounded-lg">
                    QR 코드를 프레임 안에 맞춰주세요
                  </Text>
                </View>
              </>
            ) : (
              <View className="flex-1 items-center justify-center">
                <Icon name="camera-off" size={48} className="text-gray-600 dark:text-gray-400 mb-4" />
                <Text className="text-gray-600 dark:text-gray-400 text-base">
                  카메라를 사용할 수 없습니다
                </Text>
              </View>
            )}
          </View>

          {scanned && (
            <View className="items-center py-4">
              {isLoading ? (
                <>
                  <ActivityIndicator size="small" className="text-blue-500 mb-2" />
                  <Text className="text-gray-600 dark:text-gray-400 text-base">처리 중...</Text>
                </>
              ) : (
                <TouchableOpacity
                  className="bg-blue-500 dark:bg-blue-600 px-6 py-3 rounded-lg"
                  onPress={() => setScanned(false)}
                >
                  <Text className="text-white text-base font-semibold">다시 스캔하기</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      ) : (
        <View className="flex-1 px-4 items-center">
          <Text className="text-gray-900 dark:text-white text-xl font-semibold text-center mt-6 mb-3">{t('group:qrJoin.generateTitle')}</Text>
          <Text className="text-gray-600 dark:text-gray-400 text-base text-center leading-6 mb-8">
            {t('group:qrJoin.generateDescription')}
          </Text>

          {selectedGroup ? (
            <View className="items-center flex-1">
              <View className="bg-white dark:bg-gray-800 p-6 rounded-2xl mb-6 shadow-lg">
                <QRCode
                  value={JSON.stringify(generateQRData(selectedGroup))}
                  size={200}
                  color="#1F2937"
                  backgroundColor="#FFFFFF"
                />
              </View>
              
              <View className="items-center mb-6">
                <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-2">{selectedGroup.name}</Text>
                <Text className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {t('group:qrJoin.groupDetails', { memberCount: selectedGroup.memberCount, type: selectedGroup.type })}
                </Text>
                <Text className="text-orange-500 dark:text-orange-400 text-sm text-center">
                  {t('group:qrJoin.qrExpiry')}
                </Text>
              </View>

              <TouchableOpacity
                className="flex-row items-center bg-white dark:bg-gray-800 px-4 py-3 rounded-lg border border-blue-500 dark:border-blue-400"
                onPress={() => {
                  // QR 코드 재생성 (타임스탬프 업데이트)
                  setSelectedGroup({ ...selectedGroup });
                }}
              >
                <Icon name="refresh" size={16} className="text-blue-500 dark:text-blue-400 mr-2" />
                <Text className="text-blue-500 dark:text-blue-400 text-sm font-semibold">{t('group:qrJoin.regenerate')}</Text>
              </TouchableOpacity>
            </View>  
          ) : (
            <View className="items-center flex-1 justify-center">
              <Icon name="people-outline" size={48} className="text-gray-500 dark:text-gray-500 mb-4" />
              <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-3">{t('group:qrJoin.noGroupSelected')}</Text>
              <Text className="text-gray-600 dark:text-gray-400 text-sm text-center leading-5 mb-8">
                {t('group:qrJoin.selectGroupDescription')}
              </Text>
              <TouchableOpacity
                className="bg-blue-500 dark:bg-blue-600 px-6 py-3 rounded-lg"
                onPress={() => navigation.navigate('Groups' as never)}
              >
                <Text className="text-white text-base font-semibold">{t('group:qrJoin.selectGroup')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};