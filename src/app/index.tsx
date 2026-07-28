import React, { useState } from 'react';
import { View, ScrollView, StatusBar } from 'react-native';
import Header from '@/components/Header';
import SearchCategoryBar from '@/components/SearchCategoryBar';
import HeroCarousel from '@/components/HeroCarousel';

export default function Home() {
  // 1. Lifted state: This controls which "page" is currently active
  const [activeCategory, setActiveCategory] = useState('1');

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFD600" />
      
      {/* THE YELLOW ZONE */}
      <View className="bg-[#FFD600]">
        <Header />
        <SearchCategoryBar 
          activeCategory={activeCategory} 
          onSelectCategory={setActiveCategory} 
        />
      </View>

      {/* THE WHITE ZONE (Dynamic Pages) */}
      <ScrollView className="flex-1 bg-[#F5F6F8]">
        
        {/* Render "All" Category Page */}
        {activeCategory === '1' && (
          <>
            <HeroCarousel />
            {/* Add more sections for the 'All' page here later (e.g., Grid items, deals) */}
          </>
        )}

        {/* Render "Gaming" Category Page */}
        {activeCategory === '2' && (
          <View className="p-4">
            {/* You can create a GamingPage component later */}
          </View>
        )}

      </ScrollView>
    </View>
  );
}