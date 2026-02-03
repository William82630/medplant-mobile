import { View, Text, StyleSheet } from "react-native"
import { colors } from "../theme/colors"

export function HabitatCard({ habitat }: { habitat: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Natural Habitat</Text>
      <Text style={styles.text}>{habitat}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
  },
})
