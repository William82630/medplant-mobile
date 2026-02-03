import { View, Text, StyleSheet, Image } from "react-native"
import { colors } from "../theme/colors"

type Props = {
  commonName: string
  scientificName: string
  confidence: number
  imageUrl?: string
}

export function PlantHeader({
  commonName,
  scientificName,
  confidence,
  imageUrl,
}: Props) {
  return (
    <View style={styles.container}>
      {imageUrl && (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      )}

      <Text style={styles.common}>{commonName}</Text>
      <Text style={styles.scientific}>{scientificName}</Text>
      <Text style={styles.confidence}>
        Identification Confidence: {Math.round(confidence * 100)}%
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
  },
  image: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginBottom: 12,
  },
  common: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  scientific: {
    fontSize: 16,
    fontStyle: "italic",
    color: colors.textSecondary,
    marginVertical: 4,
  },
  confidence: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 6,
  },
})
