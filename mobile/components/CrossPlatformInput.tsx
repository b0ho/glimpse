import React, { useRef, useEffect } from 'react';
import { Platform, TextInput, TextInputProps, View } from 'react-native';

/**
 * CrossPlatformInput Props
 *
 * @interface CrossPlatformInputProps
 * @extends TextInputProps
 */
interface CrossPlatformInputProps extends TextInputProps {
  /** Web에서 사용할 HTML input type (email, tel, url 등) */
  webInputType?: string;
}

/**
 * 크로스 플랫폼 입력 컴포넌트
 *
 * @description Web, iOS, Android에서 동일하게 작동하는 input 컴포넌트.
 *              Web에서는 HTML input/textarea 사용, Native에서는 TextInput 사용.
 *              플랫폼별 키보드 타입 자동 매핑.
 *
 * @component UI
 * @props CrossPlatformInputProps
 * @usage 모든 화면의 폼 입력 필드
 *
 * @example
 * <CrossPlatformInput
 *   placeholder="이메일 입력"
 *   keyboardType="email-address"
 *   value={email}
 *   onChangeText={setEmail}
 * />
 */
export const CrossPlatformInput: React.FC<CrossPlatformInputProps> = ({
  style,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  maxLength,
  secureTextEntry,
  multiline,
  numberOfLines,
  placeholderTextColor,
  editable = true,
  autoFocus,
  webInputType,
  ...props
}) => {
  const webInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && autoFocus && webInputRef.current) {
      webInputRef.current.focus();
    }
  }, [autoFocus]);

  if (Platform.OS === 'web') {
    // Web-specific implementation using HTML input
    const styleObject = Array.isArray(style) 
      ? Object.assign({}, ...style.filter(s => s))
      : style || {};

    const inputStyle = {
      fontFamily: 'System',
      fontSize: 16,
      padding: 12,
      borderWidth: 1,
      borderRadius: 8,
      backgroundColor: 'transparent',
      color: styleObject.color || '#000000',
      borderColor: styleObject.borderColor || '#E0E0E0',
      width: '100%',
      outline: 'none',
      ...styleObject
    };

    // Convert React Native keyboard type to HTML input type
    const getInputType = () => {
      if (webInputType) return webInputType;
      if (secureTextEntry) return 'password';
      switch (keyboardType) {
        case 'email-address':
          return 'email';
        case 'numeric':
        case 'number-pad':
        case 'decimal-pad':
          return 'tel'; // Using tel for better mobile numeric keyboard
        case 'phone-pad':
          return 'tel';
        case 'url':
          return 'url';
        default:
          return 'text';
      }
    };

    if (multiline) {
      return (
        <textarea
          ref={webInputRef as React.RefObject<HTMLTextAreaElement>}
          style={inputStyle as React.CSSProperties}
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => onChangeText?.(e.target.value)}
          maxLength={maxLength}
          disabled={!editable}
          rows={numberOfLines || 4}
          autoFocus={autoFocus}
        />
      );
    }

    return (
      <input
        ref={webInputRef as React.RefObject<HTMLInputElement>}
        type={getInputType()}
        style={inputStyle as React.CSSProperties}
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => onChangeText?.(e.target.value)}
        maxLength={maxLength}
        disabled={!editable}
        autoFocus={autoFocus}
      />
    );
  }

  // Native implementation using React Native TextInput
  return (
    <TextInput
      style={style}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      maxLength={maxLength}
      secureTextEntry={secureTextEntry}
      multiline={multiline}
      numberOfLines={numberOfLines}
      editable={editable}
      autoFocus={autoFocus}
      {...props}
    />
  );
};