import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Image, Text, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Carousel } from 'react-native-reanimated-carousel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HEIGHT = 210;
const CAROUSEL_HEIGHT = CARD_HEIGHT + 16; // must match SlideCard's content height exactly (pt-4 = 16px)
const AUTOPLAY_INTERVAL = 4000;

// ---------- Types ----------

type ButtonType = 'primary' | 'secondary';

interface SlideButton {
  text: string;
  type: ButtonType;
  action: () => void;
}

interface Slide {
  id: string;
  title: string;
  source: { uri: string };
  buttons: SlideButton[];
}

// ---------- Data ----------

const SLIDES: Slide[] = [
  {
    id: '1',
    title: '25 Years of Magic',
    source: { uri: 'https://images.unsplash.com/photo-1618944847023-38aa001235f0?q=80&w=1000&auto=format&fit=crop' },
    buttons: [{ text: 'Shop Now', type: 'primary', action: () => console.log('Shop Now clicked') }],
  },
  {
    id: '2',
    title: 'Gaming Setup Showcase',
    source: { uri: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?q=80&w=1000&auto=format&fit=crop' },
    buttons: [],
  },
  {
    id: '3',
    title: 'Gaming Setup Specials',
    source: { uri: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1000&auto=format&fit=crop' },
    buttons: [
      { text: 'Explore', type: 'primary', action: () => console.log('Explore clicked') },
      { text: 'Visit', type: 'secondary', action: () => console.log('Visit clicked') },
    ],
  },
  {
    id: '4',
    title: 'Latest Electronics',
    source: { uri: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop' },
    buttons: [
      { text: 'Buy Now', type: 'primary', action: () => console.log('Buy Now clicked') },
      { text: 'Details', type: 'secondary', action: () => console.log('Details clicked') },
    ],
  },
];

// ---------- Segmented, animated progress dots ----------
// Only the ACTIVE slide gets the elongated "filling line" look.
// Every other dot is a small solid circle (bright = already seen, dim = upcoming).

type DotStatus = 'done' | 'active' | 'upcoming';

const DOT_SIZE = 6; // circle diameter for done/upcoming dots
const BAR_WIDTH = 22; // track width for the active dot

const ProgressDot = ({ status }: { status: DotStatus }) => {
  const isActive = status === 'active';
  const width = useSharedValue(isActive ? BAR_WIDTH : DOT_SIZE);
  const fill = useSharedValue(status === 'done' ? 1 : 0);

  useEffect(() => {
    // Spring for the resize — feels a lot smoother/more natural than a fixed-duration timing curve.
    width.value = withSpring(isActive ? BAR_WIDTH : DOT_SIZE, {
      damping: 16,
      stiffness: 180,
      mass: 0.5,
    });

    if (isActive) {
      // Reset instantly, then fill smoothly (linear, since it represents real elapsed time).
      fill.value = 0;
      fill.value = withTiming(1, { duration: AUTOPLAY_INTERVAL, easing: Easing.linear });
    } else {
      fill.value = withTiming(status === 'done' ? 1 : 0, { duration: 220, easing: Easing.out(Easing.quad) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const trackStyle = useAnimatedStyle(() => ({
    width: width.value,
    backgroundColor: isActive ? 'rgba(255,255,255,0.35)' : status === 'done' ? '#FFFFFF' : 'rgba(255,255,255,0.35)',
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%`,
  }));

  return (
    <Animated.View style={trackStyle} className="h-[6px] rounded-full overflow-hidden mr-1.5">
      {isActive && <Animated.View style={fillStyle} className="h-full bg-white rounded-full" />}
    </Animated.View>
  );
};

const Dots = React.memo(({ activeIndex }: { activeIndex: number }) => (
  <View className="absolute top-7 left-7 flex-row items-center z-10" pointerEvents="none">
    {SLIDES.map((s, i) => {
      const status: DotStatus = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'upcoming';
      return <ProgressDot key={s.id} status={status} />;
    })}
  </View>
));
Dots.displayName = 'Dots';

// ---------- Slide card ----------

const SlideCard = React.memo(({ item }: { item: Slide }) => {
  return (
    <View className="flex-1 items-center pt-4">
      <View
        className="rounded-2xl overflow-hidden bg-white justify-end items-center pb-4"
        style={{ width: SCREEN_WIDTH - 32, height: CARD_HEIGHT }}
      >
        <Image source={item.source} className="absolute inset-0 w-full h-full" resizeMode="cover" />

        <View className="absolute inset-0 bg-black/10" pointerEvents="none" />

        {item.buttons.length > 0 && (
          <View className="flex-row z-10 px-4">
            {item.buttons.map((btn, bIndex) => (
              <TouchableOpacity
                key={bIndex}
                activeOpacity={0.8}
                onPress={btn.action}
                accessibilityRole="button"
                accessibilityLabel={btn.text}
                className={`px-5 py-2.5 rounded-xl items-center justify-center ${
                  bIndex > 0 ? 'ml-3' : ''
                } ${btn.type === 'primary' ? 'bg-[#FFD600]' : 'bg-white/90'}`}
              >
                <Text className="text-black text-[13px]" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {btn.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
});
SlideCard.displayName = 'SlideCard';

// ---------- Main carousel ----------

const HeroCarousel = () => {
  const carouselRef = useRef<any>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isInteracting = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onSnapToItem = useCallback((index: number) => setActiveIndex(index), []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setInterval(() => {
      if (isInteracting.current) return;
      carouselRef.current?.next();
    }, AUTOPLAY_INTERVAL);
  }, [clearTimer]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  const onScrollStart = useCallback(() => {
    isInteracting.current = true;
    clearTimer();
  }, [clearTimer]);

  const onScrollEnd = useCallback(() => {
    isInteracting.current = false;
    startTimer();
  }, [startTimer]);

  return (
    <View className="bg-white relative" style={{ overflow: 'hidden' }}>
      <Carousel
        ref={carouselRef}
        // Sizing lives in `style` — this installed version's CarouselProps
        // type doesn't declare top-level width/height props.
        style={{
          width: SCREEN_WIDTH,
          height: CAROUSEL_HEIGHT,
          backgroundColor: '#FFFFFF',
          overflow: 'hidden',
          // Explicitly zero out shadow/elevation — some versions of this
          // library apply a default drop shadow to the item container,
          // which can show up as a thin gray line under the card.
          shadowColor: 'transparent',
          shadowOpacity: 0,
          shadowRadius: 0,
          shadowOffset: { width: 0, height: 0 },
          elevation: 0,
        }}
        data={SLIDES}
        loop
        onScrollStart={onScrollStart}
        onScrollEnd={onScrollEnd}
        onSnapToItem={onSnapToItem}
        renderItem={({ item }: { item: Slide }) => <SlideCard item={item} />}
      />
      <Dots activeIndex={activeIndex} />
    </View>
  );
};

export default HeroCarousel;