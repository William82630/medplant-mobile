import React, { useEffect, useState, createElement } from 'react';
import {
  Button,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Pressable,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';

import { identifyPlant } from './api';
import { BACKEND_URL } from './config';
import { useTheme } from './theme';
import { HistoryItem, loadHistory, saveToHistory } from './history';
import ResultScreen from './ResultScreen';
import HomeScreen from './HomeScreen';

export default function MainApp() {
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [webFile, setWebFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resultData, setResultData] = useState<any | null>(null);
  const [view, setView] = useState<'home' | 'identify' | 'history'>('home');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const isWeb = Platform.OS === 'web';
  const { colors, dark } = useTheme();

  useEffect(() => {
    (async () => setHistory(await loadHistory()))();
  }, []);

  // Ensure we can go back from results
  const backToHome = () => {
    setResultData(null);
    setView('home');
  };

  async function pickImageMobile() {
    console.log('[DEBUG] Gallery button pressed');
    try {
      setError(null);
      setResultData(null);
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('[DEBUG] Gallery permission status:', perm.status);

      if (perm.status !== 'granted') {
        console.log('[DEBUG] Gallery permission denied');
        setError('Media library permission is required');
        return;
      }

      console.log('[DEBUG] Launching image library...');
      // @ts-ignore: MediaTypeOptions is deprecated but MediaType causes type errors in current version
      const res = await ImagePicker.launchImageLibraryAsync({
        quality: 1,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      console.log('[DEBUG] Image library result:', res.canceled ? 'Canceled' : 'Asset picked');

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setImage(res.assets[0] || null);
        setWebFile(null);
      }
    } catch (e) {
      console.error('[DEBUG] pickImageMobile error:', e);
      setError('Error opening gallery');
    }
  }

  async function captureMobile() {
    console.log('[DEBUG] Camera button pressed');
    try {
      setError(null);
      setResultData(null);
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      console.log('[DEBUG] Camera permission status:', perm.status);

      if (perm.status !== 'granted') {
        console.log('[DEBUG] Camera permission denied');
        setError('Camera permission is required');
        return;
      }

      console.log('[DEBUG] Launching camera...');
      // @ts-ignore
      const res = await ImagePicker.launchCameraAsync({
        quality: 1,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      console.log('[DEBUG] Camera result:', res.canceled ? 'Canceled' : 'Asset captured');

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setImage(res.assets[0] || null);
        setWebFile(null);
      }
    } catch (e) {
      console.error('[DEBUG] captureMobile error:', e);
      setError('Error opening camera');
    }
  }

  async function upload() {
    if (!image) {
      setError('No image selected');
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const json = await identifyPlant(
        isWeb
          ? { file: webFile! }
          : {
            uri: image.uri,
            mimeType: image.mimeType || 'image/jpeg',
            name: image.fileName || 'photo.jpg',
          }
      );

      if (json?.success && json.data) {
        console.log('[DEBUG] Identification success');
        setResultData(json.data);

        const plantData = json.data.identified || {};
        const plant = plantData.plant || {};
        const uses = Array.isArray(plantData.medicinalUses)
          ? plantData.medicinalUses
          : (plantData.medicinalUses?.summary || []);
        const distribution = plantData.habitat?.distribution || '';

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
            regionFound: distribution,
            source: 'Gemini'
          },
        };

        try {
          await saveToHistory(item);
          setHistory(await loadHistory());
        } catch (historyErr) {
          console.error('[DEBUG] History save error:', historyErr);
        }
      } else {
        const msg = json?.error?.message || 'Invalid response from server';
        console.warn('[DEBUG] Server error:', msg);
        setError(msg);
      }
    } catch (e: any) {
      console.error('[DEBUG] Upload function error:', e);
      setError(e?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  if (resultData) {
    return (
      <ResultScreen
        data={resultData}
        imageUri={image?.uri}
        onBack={() => setResultData(null)}
        onRefresh={() => upload()}
      />
    );
  }


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={dark ? 'light' : 'dark'} />

      <View style={[styles.tabs, { backgroundColor: colors.muted }]}>
        <Pressable
          onPress={() => setView('home')}
          android_ripple={{ color: colors.primary + '20' }}
          style={[styles.tab, view === 'home' && styles.tabActive]}
        >
          <Text style={[styles.tabText, view === 'home' && styles.tabTextActive]}>
            Home
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setView('identify')}
          android_ripple={{ color: colors.primary + '20' }}
          style={[styles.tab, view === 'identify' && styles.tabActive]}
        >
          <Text style={[styles.tabText, view === 'identify' && styles.tabTextActive]}>
            Identify
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setView('history')}
          android_ripple={{ color: colors.primary + '20' }}
          style={[styles.tab, view === 'history' && styles.tabActive]}
        >
          <Text style={[styles.tabText, view === 'history' && styles.tabTextActive]}>
            History
          </Text>
        </Pressable>
      </View>

      {view === 'home' ? (
        <HomeScreen onScanPress={() => setView('identify')} />
      ) : view === 'identify' ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            MedPlant AI
          </Text>
          <Text style={{ color: colors.subtext, marginBottom: 16 }}>
            Identify medicinal plants instantly
          </Text>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Scan a Plant
            </Text>

            {!isWeb ? (
              <View style={styles.row}>
                <Button title="Camera" onPress={captureMobile} />
                <View style={{ width: 12 }} />
                <Button title="Gallery" onPress={pickImageMobile} />
              </View>
            ) : (
              <View style={styles.webButtonContainer}>
                {createElement('input', {
                  type: 'file',
                  accept: 'image/*',
                  onChange: (e: any) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setWebFile(file);
                    setImage({
                      uri: URL.createObjectURL(file),
                      fileName: file.name,
                      mimeType: file.type,
                      width: 0,
                      height: 0,
                    } as any);
                  },
                  style: styles.webInput,
                })}
                <View style={styles.webButton}>
                  <Text style={styles.webButtonText}>Pick Image</Text>
                </View>
              </View>
            )}

            {image && (
              <>
                <Image source={{ uri: image.uri }} style={styles.preview} />
                <Button title="Identify Plant" onPress={upload} disabled={loading} />
              </>
            )}

            {loading && <Text style={{ color: colors.subtext }}>Identifying…</Text>}
            {error && <Text style={styles.error}>{error}</Text>}
          </View>

          {history.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Recent Scans
              </Text>
              {history.slice(0, 3).map(item => (
                <View
                  key={item.id}
                  style={[styles.historyItem, { backgroundColor: colors.card }]}
                >
                  <Text style={{ color: colors.text }}>
                    {item.identified.commonNames?.[0] || item.identified.species}
                  </Text>
                  <Text style={{ color: colors.subtext, fontSize: 12 }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Plant Care Tips
            </Text>
            <View style={[styles.tipCard, { backgroundColor: colors.card }]}>
              <Text>🌱 Ensure proper sunlight and watering</Text>
            </View>
            <View style={[styles.tipCard, { backgroundColor: colors.card }]}>
              <Text>⚠️ Always verify toxicity before use</Text>
            </View>
          </View>

          <Text style={{ color: colors.subtext, marginTop: 20 }}>
            Backend: {BACKEND_URL}
          </Text>
        </ScrollView>
      ) : view === 'history' ? (
        <FlatList
          data={history}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                // Map history item back to ResultScreen expected shape
                setResultData({
                  identified: {
                    plant: {
                      scientificName: item.identified.species,
                      commonName: item.identified.commonNames?.[0],
                      family: '',
                      confidence: item.identified.confidence > 0.8 ? 'High' : 'Medium'
                    },
                    medicinalUses: item.identified.medicinalUses,
                    warnings: item.identified.cautions ? item.identified.cautions.split(', ') : [],
                    habitat: {
                      distribution: item.identified.regionFound || '',
                      environment: ''
                    },
                    activeCompounds: [],
                    references: []
                  }
                });
                setImage({ uri: item.imageUri } as any);
              }}
              android_ripple={{ color: colors.primary + '20' }}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: colors.card,
                  opacity: Platform.OS === 'ios' && pressed ? 0.7 : 1
                }
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {item.imageUri && (
                  <Image source={{ uri: item.imageUri }} style={{ width: 50, height: 50, borderRadius: 8, marginRight: 12 }} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '600' }}>
                    {item.identified.commonNames?.[0] || item.identified.species}
                  </Text>
                  <Text style={{ color: colors.subtext, fontSize: 12 }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </View>
                <Text style={{ color: colors.primary, fontSize: 18 }}>›</Text>
              </View>
            </Pressable>
          )}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  heroTitle: { fontSize: 26, fontWeight: '700' },
  row: { flexDirection: 'row', marginBottom: 12 },
  card: { padding: 16, borderRadius: 14, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginVertical: 12,
  },
  section: { marginTop: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  historyItem: { padding: 12, borderRadius: 10, marginBottom: 8 },
  tipCard: { padding: 12, borderRadius: 10, marginBottom: 8 },
  error: { color: 'red', marginTop: 8 },
  tabs: { flexDirection: 'row' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#007aff' },
  tabText: { color: '#333' },
  tabTextActive: { color: '#007aff', fontWeight: '600' },
  webButtonContainer: { position: 'relative', height: 44, marginBottom: 12 },
  webInput: { position: 'absolute', width: '100%', height: '100%', opacity: 0 },
  webButton: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#007aff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webButtonText: { color: '#fff', fontWeight: '600' },
});
