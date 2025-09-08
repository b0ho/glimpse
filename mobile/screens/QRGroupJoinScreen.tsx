import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { shadowStyles } from '@/utils/shadowStyles';

interface QRGroupData {
  groupId: string;
  groupName: string;
  timestamp: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>{t('group:qrJoin.checkingPermission')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={COLORS.TEXT.PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('group:qrJoin.title')}</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.permissionContainer}>
          <Icon name="camera-outline" size={64} color={COLORS.TEXT.LIGHT} />
          <Text style={styles.permissionTitle}>{t('group:qrJoin.permissionRequired')}</Text>
          <Text style={styles.permissionDescription}>
            {t('group:qrJoin.permissionDescription')}
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={async () => {
              const { status } = await BarCodeScanner.requestPermissionsAsync();
              setHasPermission(status === 'granted');
            }}
          >
            <Text style={styles.permissionButtonText}>{t('group:qrJoin.allowPermission')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={COLORS.TEXT.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('group:qrJoin.title')}</Text>
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setMode(mode === 'scan' ? 'generate' : 'scan')}
        >
          <Icon 
            name={mode === 'scan' ? 'qr-code' : 'scan'} 
            size={20} 
            color={COLORS.TEXT.SECONDARY} 
          />
        </TouchableOpacity>
      </View>

      {mode === 'scan' ? (
        <View style={styles.scanContainer}>
          <Text style={styles.instructionTitle}>{t('group:qrJoin.scanTitle')}</Text>
          <Text style={styles.instructionText}>
            {t('group:qrJoin.scanDescription')}
          </Text>

          <View style={styles.cameraContainer}>
            {BarCodeScanner ? (
              <>
                <BarCodeScanner
                  onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                  style={styles.camera}
                />
                <View style={styles.scanOverlay}>
                  <View style={styles.scanFrame} />
                  <Text style={styles.scanText}>
                    QR 코드를 프레임 안에 맞춰주세요
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.unavailableContainer}>
                <Icon name="camera-off" size={48} color={COLORS.TEXT.SECONDARY} />
                <Text style={styles.unavailableText}>
                  카메라를 사용할 수 없습니다
                </Text>
              </View>
            )}
          </View>

          {scanned && (
            <View style={styles.scannedContainer}>
              {isLoading ? (
                <>
                  <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                  <Text style={styles.processingText}>처리 중...</Text>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.rescanButton}
                  onPress={() => setScanned(false)}
                >
                  <Text style={styles.rescanButtonText}>다시 스캔하기</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.generateContainer}>
          <Text style={styles.instructionTitle}>{t('group:qrJoin.generateTitle')}</Text>
          <Text style={styles.instructionText}>
            {t('group:qrJoin.generateDescription')}
          </Text>

          {selectedGroup ? (
            <View style={styles.qrContainer}>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={JSON.stringify(generateQRData(selectedGroup))}
                  size={200}
                  color={COLORS.TEXT.PRIMARY}
                  backgroundColor={COLORS.SURFACE}
                />
              </View>
              
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{selectedGroup.name}</Text>
                <Text style={styles.groupDetails}>
                  {t('group:qrJoin.groupDetails', { memberCount: selectedGroup.memberCount, type: selectedGroup.type })}
                </Text>
                <Text style={styles.qrWarning}>
                  {t('group:qrJoin.qrExpiry')}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.regenerateButton}
                onPress={() => {
                  // QR 코드 재생성 (타임스탬프 업데이트)
                  setSelectedGroup({ ...selectedGroup });
                }}
              >
                <Icon name="refresh" size={16} color={COLORS.PRIMARY} />
                <Text style={styles.regenerateButtonText}>{t('group:qrJoin.regenerate')}</Text>
              </TouchableOpacity>
            </View>  
          ) : (
            <View style={styles.noGroupContainer}>
              <Icon name="people-outline" size={48} color={COLORS.TEXT.LIGHT} />
              <Text style={styles.noGroupTitle}>{t('group:qrJoin.noGroupSelected')}</Text>
              <Text style={styles.noGroupDescription}>
                {t('group:qrJoin.selectGroupDescription')}
              </Text>
              <TouchableOpacity
                style={styles.selectGroupButton}
                onPress={() => navigation.navigate('Groups' as never)}
              >
                <Text style={styles.selectGroupButtonText}>{t('group:qrJoin.selectGroup')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

// const { width } = Dimensions.get('window'); // Unused

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  backButton: {
    padding: SPACING.SM,
  },
  headerTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  headerRight: {
    width: 40,
  },
  switchButton: {
    padding: SPACING.SM,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    marginTop: SPACING.MD,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.LG,
  },
  permissionTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginTop: SPACING.LG,
    marginBottom: SPACING.SM,
  },
  permissionDescription: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.XL,
  },
  permissionButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.MD,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  scanContainer: {
    flex: 1,
    paddingHorizontal: SPACING.MD,
  },
  generateContainer: {
    flex: 1,
    paddingHorizontal: SPACING.MD,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    textAlign: 'center',
    marginTop: SPACING.LG,
    marginBottom: SPACING.SM,
  },
  instructionText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.XL,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: SPACING.LG,
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    borderRadius: 12,
    backgroundColor: COLORS.TRANSPARENT,
  },
  scanText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.WHITE,
    textAlign: 'center',
    marginTop: SPACING.LG,
    backgroundColor: COLORS.OVERLAY,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 8,
  },
  scannedContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.MD,
  },
  processingText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    marginTop: SPACING.SM,
  },
  rescanButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderRadius: 8,
  },
  rescanButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  qrContainer: {
    alignItems: 'center',
    flex: 1,
  },
  qrWrapper: {
    backgroundColor: COLORS.SURFACE,
    padding: SPACING.LG,
    borderRadius: 16,
    marginBottom: SPACING.LG,
    ...shadowStyles.card,
  },
  groupInfo: {
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  groupName: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.XS,
  },
  groupDetails: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SPACING.MD,
  },
  qrWarning: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.WARNING,
    textAlign: 'center',
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  regenerateButtonText: {
    color: COLORS.PRIMARY,
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    marginLeft: SPACING.XS,
  },
  noGroupContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  noGroupTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginTop: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  noGroupDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.XL,
  },
  selectGroupButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderRadius: 8,
  },
  selectGroupButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
});