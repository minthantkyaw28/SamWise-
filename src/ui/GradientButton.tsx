import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, glass, gradients, radius, touch } from '../theme/tokens';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRESS_MS = 180;

const BUTTON_SHADOW = {
  shadowColor: colors.accentDark,
  shadowOpacity: 0.32,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 9,
};

type Props = {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  variant?: 'primary' | 'ghost';
  small?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function GradientButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  small = false,
  disabled = false,
  style,
}: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const height = small ? 52 : touch.minHeight;
  const fg = variant === 'primary' ? '#FFFFFF' : colors.accent;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  const content = (
    <View style={styles.row}>
      {icon ? <Icon name={icon} size={small ? 20 : 24} color={fg} /> : null}
      <AppText variant="bodyBold" color={fg}>
        {label}
      </AppText>
    </View>
  );

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withTiming(0.96, { duration: PRESS_MS });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: PRESS_MS });
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        { borderRadius: radius.pill },
        variant === 'primary' ? BUTTON_SHADOW : null,
        animatedStyle,
        disabled ? { opacity: 0.5 } : null,
        style,
      ]}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={gradients.primaryButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.base, { height, borderRadius: radius.pill }]}
        >
          {content}
        </LinearGradient>
      ) : (
        <View style={[styles.base, styles.ghost, { height, borderRadius: radius.pill }]}>
          {content}
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ghost: {
    backgroundColor: glass.strong,
    borderWidth: 1.5,
    borderColor: 'rgba(44,107,224,0.28)',
  },
});
