import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
} from 'react-native';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
}

export default function Toast({
  visible,
  message,
  type = 'success',
  duration = 4000,
  actionLabel,
  onAction,
  onDismiss,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide up and fade in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  const colors = {
    success: { bg: '#1B4332', border: '#2D6A4F', icon: '✅' },
    error: { bg: '#7C2D2D', border: '#9B1C1C', icon: '❌' },
    info: { bg: '#1E3A5F', border: '#2563EB', icon: 'ℹ️' },
  };

  const config = colors[type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{config.icon}</Text>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>

      {actionLabel && onAction && (
        <Pressable
          onPress={() => {
            onAction();
            hideToast();
          }}
          android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: false }}
          style={({ pressed }) => [
            styles.actionButton,
            { opacity: Platform.OS === 'ios' && pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      )}

      <Pressable onPress={hideToast} style={styles.closeButton}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
    marginRight: 10,
  },
  message: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  actionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
  closeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
});
