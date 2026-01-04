export async function identifyPlant(imageUri: string) {
  const formData = new FormData()

  formData.append("image", {
    uri: imageUri,
    name: "plant.jpg",
    type: "image/jpeg",
  } as any)

  const response = await fetch("http://192.168.137.1:3000/identify", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error("Plant identification failed")
  }

  return response.json()
}
