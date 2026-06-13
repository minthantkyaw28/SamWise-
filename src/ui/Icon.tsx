import { Ionicons } from '@expo/vector-icons';
import type { StyleProp, TextStyle } from 'react-native';

import { colors } from '../theme/tokens';

export type IconName =
  | 'mic'
  | 'send'
  | 'arrow-right'
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-left'
  | 'check'
  | 'check-circle'
  | 'lock'
  | 'gear'
  | 'sparkles'
  | 'person'
  | 'home'
  | 'close'
  | 'shield-check'
  | 'pencil'
  | 'paper-plane'
  | 'bell'
  | 'doc'
  | 'pound'
  | 'cross-medical'
  | 'phone'
  | 'calendar'
  | 'pin'
  | 'hand'
  | 'globe'
  | 'play'
  | 'pause'
  | 'dot'
  | 'ear';

const NAME_MAP: Record<IconName, React.ComponentProps<typeof Ionicons>['name']> = {
  mic: 'mic',
  send: 'arrow-up-circle',
  'arrow-right': 'arrow-forward',
  'chevron-down': 'chevron-down',
  'chevron-right': 'chevron-forward',
  'chevron-left': 'chevron-back',
  check: 'checkmark',
  'check-circle': 'checkmark-circle',
  lock: 'lock-closed',
  gear: 'settings-sharp',
  sparkles: 'sparkles',
  person: 'person',
  home: 'home',
  close: 'close',
  'shield-check': 'shield-checkmark',
  pencil: 'pencil',
  'paper-plane': 'paper-plane',
  bell: 'notifications',
  doc: 'document-text',
  pound: 'cash-outline',
  'cross-medical': 'medical',
  phone: 'call',
  calendar: 'calendar',
  pin: 'location',
  hand: 'hand-left',
  globe: 'globe',
  play: 'play',
  pause: 'pause',
  dot: 'ellipse',
  ear: 'ear',
};

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

export function Icon({ name, size = 22, color = colors.ink, style }: Props) {
  return <Ionicons name={NAME_MAP[name]} size={size} color={color} style={style} />;
}
