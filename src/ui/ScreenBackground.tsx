import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, gradients } from '../theme/tokens';

type Props = {
  children: ReactNode;
  edges?: Edge[];
};

/** Calming aurora canvas with soft floating colour blobs behind all glass. */
export function ScreenBackground({ children, edges }: Props) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={gradients.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient colors={gradients.blobSky} style={[styles.blob, styles.blobA]} />
        <LinearGradient colors={gradients.blobLilac} style={[styles.blob, styles.blobB]} />
        <LinearGradient colors={gradients.blobPeach} style={[styles.blob, styles.blobC]} />
      </View>
      <SafeAreaView style={styles.safe} edges={edges ?? ['top', 'bottom']}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  blob: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    opacity: 0.45,
  },
  blobA: { top: -130, right: -100 },
  blobB: { top: 200, left: -150 },
  blobC: { bottom: -120, right: -80 },
});
