import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';

// Default Dark Store / Warehouse coordinates
const STORE_LOCATION = {
  latitude: 25.220856011717323,
  longitude: 80.92008630949341,
};

// Haversine distance formula (in km)
const calculateDistanceInKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Format delivery time into mins or hours + mins
const calculateScootyDeliveryTime = (distanceInKm: number): string => {
  if (distanceInKm > 30) {
    return 'Not deliverable'; // Fallback if too far
  }
  const averageScootySpeedKmH = 25;
  const packingTimeMins = 5;
  const travelTimeMins = Math.ceil((distanceInKm / averageScootySpeedKmH) * 60);
  const totalMins = Math.max(8, travelTimeMins + packingTimeMins);

  if (totalMins >= 60) {
    const hours = Math.floor(totalMins / 60);
    const remainingMins = totalMins % 60;
    if (remainingMins === 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${remainingMins} mins`;
  }
  return `${totalMins} minutes`;
};

interface HeaderProps {
  onNotificationPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onNotificationPress = () => {},
}) => {
  // Started with empty strings so it doesn't flash fake data
  const [deliveryTime, setDeliveryTime] = useState<string>('');
  const [locationName, setLocationName] = useState<string>('YOUR LOCATION');
  const [address, setAddress] = useState<string>('Fetching live location...');
  const [loading, setLoading] = useState<boolean>(true);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startLiveTracking = async () => {
      try {
        setLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          setPermissionDenied(true);
          setAddress('Tap to enable location access');
          setDeliveryTime('-- mins');
          setLoading(false);
          return;
        }

        setPermissionDenied(false);

        // Actively watches the user's location live
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000, 
            distanceInterval: 50, 
          },
          async (location) => {
            const userLat = location.coords.latitude;
            const userLng = location.coords.longitude;

            // Calculate distance & time dynamically
            const distKm = calculateDistanceInKm(
              STORE_LOCATION.latitude,
              STORE_LOCATION.longitude,
              userLat,
              userLng
            );
            setDeliveryTime(calculateScootyDeliveryTime(distKm));

            // Convert coordinates to readable street address
            const reverseGeocode = await Location.reverseGeocodeAsync({
              latitude: userLat,
              longitude: userLng,
            });

            if (reverseGeocode && reverseGeocode.length > 0) {
              const item = reverseGeocode[0];
              const area = item.name || item.street || item.subregion || '';
              const city = item.city || item.district || '';
              const formatted = `${area}${area && city ? ', ' : ''}${city}`.trim();

              setLocationName('LIVE LOCATION');
              setAddress(formatted || 'Current Location');
            }
            setLoading(false);
          }
        );
      } catch (error) {
        console.log('Location fetch error:', error);
        setPermissionDenied(true);
        setAddress('Tap to enable location access');
        setDeliveryTime('-- mins');
        setLoading(false);
      }
    };

    startLiveTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const handleLocationPress = () => {
    if (permissionDenied) {
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      } else {
        Linking.openSettings();
      }
    }
  };

  return (
    <SafeAreaView className="bg-[#FFD600]">
      <View className="bg-[#FFD600] flex-row items-start justify-between px-4 pt-3 pb-3">
        {/* Left Section */}
        <View className="flex-1 flex-col">
          <Text 
            style={{ fontFamily: 'Poppins_600SemiBold' }} 
            className="text-xs text-black mb-[-4px]"
          >
            Cartify in
          </Text>
          
          {/* Dynamic Delivery Time / Loading State */}
          <View className="h-[35px] justify-center">
            {loading ? (
              <View className="flex-row items-center mt-1">
                <ActivityIndicator size="small" color="#000000" className="mr-2" />
                <Text 
                  style={{ fontFamily: 'Poppins_800ExtraBold' }} 
                  className="text-xl text-black"
                >
                  Calculating...
                </Text>
              </View>
            ) : (
              <Text 
                style={{ fontFamily: 'Poppins_800ExtraBold' }} 
                className="text-[26px] text-black mb-[-2px]"
              >
                {deliveryTime}
              </Text>
            )}
          </View>

          {/* Location Line */}
          <TouchableOpacity
            className="flex-row items-center py-0.5 mt-0.5"
            onPress={handleLocationPress}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000000" className="mr-1.5" />
            ) : permissionDenied ? (
              <View className="flex-row items-center">
                <Ionicons name="location-outline" size={14} color="#333333" />
                <Text 
                  style={{ fontFamily: 'Poppins_600SemiBold' }} 
                  className="text-[13px] text-[#333333] mx-1" 
                  numberOfLines={1}
                >
                  {address}
                </Text>
                <Ionicons name="chevron-forward" size={12} color="#333333" />
              </View>
            ) : (
              <>
                <Text 
                  style={{ fontFamily: 'Poppins_400Regular' }} 
                  className="text-[13px] text-[#222222] leading-[18px] max-w-[85%]" 
                  numberOfLines={1}
                >
                  <Text style={{ fontFamily: 'Poppins_700Bold' }}>{locationName} - </Text>
                  {address}
                </Text>
                <Ionicons name="caret-down" size={13} color="#111111" className="ml-1" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Right Section: Notification Button */}
        <TouchableOpacity
          className="w-[42px] h-[42px] rounded-full bg-[#1C1C1E] items-center justify-center shadow-sm ml-2.5"
          onPress={onNotificationPress}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
          <View className="absolute top-2.5 right-2.5 w-[7px] h-[7px] rounded-full bg-[#E53935]" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Header;