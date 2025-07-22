import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '@/store/slices/authSlice';
import { COLORS, SPACING, FONT_SIZES, REGEX } from '@/utils/constants';

interface NicknameSetupScreenProps {
  onNicknameSet: () => void;
}

export const NicknameSetupScreen: React.FC<NicknameSetupScreenProps> = ({
  onNicknameSet,
}) => {
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const authStore = useAuthStore();

  const validateNickname = (text: string): boolean => {
    return REGEX.NICKNAME.test(text);
  };

  const checkNicknameAvailability = async (text: string): Promise<void> => {
    if (!validateNickname(text)) {
      setIsAvailable(false);
      return;
    }

    // 실제로는 백엔드 API를 호출하여 닉네임 중복을 확인
    // 지금은 간단한 로컬 검증만 구현
    const unavailableNicknames = ['admin', 'system', 'glimpse', '관리자'];
    const available = !unavailableNicknames.includes(text.toLowerCase());
    setIsAvailable(available);
  };

  const handleNicknameChange = (text: string): void => {
    setNickname(text);
    setIsAvailable(null);
    
    // 디바운스를 위한 타이머 (실제로는 useCallback과 useMemo 사용 권장)
    if (text.length >= 2) {
      setTimeout(() => {
        if (text === nickname) { // 입력이 변경되지 않았으면 검증
          checkNicknameAvailability(text);
        }
      }, 500);
    }
  };

  const handleSetNickname = async (): Promise<void> => {
    if (!nickname.trim()) {
      Alert.alert('오류', '닉네임을 입력해주세요.');
      return;
    }

    if (!validateNickname(nickname)) {
      Alert.alert('오류', '닉네임은 2-20자의 한글, 영문, 숫자만 사용 가능합니다.');
      return;
    }

    if (isAvailable === false) {
      Alert.alert('오류', '이미 사용 중인 닉네임입니다.');
      return;
    }

    setIsLoading(true);

    try {
      // 사용자 정보 업데이트
      authStore.updateUser({ nickname: nickname.trim() });
      
      Alert.alert(
        '닉네임 설정 완료',
        `"${nickname}" 닉네임으로 설정되었습니다.`,
        [
          {
            text: '확인',
            onPress: onNicknameSet,
          },
        ]
      );
    } catch (error) {
      console.error('Nickname setup error:', error);
      Alert.alert('오류', '닉네임 설정 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const getInputBorderColor = (): string => {
    if (!nickname) return COLORS.BORDER;
    if (isAvailable === true) return COLORS.SUCCESS;
    if (isAvailable === false) return COLORS.ERROR;
    return COLORS.PRIMARY;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>닉네임 설정</Text>
        <Text style={styles.subtitle}>
          Glimpse에서 사용할{'\n'}
          닉네임을 설정해주세요
        </Text>
        
        <View style={styles.form}>
          <Text style={styles.label}>닉네임</Text>
          <Text style={styles.description}>
            2-20자의 한글, 영문, 숫자를 사용할 수 있습니다.{'\n'}
            다른 사용자에게 표시될 이름입니다.
          </Text>
          
          <TextInput
            style={[
              styles.input,
              { borderColor: getInputBorderColor() }
            ]}
            placeholder="닉네임을 입력하세요"
            value={nickname}
            onChangeText={handleNicknameChange}
            maxLength={20}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          {nickname && (
            <View style={styles.validationContainer}>
              {isAvailable === null && nickname.length >= 2 && (
                <Text style={styles.checkingText}>중복 확인 중...</Text>
              )}
              {isAvailable === true && (
                <Text style={styles.availableText}>✓ 사용 가능한 닉네임입니다</Text>
              )}
              {isAvailable === false && (
                <Text style={styles.unavailableText}>
                  {validateNickname(nickname) 
                    ? '이미 사용 중인 닉네임입니다' 
                    : '2-20자의 한글, 영문, 숫자만 사용 가능합니다'
                  }
                </Text>
              )}
            </View>
          )}
          
          <TouchableOpacity
            style={[
              styles.button,
              (!nickname.trim() || isLoading || isAvailable === false) && styles.buttonDisabled,
            ]}
            onPress={handleSetNickname}
            disabled={!nickname.trim() || isLoading || isAvailable === false}
          >
            {isLoading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color={COLORS.TEXT.WHITE} />
                <Text style={[styles.buttonText, { marginLeft: SPACING.SM }]}>
                  설정 중...
                </Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>닉네임 설정하기</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <Text style={styles.notice}>
          닉네임은 나중에 변경할 수 있습니다.{'\n'}
          매칭 후에만 상대방에게 공개됩니다.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.LG,
  },
  title: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  subtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.XXL,
  },
  form: {
    marginBottom: SPACING.XXL,
  },
  label: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.SM,
  },
  description: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    lineHeight: 20,
    marginBottom: SPACING.LG,
  },
  input: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    fontSize: FONT_SIZES.MD,
    marginBottom: SPACING.SM,
  },
  validationContainer: {
    marginBottom: SPACING.LG,
  },
  checkingText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
  },
  availableText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.SUCCESS,
    fontWeight: '500',
  },
  unavailableText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.ERROR,
    fontWeight: '500',
  },
  button: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: COLORS.TEXT.LIGHT,
  },
  buttonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.LIGHT,
    textAlign: 'center',
    lineHeight: 16,
  },
});