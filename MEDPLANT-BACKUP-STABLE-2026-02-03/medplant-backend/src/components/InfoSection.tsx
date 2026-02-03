import { View, Text, StyleSheet } from "react-native"
import { colors } from "../theme/colors"

type Props = {
  title: string
  items: string[]
}

export function InfoSection({ title, items }: Props) {
  if (!items.length) return null

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {items.map((item, index) => (
        <Text key={index} style={styles.item}>
          • {item}
        </Text>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  item: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
  },
})
