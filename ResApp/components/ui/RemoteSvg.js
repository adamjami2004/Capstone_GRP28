"use client"

// components/ui/RemoteSvg.js
import { useEffect, useState } from "react"
import { View, ActivityIndicator, Text } from "react-native"
import { SvgXml } from "react-native-svg"

const RemoteSvg = ({ uri, width, height, style }) => {
  const [svgXmlData, setSvgXmlData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchSvg() {
      if (!uri) {
        setError("No URI provided")
        setLoading(false)
        return
      }

      try {
        console.log("Fetching SVG from:", uri)
        const response = await fetch(uri)

        if (!response.ok) {
          throw new Error(`Failed to fetch SVG: ${response.status} ${response.statusText}`)
        }

        const xml = await response.text()

        if (!xml || !xml.includes("<svg")) {
          throw new Error("Invalid SVG data received")
        }

        setSvgXmlData(xml)
        setError(null)
      } catch (error) {
        console.error("Error fetching SVG: ", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    setLoading(true)
    fetchSvg()
  }, [uri])

  if (loading) {
    return (
      <View style={[{ width, height, justifyContent: "center", alignItems: "center" }, style]}>
        <ActivityIndicator size="small" color="#019757" />
      </View>
    )
  }

  if (error || !svgXmlData) {
    return (
      <View
        style={[{ width, height, justifyContent: "center", alignItems: "center", backgroundColor: "#f0f0f0" }, style]}
      >
        <Text style={{ fontSize: 10, color: "#666", textAlign: "center" }}>
          {error ? "Error loading image" : "No image"}
        </Text>
      </View>
    )
  }

  // Process the SVG to ensure it fits properly in the container
  let processedSvg = svgXmlData

  // If the SVG doesn't have a viewBox, try to add one
  if (!svgXmlData.includes("viewBox") && svgXmlData.includes("width=") && svgXmlData.includes("height=")) {
    try {
      // Extract width and height from the SVG
      const widthMatch = svgXmlData.match(/width="([^"]+)"/)
      const heightMatch = svgXmlData.match(/height="([^"]+)"/)

      if (widthMatch && heightMatch) {
        const svgWidth = Number.parseFloat(widthMatch[1])
        const svgHeight = Number.parseFloat(heightMatch[1])

        if (!isNaN(svgWidth) && !isNaN(svgHeight)) {
          // Add viewBox attribute
          processedSvg = svgXmlData.replace("<svg", `<svg viewBox="0 0 ${svgWidth} ${svgHeight}"`)
        }
      }
    } catch (e) {
      console.error("Error processing SVG:", e)
    }
  }

  return (
    <View style={[{ width, height, justifyContent: "center", alignItems: "center", overflow: "hidden" }, style]}>
      <SvgXml xml={processedSvg} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" />
    </View>
  )
}

export default RemoteSvg

