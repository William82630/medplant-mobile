import { View, Text, StyleSheet } from "react-native"
import { colors } from "../theme/colors"

type Props = {
  level: "low" | "moderate" | "high"
  description: string
}

export function SafetyAlert({ level, description }: Props) {
  const color =
    level === "high"
      ? colors.danger
      : level === "moderate"
      ? colors.warning
      : colors.secondary

  return (
    <View style={[styles.container, { borderLeftColor: color }]}>
      <Text style={[styles.title, { color }]}>
        ⚠ Safety Warning ({level.toUpperCase()})
      </Text>
      <Text style={styles.text}>{description}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF8F6",
    padding: 14,
    borderLeftWidth: 5,
    borderRadius: 8,
    marginBottom: 14,
  },
  title: {
    fontWeight: "700",
    marginBottom: 6,
  },
  text: {
    color: colors.textPrimary,
    lineHeight: 20,
  },
})
