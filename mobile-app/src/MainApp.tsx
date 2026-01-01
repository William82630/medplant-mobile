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
import { HistoryItem, loadHistory, saveToHistory } from './history';
import HomeScreen from './HomeScreen';
import ResultScreen from './ResultScreen';
import IdentifyScreen from './screens/IdentifyScreen';
import HistoryScreen from './screens/HistoryScreen';

// Navigation Types
export type RootStackParamList = {
  IdentifyMain: undefined;
  Results: { resultData: any; imageUri: string };
};

export type BottomTabParamList = {
  HomeTab: undefined;
  IdentifyTab: undefined;
  HistoryTab: undefined;
};

// Shared State Context for identification logic
interface AppStateContextType {
  image: ImagePicker.ImagePickerAsset | null;
  setImage: (img: ImagePicker.ImagePickerAsset | null) => void;
  loading: boolean;
  error: string | null;
  setError: (err: string | null) => void;
  history: HistoryItem[];
  refreshHistory: () => Promise<void>;
  handleUpload: () => Promise<any>;
  pickImage: (source: 'camera' | 'gallery') => Promise<void>;
}

export const AppStateContext = createContext<AppStateContextType | null>(null);

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

function IdentifyStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="IdentifyMain" component={IdentifyScreen} />
      <Stack.Screen name="Results" component={ResultScreenWrapper} />
    </Stack.Navigator>
  );
}

function ResultScreenWrapper({ route, navigation }: any) {
  const { resultData, imageUri } = route.params;
  const context = useContext(AppStateContext);

  return (
    <ResultScreen
      data={resultData}
      imageUri={imageUri}
      onBack={() => navigation.goBack()}
      onRefresh={() => context?.handleUpload()}
    />
  );
}

export default function MainApp() {
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [webFile, setWebFile] = useState<File | null>(null); // Keep for web support consistency
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const { colors, dark } = useTheme();
  const isWeb = Platform.OS === 'web';

  const refreshHistory = async () => {
    setHistory(await loadHistory());
  };

  useEffect(() => {
    refreshHistory();
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
        const plantData = json.data.identified || {};
        const plant = plantData.plant || {};
        const uses = Array.isArray(plantData.medicinalUses) ? plantData.medicinalUses : (plantData.medicinalUses?.summary || []);

        const item: HistoryItem = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          createdAt: Date.now(),
          imageUri: image.uri,
          identified: {
            species: plant.scientificName || 'Unknown Species',
            confidence: plant.confidence === 'High' ? 0.9 : plant.confidence === 'Medium' ? 0.6 : 0.3,
            commonNames: plant.commonName ? [plant.commonName] : [],
            medicinalUses: uses,
            cautions: (plantData.warnings || []).join(', '),
            regionFound: plantData.habitat?.distribution || '',
            source: 'Gemini'
          },
        };
        await saveToHistory(item);
        await refreshHistory();
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

  return (
    <NavigationContainer>
      <AppStateContext.Provider value={{
        image, setImage, loading, error, setError, history, refreshHistory, handleUpload, pickImage
      }}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            unmountOnBlur: false, // Preserve state when switching tabs
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
          backBehavior="history" // Prevent accidental app exit
        >
          <Tab.Screen
            name="HomeTab"
            component={HomeScreenWrapper}
            options={{
              title: 'Home',
              tabBarIcon: ({ focused }) => (
                <Text style={{ fontSize: 22 }}>🏠</Text>
              ),
            }}
          />
          <Tab.Screen
            name="IdentifyTab"
            component={IdentifyStack}
            options={{
              title: 'Identify',
              tabBarIcon: ({ focused }) => (
                <Text style={{ fontSize: 22 }}>📷</Text>
              ),
            }}
          />
          <Tab.Screen
            name="HistoryTab"
            component={HistoryScreen}
            options={{
              title: 'History',
              tabBarIcon: ({ focused }) => (
                <Text style={{ fontSize: 22 }}>📜</Text>
              ),
            }}
          />
        </Tab.Navigator>
      </AppStateContext.Provider>
    </NavigationContainer>
  );
}

function HomeScreenWrapper({ navigation }: any) {
  return <HomeScreen onScanPress={() => navigation.navigate('IdentifyTab')} />;
}
