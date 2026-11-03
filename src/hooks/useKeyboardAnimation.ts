import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';
import { useKeyboardState } from './useKeyboardState';

/** Provides an animated 0-to-1 visibility value and the native event duration. */
export function useKeyboardAnimation(): {
  progress: Animated.Value;
  animationDuration: number;
} {
  const keyboard = useKeyboardState();
  const progressRef = useRef<Animated.Value | null>(null);
  if (!progressRef.current) {
    progressRef.current = new Animated.Value(keyboard.progress);
  }
  const progress = progressRef.current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (active) {
        setReduceMotion(enabled);
      }
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: keyboard.progress,
      duration: reduceMotion ? 0 : keyboard.animationDuration,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [keyboard.animationDuration, keyboard.progress, progress, reduceMotion]);

  return { progress, animationDuration: keyboard.animationDuration };
}
