import React, { useEffect, useMemo, useState } from 'react';
import { Button, Image, Platform, SafeAreaView, ScrollView, StyleSheet, Text, View, TouchableOpacity, FlatList, Share } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { identifyPlant } from './src/api';
import { BACKEND_URL } from './src/config';
import { useTheme } from './src/theme';
import Markdown from './src/Markdown';
import { clearHistory, HistoryItem, loadHistory, saveToHistory } from './src/history';

export default function App() {
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [tab, setTab] = useState<'identify' | 'history'>('identify');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  function buildMarkdown(id: any): string {
    const usesList = Array.isArray(id.medicinalUses) ? id.medicinalUses.map((u: string) => `- ${u}`).join('\n') : '-';
    const commonNames = Array.isArray(id.commonNames) ? id.commonNames.join(', ') : '';
    return [
      `# Medicinal Report`,
      ``,
      `- Common Names: ${commonNames}`,
      `- Scientific Name: ${id.species}`,
      `- Confidence: ${typeof id.confidence === 'number' ? id.confidence.toFixed(2) : id.confidence}`,
      id.regionFound ? `- Region Found: ${id.regionFound}` : '',
      ``,
      `## Medicinal Uses`,
      usesList,
      ``,
      `## Preparation`,
      id.preparation || 'N/A',
      ``,
      `## Cautions`,
      id.cautions || 'N/A',
      ``,
      `---`,
      id.disclaimer || ''
    ].filter(Boolean).join('\n');
  }

  const markdown = useMemo(() => {
    if (!result?.data?.identified) return '';
    return buildMarkdown(result.data.identified);
  }, [result]);

  useEffect(() => { (async () => setHistory(await loadHistory()))(); }, []);

  async function pickImage() {
    setError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      setError('Media library permission is required');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 1,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!res.canceled) {
      setImage(res.assets[0]);
    }
  }

  async function capture() {
    setError(null);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') {
      setError('Camera permission is required');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!res.canceled) {
      setImage(res.assets[0]);
    }
  }

  async function upload() {
    if (!image) return;
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const json = await identifyPlant({ uri: image.uri, mimeType: image.mimeType || 'image/jpeg', name: image.fileName || 'photo.jpg' });
      setResult(json);
      // Persist to history if success
      if (json?.success && json?.data?.identified) {
        const idItem: HistoryItem = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: Date.now(),
          imageUri: image.uri,
          identified: json.data.identified,
        };
        await saveToHistory(idItem);
        const list = await loadHistory();
        setHistory(list);
      }
    } catch (e: any) {
      setError(e?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  const { colors, dark } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }] }>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <View style={[styles.tabs, { backgroundColor: colors.muted }]}>
        <TouchableOpacity onPress={() => setTab('identify')} style={[styles.tab, tab === 'identify' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'identify' && styles.tabTextActive]}>Identify</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('history')} style={[styles.tab, tab === 'history' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>History</Text>
        </TouchableOpacity>
      </View>

      {tab === 'identify' ? (
        <ScrollView contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>
          <Text style={[styles.title, { color: colors.text }]}>Medicinal Plant Identification</Text>
          <Text style={[styles.url, { color: colors.subtext }]}>Backend: {BACKEND_URL}</Text>

          <View style={styles.row}>
            <Button title="Pick Image" onPress={pickImage} />
            <View style={{ width: 12 }} />
            <Button title="Capture" onPress={capture} />
            <View style={{ width: 12 }} />
            <Button title="Identify" onPress={upload} disabled={!image || loading} />
          </View>

          {image && (
            <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="cover" />
          )}

          {loading && <Text style={{ color: colors.subtext }}>Identifying...</Text>}
          {error && <Text style={[styles.error]}>{error}</Text>}

          {result && (
            <View style={styles.result}>
              <Text style={[styles.subtitle, { color: colors.text }]}>Raw JSON</Text>
              <ScrollView horizontal>
                <Text style={[styles.code, { color: colors.subtext }]}>{JSON.stringify(result, null, 2)}</Text>
              </ScrollView>

              <Text style={[styles.subtitle, { color: colors.text }]}>Markdown Report</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Button title="Share Report" onPress={async () => {
                  try { await Share.share({ message: markdown }); } catch {}
                }} />
              </View>
              <View style={{ backgroundColor: colors.card, padding: 12, borderRadius: 8 }}>
                <Markdown>{markdown}</Markdown>
              </View>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.title, { color: colors.text }]}>History</Text>
            <Button title="Clear" onPress={async () => { await clearHistory(); setHistory([]); }} />
          </View>

          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 12 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}>
                <Text style={{ fontWeight: '600', color: colors.text }}>{item.identified.species} ({(item.identified.confidence ?? 0).toFixed(2)})</Text>
                <Text style={{ color: colors.subtext }}>{new Date(item.createdAt).toLocaleString()}</Text>
                {item.imageUri ? (
                  <Image source={{ uri: item.imageUri }} style={{ height: 120, marginTop: 8, borderRadius: 6 }} />
                ) : null}
                <Text numberOfLines={3} style={{ marginTop: 8, color: colors.subtext }}>
                  Uses: {Array.isArray(item.identified.medicinalUses) ? item.identified.medicinalUses.join(', ') : ''}
                </Text>
                <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                  <Button title="Share" onPress={async () => {
                    try { await Share.share({ message: buildMarkdown(item.identified) }); } catch {}
                  }} />
                </View>
              </View>
            )}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
  subtitle: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  url: { marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  preview: { width: '100%', height: 240, borderRadius: 12, backgroundColor: '#eee' },
  result: { marginTop: 12 },
  code: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontSize: 12 },
  error: { color: 'red', marginTop: 8 },
  tabs: { flexDirection: 'row', backgroundColor: '#f0f0f0' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#007aff', backgroundColor: '#fff' },
  tabText: { color: '#333' },
  tabTextActive: { color: '#007aff', fontWeight: '600' },
});
