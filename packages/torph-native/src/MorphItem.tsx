import { createContext, useContext, useMemo, type ReactNode } from "react";
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useSharedValue,
  withClamp,
  withSpring,
  type LayoutAnimationsValues,
  type SharedValue,
} from "react-native-reanimated";

type Bounds = { width: SharedValue<number>; height: SharedValue<number> };

const ListBounds = createContext<Bounds | null>(null);

export interface MorphListProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * A container for MorphItems that keeps their motion inside it. Items may spring and
 * overshoot (`bounce`), but every move is clamped to the list's own box, so a row
 * travelling from the top to the bottom settles with a bounce without ever swinging
 * past the edge.
 */
export function MorphList({ children, style }: MorphListProps) {
  const width = useSharedValue(0);
  const height = useSharedValue(0);
  const bounds = useMemo(() => ({ width, height }), [width, height]);
  const onLayout = (event: LayoutChangeEvent) => {
    width.value = event.nativeEvent.layout.width;
    height.value = event.nativeEvent.layout.height;
  };
  return (
    <ListBounds.Provider value={bounds}>
      <View style={style} onLayout={onLayout}>
        {children}
      </View>
    </ListBounds.Provider>
  );
}

export interface MorphItemProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Let the move overshoot and settle. Inside a MorphList the overshoot is clamped to
   * the list's box; on its own it is free. Default false: a straight glide.
   */
  bounce?: boolean;
  /** Spring damping for the move. Default 30, or 14 with `bounce`. */
  damping?: number;
  /** Spring stiffness for the move. Default 260, or 200 with `bounce`. */
  stiffness?: number;
}

/**
 * An item that glides to its new place when its list or grid reorders, regroups or
 * reflows, and fades in and out as it is added or removed. Give each one a stable key.
 */
export function MorphItem({ children, style, bounce = false, damping, stiffness }: MorphItemProps) {
  const bounds = useContext(ListBounds);
  const d = damping ?? (bounce ? 14 : 30);
  const k = stiffness ?? (bounce ? 200 : 260);

  const layout = useMemo(() => {
    if (!bounce || !bounds) {
      return LinearTransition.springify()
        .damping(d)
        .stiffness(k)
        .overshootClamping(bounce ? 0 : 1);
    }
    const { width, height } = bounds;
    // A bouncy spring whose position can't leave the list: clamp each axis to the
    // range where the whole item is still inside its parent.
    return (values: LayoutAnimationsValues) => {
      "worklet";
      const spring = { damping: d, stiffness: k, mass: 1 };
      const maxX = Math.max(0, width.value - values.targetWidth);
      const maxY = Math.max(0, height.value - values.targetHeight);
      return {
        initialValues: {
          originX: values.currentOriginX,
          originY: values.currentOriginY,
          width: values.currentWidth,
          height: values.currentHeight,
        },
        animations: {
          originX: withClamp({ min: 0, max: maxX }, withSpring(values.targetOriginX, spring)),
          originY: withClamp({ min: 0, max: maxY }, withSpring(values.targetOriginY, spring)),
          width: withSpring(values.targetWidth, { ...spring, overshootClamping: true }),
          height: withSpring(values.targetHeight, { ...spring, overshootClamping: true }),
        },
      };
    };
  }, [bounce, bounds, d, k]);

  return (
    <Animated.View
      style={style}
      layout={layout}
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(120)}
    >
      {children}
    </Animated.View>
  );
}
