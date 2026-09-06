import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Colors } from '../constants/colors';

const LINE_SPACING = 28;

/**
 * LedgerBackground renders an authentic ruled-paper / shop ledger line effect
 * across the entire screen using subtle, thin horizontal lines.
 */
export const LedgerBackground = React.memo(function LedgerBackground() {
  const { height } = useWindowDimensions();

  // Calculate enough lines to comfortably cover the screen plus scroll buffer
  const lineCount = useMemo(() => {
    const totalHeight = Math.max(height * 1.5, 1200);
    return Math.ceil(totalHeight / LINE_SPACING);
  }, [height]);

  const lines = useMemo(() => {
    return Array.from({ length: lineCount }, (_, i) => i);
  }, [lineCount]);

  return (
    <View style={styles.container} pointerEvents="none">
      {lines.map((i) => (
        <View
          key={i}
          style={[
            styles.line,
            { top: i * LINE_SPACING },
          ]}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.ledgerLine,
  },
});
