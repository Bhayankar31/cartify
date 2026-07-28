import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Animated,
  Platform,
  PermissionsAndroid
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';

// The categories array
const categories = [
  { id: '1', name: 'All', icon: 'basket-outline', provider: 'MaterialCommunityIcons' },
  { id: '2', name: 'Gaming', icon: 'game-controller-outline', provider: 'Ionicons', badge: 'New' },
  { id: '3', name: 'Electronics', icon: 'headset-outline', provider: 'Ionicons' },
  { id: '4', name: 'Decor', icon: 'bed-outline', provider: 'Ionicons' },
  { id: '5', name: 'Beauty', icon: 'color-palette-outline', provider: 'Ionicons' },
  { id: '6', name: 'Snacks', icon: 'fast-food-outline', provider: 'Ionicons' },
  { id: '7', name: 'Drinks', icon: 'water-outline', provider: 'Ionicons' },
];

// Define Props since state is now controlled by the parent screen
interface SearchCategoryBarProps {
  activeCategory: string;
  onSelectCategory: (id: string) => void;
}

const SearchCategoryBar: React.FC<SearchCategoryBarProps> = ({ 
  activeCategory, 
  onSelectCategory 
}) => {
  const [searchText, setSearchText] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const placeholders = [
    '"milk"', 
    '"neon strips"', 
    '"wall decor"', 
    '"chocolates"', 
    '"gaming accessories"'
  ];

  // Animation Loop for Search Placeholders
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
  }, []);

  // Voice Recognition Setup
  useEffect(() => {
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value.length > 0) {
        setSearchText(e.value[0]); 
      }
    };

    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      console.log('Voice Error:', e.error);
      setIsListening(false);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  // Handle Microphone Press
  const handleMicPress = async () => {
    try {
      if (isListening) {
        await Voice.stop();
        setIsListening(false);
        return;
      }

      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Cartify needs access to your microphone so you can search for items by voice.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Microphone permission denied');
          return; 
        }
      }

      setSearchText(''); 
      await Voice.start('en-US'); 
      
    } catch (e) {
      console.error('Failed to start voice recognition:', e);
    }
  };

  return (
    <View className="bg-[#FFD600] pb-2">
      
      {/* Search Bar Section */}
      <View className="px-4 py-2">
        <View 
          className={`flex-row items-center bg-white rounded-xl px-3 h-[48px] shadow-sm ${
            isListening ? 'border border-[#E53935]' : ''
          }`}
        >
          <Ionicons name="search" size={20} color="#444444" />
          
          <View className="flex-1 mx-2 relative justify-center h-full">
            {searchText.length === 0 && !isListening && (
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

            {isListening && searchText.length === 0 && (
              <View className="absolute inset-0 flex-row items-center" pointerEvents="none">
                <Text style={{ fontFamily: 'Poppins_400Regular', marginTop: 2, color: '#E53935' }} className="text-[15px]">
                  Listening...
                </Text>
              </View>
            )}

            <TextInput 
              value={searchText}
              onChangeText={setSearchText}
              className="flex-1 text-[15px] text-black h-full"
              style={{ fontFamily: 'Poppins_400Regular', marginTop: 2, paddingVertical: 0 }}
            />
          </View>
          
          <View className="w-[1px] h-6 bg-gray-300 mx-1" />
          
          <TouchableOpacity className="px-2" activeOpacity={0.7} onPress={handleMicPress}>
            {isListening ? (
              <MaterialCommunityIcons name="waveform" size={22} color="#E53935" />
            ) : (
              <Ionicons name="mic-outline" size={22} color="#444444" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories Horizontal Scroll */}
      <View className="mt-2">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ 
            flexGrow: 1, 
            justifyContent: categories.length <= 5 ? 'center' : 'flex-start',
            alignItems: 'center', 
            paddingHorizontal: 16, 
            paddingBottom: 4 
          }}
        >
          {categories.map((category) => {
            const isActive = activeCategory === category.id;
            return (
              <TouchableOpacity 
                key={category.id} 
                onPress={() => onSelectCategory(category.id)} // Uses the prop function
                activeOpacity={0.7}
                className="items-center mr-7"
              >
                <View className="relative">
                  {category.badge && (
                    <View 
                      className="absolute z-10 bg-[#E53935] rounded-[4px] items-center justify-center"
                      style={{ 
                        top: -6, 
                        right: -12, 
                        paddingHorizontal: 4, 
                        paddingVertical: 1.5 
                      }}
                    >
                      <Text 
                        style={{ 
                          fontFamily: 'Poppins_600SemiBold', 
                          color: '#FFFFFF',
                          fontSize: 8,
                          includeFontPadding: false 
                        }}
                      >
                        {category.badge}
                      </Text>
                    </View>
                  )}

                  {category.provider === 'Ionicons' ? (
                    <Ionicons name={category.icon as any} size={28} color="#111111" />
                  ) : (
                    <MaterialCommunityIcons name={category.icon as any} size={28} color="#111111" />
                  )}
                </View>

                <Text 
                  style={{ fontFamily: isActive ? 'Poppins_700Bold' : 'Poppins_500Medium' }}
                  className={`text-[12px] mt-1 ${isActive ? 'text-black' : 'text-gray-800'}`}
                >
                  {category.name}
                </Text>

                {isActive ? (
                  <View className="w-6 h-[3px] bg-black rounded-full mt-1" />
                ) : (
                  <View className="w-6 h-[3px] mt-1 bg-transparent" /> 
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

export default SearchCategoryBar;