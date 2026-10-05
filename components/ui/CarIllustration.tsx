import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';

import { colors } from '@/constants/theme';
import type { Car } from '@/data/cars';

interface Props {
  bodyStyle: Car['bodyStyle'];
  size?: number; // controls overall width; height derives from viewBox ratio
  muted?: boolean; // used on dark cards (discount ribbon, etc.) — currently unused but kept for API symmetry
}

/**
 * Flat, brand-colored side-profile car mark used as a stand-in for the real
 * product photography referenced by the design (assets/cars/*.png). See the
 * note at the top of data/cars.ts for how to swap in real photos later.
 */
export function CarIllustration({ bodyStyle, size = 120 }: Props) {
  const height = size * 0.52;
  const isVan = bodyStyle === 'van';
  const isCoupe = bodyStyle === 'coupe';

  return (
    <View style={[styles.wrap, { width: size, height }]}>
      <Svg width={size} height={height} viewBox="0 0 200 104" fill="none">
        {/* shadow */}
        <Ellipse cx={100} cy={92} rx={78} ry={7} fill={colors.petrol} opacity={0.08} />

        {isVan ? (
          <Path
            d="M18 82V48c0-6 4-11 10-13l14-5c6-16 20-16 28-16h30c22 0 34 5 42 18l16 3c8 2 14 9 14 17v30a6 6 0 01-6 6h-8a20 20 0 01-40 0H72a20 20 0 01-40 0h-8a6 6 0 01-6-6z"
            fill={colors.petrol}
          />
        ) : (
          <Path
            d={
              isCoupe
                ? 'M14 78c-4 0-6-3-5-7l4-14c1-4 4-7 8-9l24-10c8-11 18-16 34-16h12c18 0 28 6 36 18l24 4c8 1 14 8 14 16v10a8 8 0 01-8 8h-6a20 20 0 01-40 0H68a20 20 0 01-40 0h-6a8 8 0 01-8-8z'
                : 'M12 80c-4 0-6-3-5-7l3-11c1-4 4-7 8-8l22-6c7-10 17-15 32-15h16c16 0 25 5 33 15l20 4c8 2 14 9 14 17v6a8 8 0 01-8 8h-6a20 20 0 01-40 0H66a20 20 0 01-40 0h-6a8 8 0 01-8-8z'
            }
            fill={colors.petrol}
          />
        )}

        {/* window band */}
        {isVan ? (
          <Path d="M56 51l10-13c4-5 10-8 17-8h20c11 0 20 6 25 16l4 5H56z" fill={colors.gold} opacity={0.85} />
        ) : (
          <Path
            d={
              isCoupe
                ? 'M46 47l16-9c6-8 14-12 24-12h9c11 0 18 4 24 12l14 3-3 6H50z'
                : 'M40 51l16-8c6-7 13-11 22-11h13c10 0 17 4 22 11l13 3-2 5H42z'
            }
            fill={colors.gold}
            opacity={0.85}
          />
        )}

        {/* wheels */}
        <Circle cx={64} cy={82} r={16} fill={colors.ink} />
        <Circle cx={64} cy={82} r={7} fill={colors.cream} />
        <Circle cx={140} cy={82} r={16} fill={colors.ink} />
        <Circle cx={140} cy={82} r={7} fill={colors.cream} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
