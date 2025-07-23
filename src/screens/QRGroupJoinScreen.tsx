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
import { BarCodeScanner } from 'expo-barcode-scanner';
import Icon from 'react-native-vector-icons/Ionicons';
import QRCode from 'react-native-qrcode-svg';
import { useGroupStore } from '@/store/slices/groupSlice';
import { Group } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

interface QRGroupData {
  groupId: string;
  groupName: string;
  timestamp: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export const QRGroupJoinScreen: React.FC = () => {
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
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
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
        Alert.alert('만료된 QR 코드', 'QR 코드가 만료되었습니다. 새로운 QR 코드를 요청해주세요.');
        setScanned(false);
        setIsLoading(false);
        return;
      }

      // 그룹 참여 확인
      Alert.alert(
        '그룹 참여',
        `"${qrData.groupName}" 그룹에 참여하시겠습니까?`,
        [
          {
            text: '취소',
            style: 'cancel',
            onPress: () => {
              setScanned(false);
              setIsLoading(false);
            },
          },
          {
            text: '참여하기',
            onPress: async () => {
              try {
                // 그룹 ID로 그룹 정보 찾기
                const targetGroup = groups.find(g => g.id === qrData.groupId);
                if (!targetGroup) {
                  Alert.alert('오류', '해당 그룹을 찾을 수 없습니다.');
                  setScanned(false);
                  setIsLoading(false);
                  return;
                }
                
                await joinGroup(targetGroup);
                // 참여 성공으로 간주
                Alert.alert(
                  '참여 완료',
                  `"${qrData.groupName}" 그룹에 성공적으로 참여했습니다!`,
                  [
                    {
                      text: '확인',
                      onPress: () => {
                        navigation.navigate('Groups' as never);
                      },
                    },
                  ]
                );
              } catch (error) {
                console.error('Join group error:', error);
                Alert.alert('오류', '그룹 참여 중 오류가 발생했습니다.');
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
      Alert.alert('잘못된 QR 코드', '올바른 Glimpse 그룹 QR 코드가 아닙니다.');
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
          <Text style={styles.loadingText}>카메라 권한을 확인하는 중...</Text>
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
          <Text style={styles.headerTitle}>QR 코드 그룹</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.permissionContainer}>
          <Icon name="camera-outline" size={64} color={COLORS.TEXT.LIGHT} />
          <Text style={styles.permissionTitle}>카메라 권한이 필요합니다</Text>
          <Text style={styles.permissionDescription}>
            QR 코드를 스캔하여 그룹에 참여하려면{'\n'}
            카메라 권한이 필요합니다
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={async () => {
              const { status } = await BarCodeScanner.requestPermissionsAsync();
              setHasPermission(status === 'granted');
            }}
          >
            <Text style={styles.permissionButtonText}>카메라 권한 허용하기</Text>
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
        <Text style={styles.headerTitle}>QR 코드 그룹</Text>
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
          <Text style={styles.instructionTitle}>QR 코드를 스캔하세요</Text>
          <Text style={styles.instructionText}>
            다른 사용자가 생성한 그룹 QR 코드를{'\n'}
            카메라로 스캔하여 그룹에 참여하세요
          </Text>

          <View style={styles.cameraContainer}>
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
          <Text style={styles.instructionTitle}>그룹 QR 코드 생성</Text>
          <Text style={styles.instructionText}>
            다른 사용자들이 스캔하여{'\n'}
            그룹에 쉽게 참여할 수 있게 해주세요
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
                  멤버 {selectedGroup.memberCount}명 • {selectedGroup.type}
                </Text>
                <Text style={styles.qrWarning}>
                  ⚠️ 이 QR 코드는 5분 후 만료됩니다
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
                <Text style={styles.regenerateButtonText}>새로 생성</Text>
              </TouchableOpacity>
            </View>  
          ) : (
            <View style={styles.noGroupContainer}>
              <Icon name="people-outline" size={48} color={COLORS.TEXT.LIGHT} />
              <Text style={styles.noGroupTitle}>선택된 그룹이 없습니다</Text>
              <Text style={styles.noGroupDescription}>
                그룹 목록에서 QR 코드를 생성할{'\n'}
                그룹을 선택해주세요
              </Text>
              <TouchableOpacity
                style={styles.selectGroupButton}
                onPress={() => navigation.navigate('Groups' as never)}
              >
                <Text style={styles.selectGroupButtonText}>그룹 선택하기</Text>
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
    elevation: 3,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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