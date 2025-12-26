import React, { useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  Button,
  Image,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { AppStateContext } from '../MainApp';
import { BACKEND_URL } from '../config';

export default function IdentifyScreen({ navigation }: any) {
  const { colors, dark } = useTheme();
  const context = useContext(AppStateContext);

  if (!context) return null;

  const { image, loading, error, pickImage, handleUpload } = context;

  const onIdentifyPress = async () => {
    const data = await handleUpload();
    if (data) {
      navigation.navigate('Results', { resultData: data, imageUri: image?.uri });
    }
  };

  // Theme-aware gradient colors
  const gradientColors: readonly [string, string] = dark
    ? ['#1a3a2a', '#0a0a0b'] // Deep green → near-black
    : ['#f0f9f4', '#fafafa']; // Pale green → off-white

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.heroTitle, { color: colors.text }]}>MedPlant AI</Text>
        <Text style={{ color: colors.subtext, marginBottom: 16 }}>
          Identify medicinal plants instantly
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Scan a Plant</Text>

          <View style={styles.row}>
            <Button title="Camera" onPress={() => pickImage('camera')} />
            <View style={{ width: 12 }} />
            <Button title="Gallery" onPress={() => pickImage('gallery')} />
          </View>

          {image && (
            <>
              <Image source={{ uri: image.uri }} style={styles.preview} />
              <Button title="Identify Plant" onPress={onIdentifyPress} disabled={loading} />
            </>
          )}

          {loading && <Text style={{ color: colors.subtext }}>Identifying…</Text>}
          {error && <Text style={styles.error}>{error}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Plant Care Tips</Text>
          <View style={[styles.tipCard, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.text }}>🌱 Ensure proper sunlight and watering</Text>
          </View>
          <View style={[styles.tipCard, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.text }}>⚠️ Always verify toxicity before use</Text>
          </View>
        </View>

        <Text style={{ color: colors.subtext, marginTop: 20 }}>
          Backend: {BACKEND_URL}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, flexGrow: 1 },
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
  tipCard: { padding: 12, borderRadius: 10, marginBottom: 8 },
  error: { color: 'red', marginTop: 8 },
});
