import { Text, type TextProps, type TextStyle } from 'react-native';

import { colors, font } from '../theme/tokens';

export type TypeVariant =
  | 'hero'
  | 'display'
  | 'title'
  | 'heading'
  | 'bodyLg'
  | 'body'
  | 'bodyBold'
  | 'label'
  | 'caption'
  | 'mono';

type Props = TextProps & {
  variant?: TypeVariant;
  color?: string;
  center?: boolean;
};

const RAMP: Record<TypeVariant, TextStyle> = {
  hero: { fontFamily: font.familyDisplay, fontSize: font.hero, lineHeight: font.hero * font.lineHeight },
  display: { fontFamily: font.familyDisplay, fontSize: font.display, lineHeight: font.display * font.lineHeight },
  title: { fontFamily: font.familyHeading, fontSize: font.title, lineHeight: font.title * font.lineHeight },
  heading: { fontFamily: font.familyHeading, fontSize: 22, lineHeight: 22 * font.lineHeight },
  bodyLg: { fontFamily: font.familyBodyMedium, fontSize: font.bodyLarge, lineHeight: font.bodyLarge * font.lineHeight },
  body: { fontFamily: font.familyBody, fontSize: font.body, lineHeight: font.body * font.lineHeight },
  bodyBold: { fontFamily: font.familyBodyBold, fontSize: font.body, lineHeight: font.body * font.lineHeight },
  label: { fontFamily: font.familyBodyBold, fontSize: font.bodySmall, lineHeight: font.bodySmall * font.lineHeight },
  caption: { fontFamily: font.familyBodyMedium, fontSize: 14, lineHeight: 14 * font.lineHeight },
  mono: { fontFamily: font.familyMono, fontSize: 14, lineHeight: 14 * font.lineHeight },
};

export function AppText({ variant = 'body', color = colors.ink, center, style, ...rest }: Props) {
  return (
    <Text style={[RAMP[variant], { color }, center ? { textAlign: 'center' } : null, style]} {...rest} />
  );
}
