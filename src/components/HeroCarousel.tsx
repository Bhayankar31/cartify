import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Image, 
  FlatList, 
  Dimensions, 
  NativeSyntheticEvent, 
  NativeScrollEvent, 
  TouchableOpacity, 
  Text,
  Animated 
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

const { width } = Dimensions.get('window');
const SLIDE_DURATION = 4000; // 4 seconds per slide

// Sub-component for video slides
const VideoSlide = ({ uri }: { uri: string }) => {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <VideoView 
      player={player} 
      style={{ width: '100%', height: '100%' }} 
      nativeControls={false}
      allowsFullscreen={false}
      allowsPictureInPicture={false}
    />
  );
};

const BASE_SLIDES = [
  { 
    id: '1', 
    type: 'image',
    title: '25 Years of Magic', 
    source: { uri: 'https://images.unsplash.com/photo-1618944847023-38aa001235f0?q=80&w=1000&auto=format&fit=crop' },
    buttons: [
      { text: 'Shop Now', type: 'primary', action: () => console.log('Shop Now clicked') }
    ]
  },
  { 
    id: '2', 
    type: 'video', 
    title: 'Gaming Setup Showcase', 
    source: { uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
    buttons: []
  },
  { 
    id: '3', 
    type: 'image',
    title: 'Gaming Setup Specials', 
    source: { uri: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1000&auto=format&fit=crop' },
    buttons: [
      { text: 'Explore', type: 'primary', action: () => console.log('Explore clicked') },
      { text: 'Visit', type: 'secondary', action: () => console.log('Visit clicked') }
    ]
  },
  { 
    id: '4', 
    type: 'image',
    title: 'Latest Electronics', 
    source: { uri: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop' },
    buttons: [
      { text: 'Buy Now', type: 'primary', action: () => console.log('Buy Now clicked') },
      { text: 'Details', type: 'secondary', action: () => console.log('Details clicked') }
    ]
  },
];

// Virtualized array for smooth infinite looping
const SLIDES = Array(100).fill(BASE_SLIDES).flat().map((item, index) => ({
  ...item,
  uniqueKey: `${item.id}-${index}`
}));

const INITIAL_INDEX = BASE_SLIDES.length * 50;

const HeroCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(INITIAL_INDEX);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: INITIAL_INDEX, animated: false });
    }, 50);
  }, []);

  // Auto-slide timer
  useEffect(() => {
    const timer = setTimeout(() => {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, SLIDE_DURATION);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const renderItem = ({ item }: { item: typeof SLIDES[0] }) => {
    return (
      <View style={{ width, paddingHorizontal: 16, paddingTop: 16 }}>
        <View 
          style={{ 
            width: '100%', 
            height: 210, 
            borderRadius: 16, 
            overflow: 'hidden', 
            backgroundColor: '#FFFFFF',
            position: 'relative',
            justifyContent: 'flex-end',
            paddingBottom: 16,
            alignItems: 'center'
          }}
        >
          {item.type === 'image' ? (
            <Image 
              source={item.source} 
              style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}>
              <VideoSlide uri={item.source.uri} />
            </View>
          )}

          <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.1)' }} pointerEvents="none" />

          {/* Action Buttons (Only for image slides) */}
          {item.buttons.length > 0 && (
            <View style={{ flexDirection: 'row', zIndex: 10, paddingHorizontal: 16 }}>
              {item.buttons.map((btn, bIndex) => {
                const isPrimary = btn.type === 'primary';
                const hasGap = item.buttons.length > 1 && bIndex === 0;

                return (
                  <TouchableOpacity 
                    key={bIndex}
                    activeOpacity={0.8}
                    onPress={btn.action}
                    style={[
                      { 
                        paddingHorizontal: 20, 
                        paddingVertical: 10, 
                        borderRadius: 12, 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: isPrimary ? '#FFD600' : 'rgba(255,255,255,0.9)'
                      },
                      hasGap ? { marginRight: 12 } : {}
                    ]}
                  >
                    <Text 
                      style={{ fontFamily: 'Poppins_700Bold', fontSize: 13, color: '#000000' }}
                    >
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Clean Independent Dot Indicators (No background track line) */}
          <View style={{ position: 'absolute', top: 12, left: 12, flexDirection: 'row', zIndex: 10, alignItems: 'center' }}>
            {BASE_SLIDES.map((_, i) => {
              const activeBaseIndex = currentIndex % BASE_SLIDES.length;
              const isCurrent = i === activeBaseIndex;
              return (
                <View 
                  key={i} 
                  style={{ 
                    height: 5, 
                    borderRadius: 3,
                    backgroundColor: isCurrent ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                    width: isCurrent ? 20 : 5,
                    marginRight: 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.3,
                    shadowRadius: 1,
                  }}
                />
              );
            })}
          </View>

        </View>
      </View>
    );
  };

  return (
    <View style={{ backgroundColor: '#FFFFFF', paddingBottom: 16 }}>
      <FlatList 
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.uniqueKey}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToAlignment="center"
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />
    </View>
  );
};

export default HeroCarousel;