import React, { useRef, useEffect } from 'react';
import { Platform, TextInput, TextInputProps, View } from 'react-native';

interface CrossPlatformInputProps extends TextInputProps {
  webInputType?: string;
}

/**
 * Cross-platform input component that works on web, iOS, and Android
 * Uses HTML input on web and React Native TextInput on native platforms
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