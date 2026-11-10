import { Children, createContext, useContext, type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

type Slot = { index: number; count: number };

const ListSlot = createContext<Slot | null>(null);

export interface MorphListProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * A container for MorphItems that keeps their motion inside it. Items that land in
 * the first or last slot glide in without overshooting (that is where an overshoot
 * would leave the box); items landing in between may bounce, which a gentle spring
 * keeps well inside their neighbours' room. The list also clips, as a safety net.
 */
export function MorphList({ children, style }: MorphListProps) {
  const items = Children.toArray(children);
  return (
    <View style={[styles.list, style]}>
      {items.map((child, index) => (
        <ListSlot.Provider key={(child as { key?: string }).key ?? index} value={{ index, count: items.length }}>
          {child}
        </ListSlot.Provider>
      ))}
    </View>
  );
}

export interface MorphItemProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Let the move overshoot and settle, about 5% of the distance. Inside a MorphList,
   * items landing in the first or last slot still glide in, so nothing leaves the
   * list. Default false: every move glides.
   */
  bounce?: boolean;
  /** Spring damping for the move. Default 30, or 21 with `bounce`. */
  damping?: number;
  /** Spring stiffness for the move. Default 260, or 240 with `bounce`. */
  stiffness?: number;
}

/**
 * An item that springs to its new place when its list or grid reorders, regroups or
 * reflows, and fades in and out as it is added or removed. Give each one a stable key.
 */
export function MorphItem({ children, style, bounce = false, damping, stiffness }: MorphItemProps) {
  const slot = useContext(ListSlot);
  const atEdge = slot !== null && (slot.index === 0 || slot.index === slot.count - 1);
  const bouncy = bounce && !atEdge;

  const layout = LinearTransition.springify()
    .damping(damping ?? (bouncy ? 21 : 30))
    .stiffness(stiffness ?? (bouncy ? 240 : 260))
    .overshootClamping(bouncy ? 0 : 1);

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

const styles = StyleSheet.create({
  list: { overflow: "hidden" },
});
