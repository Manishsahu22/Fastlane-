import { useWindowDimensions } from 'react-native';

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 700;
  const isLandscape = width > height;
  return { width, height, isTablet, isLandscape };
}
