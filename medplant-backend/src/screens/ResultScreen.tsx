import { useEffect, useState } from "react"
import { ScrollView, StyleSheet, ActivityIndicator, View } from "react-native"
import { PlantHeader } from "../components/PlantHeader"
import { SafetyAlert } from "../components/SafetyAlert"
import { InfoSection } from "../components/InfoSection"
import { HabitatCard } from "../components/HabitatCard"
import { identifyPlant } from "../api/identify"
import { colors } from "../theme/colors"

export function ResultScreen({ route }: any) {
  const { imageUri } = route.params

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    identifyPlant(imageUri)
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (!data) return null

  const { plant, warnings, medicinalUses, toxicity, habitat } = data

  return (
    <ScrollView style={styles.container}>
      <PlantHeader {...plant} />

      {toxicity.level !== "none" && (
        <SafetyAlert
          level={toxicity.level}
          description={toxicity.description}
        />
      )}

      <InfoSection title="Warnings & Precautions" items={warnings} />
      <InfoSection title="Medicinal Uses" items={medicinalUses} />
      <HabitatCard habitat={habitat} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: 14,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
})
