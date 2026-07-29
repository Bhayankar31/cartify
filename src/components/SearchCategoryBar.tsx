import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ReanimatedAnimated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSpring,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';

const AnimatedIonicons = ReanimatedAnimated.createAnimatedComponent(Ionicons);
const AnimatedMaterialCommunityIcons = ReanimatedAnimated.createAnimatedComponent(MaterialCommunityIcons);

const INACTIVE_ICON_COLOR = '#6B6B6B';
const ACTIVE_ICON_COLOR = '#111111';

interface Category {
  id: string;
  name: string;
  icon: string;
  provider: 'Ionicons' | 'MaterialCommunityIcons';
  badge?: string;
}

const categories: Category[] = [
  { id: '1', name: 'All', icon: 'basket-outline', provider: 'MaterialCommunityIcons' },
  { id: '2', name: 'Gaming', icon: 'game-controller-outline', provider: 'Ionicons', badge: 'New' },
  { id: '3', name: 'Electronics', icon: 'headset-outline', provider: 'Ionicons' },
  { id: '4', name: 'Decor', icon: 'bed-outline', provider: 'Ionicons' },
  { id: '5', name: 'Beauty', icon: 'color-palette-outline', provider: 'Ionicons' },
  { id: '6', name: 'Snacks', icon: 'fast-food-outline', provider: 'Ionicons' },
  { id: '7', name: 'Drinks', icon: 'water-outline', provider: 'Ionicons' },
];

interface CategoryItemProps {
  category: Category;
  isActive: boolean;
  onPress: () => void;
}

// ---------- Single category button, animated with Reanimated ----------

const CategoryItem = React.memo(({ category, isActive, onPress }: CategoryItemProps) => {
  // 0 -> inactive, 1 -> active. Drives the pill, underline, and icon color together.
  const progress = useSharedValue(isActive ? 1 : 0);
  // Separate value just for the quick press-down/release tactile bounce.
  const pressScale = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
  }, [isActive, progress]);

  const onPressIn = useCallback(() => {
    pressScale.value = withTiming(0.88, { duration: 90 });
  }, [pressScale]);

  const onPressOut = useCallback(() => {
    pressScale.value = withSpring(1, { damping: 12, stiffness: 220, mass: 0.5 });
  }, [pressScale]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  // Soft rounded highlight behind the icon, fades + scales in when active.
  const pillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.6 + progress.value * 0.4 }],
  }));

  const iconAnimatedProps = useAnimatedProps(() => ({
    color: interpolateColor(progress.value, [0, 1], [INACTIVE_ICON_COLOR, ACTIVE_ICON_COLOR]),
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], ['#4B4B4B', '#000000']),
  }));

  // Underline grows in from the center via scaleX instead of just appearing.
  const underlineStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scaleX: progress.value }],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
      className="items-center mr-7"
    >
      <ReanimatedAnimated.View style={pressStyle} className="items-center">
        <View className="relative items-center justify-center w-11 h-11">
          <ReanimatedAnimated.View
            style={[pillStyle, { backgroundColor: '#00000012' }]}
            className="absolute w-11 h-11 rounded-full"
          />

          {category.badge && (
            <View
              className="absolute z-10 bg-[#E53935] rounded-[4px] items-center justify-center"
              style={{ top: -2, right: -8, paddingHorizontal: 4, paddingVertical: 1.5 }}
            >
              <Text style={{ fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF', fontSize: 8 }}>
                {category.badge}
              </Text>
            </View>
          )}

          {category.provider === 'Ionicons' ? (
            <AnimatedIonicons name={category.icon as any} size={26} animatedProps={iconAnimatedProps} />
          ) : (
            <AnimatedMaterialCommunityIcons
              name={category.icon as any}
              size={26}
              animatedProps={iconAnimatedProps}
            />
          )}
        </View>

        <ReanimatedAnimated.Text
          style={[{ fontFamily: isActive ? 'Poppins_700Bold' : 'Poppins_500Medium', fontSize: 12 }, textAnimatedStyle]}
          className="mt-1"
        >
          {category.name}
        </ReanimatedAnimated.Text>

        <ReanimatedAnimated.View
          style={underlineStyle}
          className="w-6 h-[3px] bg-black rounded-full mt-1"
        />
      </ReanimatedAnimated.View>
    </TouchableOpacity>
  );
});
CategoryItem.displayName = 'CategoryItem';

// ---------- Main bar ----------

interface SearchCategoryBarProps {
  activeCategory: string;
  onSelectCategory: (id: string) => void;
}

const SearchCategoryBar: React.FC<SearchCategoryBarProps> = ({ activeCategory, onSelectCategory }) => {
  const [searchText, setSearchText] = useState('');

  const [currentIndex, setCurrentIndex] = useState(0);
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const placeholders = ['"milk"', '"neon strips"', '"wall decor"', '"chocolates"', '"gaming accessories"'];

  // Animated Placeholder Effect
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -15, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setCurrentIndex((prev) => (prev + 1) % placeholders.length);
        translateY.setValue(15);
        Animated.parallel([
          Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [opacity, translateY]);

  return (
    <View className="bg-[#FFD600] pb-2">
      <View className="px-4 py-2">
        <View className="flex-row items-center bg-white rounded-xl px-3 h-[48px] shadow-sm">
          <Ionicons name="search" size={20} color="#444444" />

          <View className="flex-1 mx-2 relative justify-center h-full">
            {searchText.length === 0 && (
              <View className="absolute inset-0 flex-row items-center" pointerEvents="none">
                <Text style={{ fontFamily: 'Poppins_400Regular', marginTop: 2 }} className="text-[15px] text-[#888888]">
                  Search{' '}
                </Text>
                <Animated.Text
                  style={{ fontFamily: 'Poppins_400Regular', marginTop: 2, opacity, transform: [{ translateY }] }}
                  className="text-[15px] text-[#888888]"
                >
                  {placeholders[currentIndex]}
                </Animated.Text>
              </View>
            )}

            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              className="flex-1 text-[15px] text-black h-full"
              style={{ fontFamily: 'Poppins_400Regular', marginTop: 2, paddingVertical: 0 }}
            />
          </View>
        </View>
      </View>

      <View className="mt-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: categories.length <= 5 ? 'center' : 'flex-start',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingBottom: 4,
          }}
        >
          {categories.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              isActive={activeCategory === category.id}
              onPress={() => onSelectCategory(category.id)}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

export default SearchCategoryBar;