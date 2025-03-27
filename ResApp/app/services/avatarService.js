// app/services/avatarService.js
import * as FileSystem from "expo-file-system"

// Modify the validateConfig function to ensure color values are properly formatted
const validateConfig = (config) => {
  // Make sure we have a valid config
  const safeConfig = { ...config } || {}

  // Known valid parameters for DiceBear Avataaars API
  const validParams = [
    "seed",
    "flip",
    "rotate",
    "scale",
    "radius",
    "size",
    "backgroundColor",
    "translateX",
    "translateY",
    "accessoriesType",
    "clotheType",
    "eyeType",
    "eyebrowType",
    "facialHairType",
    "mouthType",
    "topType",
    "hairColor",
    "facialHairColor",
    "clotheColor",
    "skinColor",
    "hatColor",
  ]

  // Filter out any invalid parameters
  const validatedConfig = {}

  // Process all parameters
  for (const [key, value] of Object.entries(safeConfig)) {
    if (validParams.includes(key) && value !== null && value !== undefined) {
      // Ensure values are strings
      validatedConfig[key] = String(value)
    }
  }

  return validatedConfig
}

// Update the generateAvatarUrl function to use the latest DiceBear API version
export const generateAvatarUrl = (config, format = "svg") => {
  // Validate the configuration
  const validatedConfig = validateConfig(config)

  // The base URL for DiceBear Avataaars API (using version 7.x)
  const baseUrl = "https://api.dicebear.com/7.x/avataaars/"

  // Build query string from validated properties
  const queryParams = Object.entries(validatedConfig)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&")

  // Return the complete URL with the requested format
  const url = `${baseUrl}${format}?${queryParams}`
  console.log("Generated URL:", url)
  return url
}

/**
 * Downloads an avatar PNG from DiceBear API and saves it locally
 * @param {Object} config - Avatar configuration
 * @returns {Promise<string>} - Local file URI of the downloaded image or SVG URL as fallback
 */
export const downloadAvatarPng = async (config) => {
  try {
    // Generate the PNG URL
    const pngUrl = generateAvatarUrl(config, "png")
    console.log("Downloading avatar from:", pngUrl)

    // For debugging, try to fetch the URL first to check response
    const testResponse = await fetch(pngUrl)
    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.error(`API Error (${testResponse.status}):`, errorText)
      throw new Error(`API returned ${testResponse.status}: ${errorText}`)
    }

    // Create a unique filename based on timestamp
    const filename = `avatar_${Date.now()}.png`
    const fileUri = `${FileSystem.cacheDirectory}${filename}`

    // Download the file
    console.log("Saving to:", fileUri)
    const downloadResult = await FileSystem.downloadAsync(pngUrl, fileUri)
    console.log("Download result:", downloadResult)

    if (downloadResult.status !== 200) {
      throw new Error(`Download failed with status ${downloadResult.status}`)
    }

    // Verify the file exists and has content
    const fileInfo = await FileSystem.getInfoAsync(fileUri)
    console.log("File info:", fileInfo)

    if (!fileInfo.exists) {
      throw new Error("Downloaded file doesn't exist")
    }

    if (fileInfo.size === 0) {
      throw new Error("Downloaded file is empty (size 0)")
    }

    return fileUri
  } catch (error) {
    console.error("Error downloading avatar:", error)

    // Fallback to SVG if PNG fails
    console.log("Falling back to SVG URL...")
    const svgUrl = generateAvatarUrl(config, "svg")
    return svgUrl
  }
}

/**
 * Updates an avatar feature and returns the new image URI
 * @param {Object} currentConfig - Current avatar configuration
 * @param {string} feature - Feature to update
 * @param {string} value - New value for the feature
 * @returns {Promise<{config: Object, uri: string}>} - Updated config and image URI
 */
export const updateAvatarFeature = async (currentConfig, feature, value) => {
  try {
    // Create updated configuration
    const updatedConfig = {
      ...currentConfig,
      [feature]: value,
    }

    // Try to download the new avatar image
    let imageUri
    try {
      imageUri = await downloadAvatarPng(updatedConfig)
    } catch (error) {
      console.error("Error downloading PNG, falling back to SVG:", error)
      imageUri = generateAvatarUrl(updatedConfig, "svg")
    }

    return {
      config: updatedConfig,
      uri: imageUri,
    }
  } catch (error) {
    console.error("Error updating avatar feature:", error)

    // Even if there's an error, return the updated config with an SVG URL
    const updatedConfig = {
      ...currentConfig,
      [feature]: value,
    }

    return {
      config: updatedConfig,
      uri: generateAvatarUrl(updatedConfig, "svg"),
    }
  }
}

/**
 * Generates a random avatar and returns the configuration and image URI
 * @returns {Promise<{config: Object, uri: string}>} - Random config and image URI
 */
export const generateRandomAvatar = async () => {
  try {
    // Generate random values for each feature
    const randomConfig = {}

    // For each feature in avatarOptions, select a random option
    Object.keys(require("../config/avatarConfig").avatarOptions).forEach((feature) => {
      const options = require("../config/avatarConfig").avatarOptions[feature]
      const randomIndex = Math.floor(Math.random() * options.length)
      randomConfig[feature] = options[randomIndex]
    })

    // Add a random seed
    randomConfig.seed = Math.random().toString(36).substring(2, 10)

    // Try to download the random avatar image
    let imageUri
    try {
      imageUri = await downloadAvatarPng(randomConfig)
    } catch (error) {
      console.error("Error downloading PNG for random avatar, falling back to SVG:", error)
      imageUri = generateAvatarUrl(randomConfig, "svg")
    }

    return {
      config: randomConfig,
      uri: imageUri,
    }
  } catch (error) {
    console.error("Error generating random avatar:", error)

    // Generate a basic random config as fallback
    const fallbackConfig = {
      ...require("../config/avatarConfig").defaultAvatarConfig,
      seed: Math.random().toString(36).substring(2, 10),
    }

    return {
      config: fallbackConfig,
      uri: generateAvatarUrl(fallbackConfig, "svg"),
    }
  }
}

/**
 * Builds a URL to the DiceBear editor with the given configuration
 * @param {Object} config - Avatar configuration
 * @returns {string} - DiceBear editor URL
 */
export const getEditorUrl = (config) => {
  // Base editor URL
  const editorUrl = "https://editor.dicebear.com/"

  // Convert config to URL parameters for the editor
  const params = new URLSearchParams()
  params.append("style", "avataaars") // Using avataaars style

  // Add all config options to the params
  Object.entries(validateConfig(config)).forEach(([key, value]) => {
    if (value) {
      params.append(`options[${key}]`, value)
    }
  })

  return `${editorUrl}?${params.toString()}`
}

