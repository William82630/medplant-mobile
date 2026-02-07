import React, { useEffect, useState, createContext, useContext } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { identifyPlant } from './api';
import { useTheme } from './theme';
import { HistoryItem, loadHistory } from './history';
import HomeScreen from './HomeScreen';
import ResultScreen from './ResultScreen';
import IdentifyScreen from './screens/IdentifyScreen';
import HistoryScreen from './screens/HistoryScreen';
import AilmentDetailScreen from './screens/AilmentDetailScreen';

// Navigation Types
export type RootStackParamList = {
  IdentifyMain: undefined;
  Results: { resultData: any; imageUri: string };
  AilmentDetail: { plantData: any };
};

export type BottomTabParamList = {
  HomeTab: undefined;
  IdentifyTab: undefined;
  HistoryTab: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function MainApp({
  session,
  subscription,
  signOut,
  refreshSubscription,
  useCredit,
  hasCredits,
  isAdmin,
  remainingCredits,
}: any) {
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const { colors } = useTheme();

  const handleRefreshHistory = async () => {
    setHistory(await loadHistory());
  };

  useEffect(() => {
    handleRefreshHistory();
  }, []);

  const pickImage = async (source: 'camera' | 'gallery') => {
    try {
      setError(null);
      let res;
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== 'granted') throw new Error('Camera permission denied');
        res = await ImagePicker.launchCameraAsync({ quality: 1, mediaTypes: ImagePicker.MediaTypeOptions.Images });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== 'granted') throw new Error('Gallery permission denied');
        res = await ImagePicker.launchImageLibraryAsync({ quality: 1, mediaTypes: ImagePicker.MediaTypeOptions.Images });
      }

      if (!res.canceled && res.assets?.[0]) {
        setImage(res.assets[0]);
      }
    } catch (e: any) {
      setError(e.message || `Error opening ${source}`);
    }
  };

  const handleUpload = async () => {
    if (!image) return;
    try {
      setLoading(true);
      setError(null);
      const json = await identifyPlant({
        uri: image.uri,
        mimeType: image.mimeType || 'image/jpeg',
        name: image.fileName || 'photo.jpg',
      });

      if (json?.success && json.data) {
        return json.data;
      } else {
        setError(json?.error?.message || 'Identification failed');
      }
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const commonProps = {
    user: session?.user,
    session,
    subscription,
    signOut,
    refreshSubscription,
    useCredit,
    hasCredits,
    isAdmin,
    remainingCredits,
    image,
    setImage,
    loading,
    error,
    setError,
    history,
    refreshHistory: handleRefreshHistory,
    handleUpload,
    pickImage,
  };

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          unmountOnBlur: false,
          tabBarStyle: {
            backgroundColor: colors.muted,
            borderTopColor: colors.border,
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.subtext,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          }
        })}
        backBehavior="history"
      >
        <Tab.Screen
          name="HomeTab"
          options={{
            title: 'Home',
            tabBarIcon: () => <Text style={{ fontSize: 22 }}>🏠</Text>,
          }}
        >
          {(props) => (
            <HomeScreen
              {...props}
              {...commonProps}
              onScanPress={() => props.navigation.navigate('IdentifyTab')}
            />
          )}
        </Tab.Screen>
        <Tab.Screen
          name="IdentifyTab"
          options={{
            title: 'Identify',
            tabBarIcon: () => <Text style={{ fontSize: 22 }}>📷</Text>,
          }}
        >
          {(props) => <IdentifyStack {...props} commonProps={commonProps} />}
        </Tab.Screen>
        <Tab.Screen
          name="HistoryTab"
          options={{
            title: 'History',
            tabBarIcon: () => <Text style={{ fontSize: 22 }}>📜</Text>,
          }}
        >
          {(props) => <HistoryScreen {...props} {...commonProps} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function IdentifyStack({ commonProps }: any) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="IdentifyMain">
        {(props) => <IdentifyScreen {...props} {...commonProps} />}
      </Stack.Screen>
      <Stack.Screen name="Results">
        {(props) => {
          const { resultData, imageUri, fromHistory, cachedResult } = (props.route.params as any) || {};
          return (
            <ResultScreen
              {...props}
              data={fromHistory ? cachedResult?.resultData : resultData}
              imageUri={fromHistory ? cachedResult?.imageUri : imageUri}
              onBack={() => props.navigation.goBack()}
              onRefresh={() => commonProps.handleUpload()}
              {...commonProps}
            />
          );
        }}
      </Stack.Screen>
      <Stack.Screen name="AilmentDetail">
        {(props) => <AilmentDetailScreen {...props} {...commonProps} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
