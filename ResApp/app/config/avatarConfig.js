// config/avatarConfig.js

// Default avatar configuration for new users
export const defaultAvatarConfig = {
  seed: "Default",
  topType: "ShortHairShortFlat",
  accessoriesType: "Blank",
  hairColor: "4a312c", // Changed from "Brown" to hex code
  facialHairType: "Blank",
  facialHairColor: "4a312c", // Changed from "Brown" to hex code
  clotheType: "ShirtCrewNeck",
  clotheColor: "1393bd", // Changed from "Blue03" to hex code
  eyeType: "Default",
  eyebrowType: "Default",
  mouthType: "Smile",
  skinColor: "f8d25c", // Changed from "Light" to hex code
}

// Available options for each customizable feature
export const avatarOptions = {
  topType: [
    "NoHair",
    "Eyepatch",
    "Hat",
    "Hijab",
    "Turban",
    "WinterHat1",
    "WinterHat2",
    "WinterHat3",
    "WinterHat4",
    "LongHairBigHair",
    "LongHairBob",
    "LongHairBun",
    "LongHairCurly",
    "LongHairCurvy",
    "LongHairDreads",
    "LongHairFrida",
    "LongHairFro",
    "LongHairFroBand",
    "LongHairNotTooLong",
    "LongHairShavedSides",
    "LongHairMiaWallace",
    "LongHairStraight",
    "LongHairStraight2",
    "LongHairStraightStrand",
    "ShortHairDreads01",
    "ShortHairDreads02",
    "ShortHairFrizzle",
    "ShortHairShaggyMullet",
    "ShortHairShortCurly",
    "ShortHairShortFlat",
    "ShortHairShortRound",
    "ShortHairShortWaved",
    "ShortHairSides",
    "ShortHairTheCaesar",
    "ShortHairTheCaesarSidePart",
  ],
  accessoriesType: ["Blank", "Kurt", "Prescription01", "Prescription02", "Round", "Sunglasses", "Wayfarers"],
  hairColor: [
    "4a312c", // Auburn
    "090806", // Black
    "e8e1e1", // Blonde
    "f8d25c", // BlondeGolden
    "4a312c", // Brown
    "2c1b18", // BrownDark
    "fb6542", // PastelPink
    "b2c2c7", // Platinum
    "962f2f", // Red
    "d6d6d6", // SilverGray
  ],
  facialHairType: ["Blank", "BeardMedium", "BeardLight", "BeardMajestic", "MoustacheFancy", "MoustacheMagnum"],
  facialHairColor: [
    "4a312c", // Auburn
    "090806", // Black
    "e8e1e1", // Blonde
    "f8d25c", // BlondeGolden
    "4a312c", // Brown
    "2c1b18", // BrownDark
    "b2c2c7", // Platinum
    "962f2f", // Red
  ],
  clotheType: [
    "BlazerShirt",
    "BlazerSweater",
    "CollarSweater",
    "GraphicShirt",
    "Hoodie",
    "Overall",
    "ShirtCrewNeck",
    "ShirtScoopNeck",
    "ShirtVNeck",
  ],
  clotheColor: [
    "262e33", // Black
    "65c9ff", // Blue01
    "5199e4", // Blue02
    "1393bd", // Blue03
    "e6e6e6", // Gray01
    "929598", // Gray02
    "adadad", // Heather
    "74d5de", // PastelBlue
    "a7ffc4", // PastelGreen
    "ffdeb5", // PastelOrange
    "ffafb9", // PastelRed
    "ffffb1", // PastelYellow
    "ff488e", // Pink
    "ff5c5c", // Red
    "ffffff", // White
  ],
  eyeType: [
    "Close",
    "Cry",
    "Default",
    "Dizzy",
    "EyeRoll",
    "Happy",
    "Hearts",
    "Side",
    "Squint",
    "Surprised",
    "Wink",
    "WinkWacky",
  ],
  eyebrowType: [
    "Angry",
    "AngryNatural",
    "Default",
    "DefaultNatural",
    "FlatNatural",
    "RaisedExcited",
    "RaisedExcitedNatural",
    "SadConcerned",
    "SadConcernedNatural",
    "UnibrowNatural",
    "UpDown",
    "UpDownNatural",
  ],
  mouthType: [
    "Concerned",
    "Default",
    "Disbelief",
    "Eating",
    "Grimace",
    "Sad",
    "ScreamOpen",
    "Serious",
    "Smile",
    "Tongue",
    "Twinkle",
    "Vomit",
  ],
  skinColor: [
    "ae8b70", // Tanned
    "f8d25c", // Yellow
    "edb98a", // Pale
    "ffdbb4", // Light
    "d08b5b", // Brown
    "8d5524", // DarkBrown
    "614335", // Black
  ],
}

// Update the default avatar configuration to use valid hex codes
// Removed duplicate declaration of defaultAvatarConfig
const defaultAvatarConfigUpdated = {
  seed: "Default",
  topType: "ShortHairShortFlat",
  accessoriesType: "Blank",
  hairColor: "4a312c", // Changed from "Brown" to hex code
  facialHairType: "Blank",
  facialHairColor: "4a312c", // Changed from "Brown" to hex code
  clotheType: "ShirtCrewNeck",
  clotheColor: "1393bd", // Changed from "Blue03" to hex code
  eyeType: "Default",
  eyebrowType: "Default",
  mouthType: "Smile",
  skinColor: "ffdbb4", // Changed from "Light" to hex code
}

// User-friendly feature names for UI display
export const featureLabels = {
  topType: "Hairstyle",
  accessoriesType: "Accessories",
  hairColor: "Hair Color",
  facialHairType: "Facial Hair",
  facialHairColor: "Facial Hair Color",
  clotheType: "Clothes",
  clotheColor: "Clothes Color",
  eyeType: "Eyes",
  eyebrowType: "Eyebrows",
  mouthType: "Mouth",
  skinColor: "Skin Tone",
}

// Color name to hex code mapping for display purposes
export const colorNameMap = {
  // Hair colors
  "4a312c": "Auburn/Brown",
  "090806": "Black",
  e8e1e1: "Blonde",
  f8d25c: "Golden Blonde",
  "2c1b18": "Dark Brown",
  fb6542: "Pink",
  b2c2c7: "Platinum",
  "962f2f": "Red",
  d6d6d6: "Silver Gray",

  // Clothes colors
  "262e33": "Black",
  "65c9ff": "Light Blue",
  "5199e4": "Blue",
  "1393bd": "Dark Blue",
  e6e6e6: "Light Gray",
  929598: "Gray",
  adadad: "Heather",
  "74d5de": "Pastel Blue",
  a7ffc4: "Pastel Green",
  ffdeb5: "Pastel Orange",
  ffafb9: "Pastel Red",
  ffffb1: "Pastel Yellow",
  ff488e: "Pink",
  ff5c5c: "Red",
  ffffff: "White",

  // Skin colors
  ae8b70: "Tanned",
  edb98a: "Pale",
  ffdbb4: "Light",
  d08b5b: "Brown",
  "8d5524": "Dark Brown",
  614335: "Black",
}

// Add this mapping object after the colorNameMap

// User-friendly descriptions for feature options
export const featureDescriptions = {
  // Top Type (Hairstyles)
  topType: {
    NoHair: "Bald",
    Eyepatch: "Eyepatch",
    Hat: "Baseball Cap",
    Hijab: "Hijab",
    Turban: "Turban",
    WinterHat1: "Beanie",
    WinterHat2: "Winter Hat with Pattern",
    WinterHat3: "Winter Hat with Pom-pom",
    WinterHat4: "Winter Hat with Ear Flaps",
    LongHairBigHair: "Long Voluminous Hair",
    LongHairBob: "Bob Cut",
    LongHairBun: "Hair Bun",
    LongHairCurly: "Long Curly Hair",
    LongHairCurvy: "Long Wavy Hair",
    LongHairDreads: "Dreadlocks",
    LongHairFrida: "Flower Crown",
    LongHairFro: "Afro",
    LongHairFroBand: "Afro with Headband",
    LongHairNotTooLong: "Medium Length Hair",
    LongHairShavedSides: "Long Top, Shaved Sides",
    LongHairMiaWallace: "Straight with Bangs",
    LongHairStraight: "Long Straight Hair",
    LongHairStraight2: "Long Straight Hair 2",
    LongHairStraightStrand: "Long Hair with Strand",
    ShortHairDreads01: "Short Dreadlocks",
    ShortHairDreads02: "Short Dreadlocks 2",
    ShortHairFrizzle: "Short Messy Hair",
    ShortHairShaggyMullet: "Shaggy Mullet",
    ShortHairShortCurly: "Short Curly Hair",
    ShortHairShortFlat: "Short Flat Hair",
    ShortHairShortRound: "Short Round Hair",
    ShortHairShortWaved: "Short Wavy Hair",
    ShortHairSides: "Short Sides",
    ShortHairTheCaesar: "Caesar Cut",
    ShortHairTheCaesarSidePart: "Caesar with Side Part",
  },

  // Accessories
  accessoriesType: {
    Blank: "None",
    Kurt: "Square Glasses",
    Prescription01: "Round Glasses",
    Prescription02: "Rectangular Glasses",
    Round: "Round Sunglasses",
    Sunglasses: "Classic Sunglasses",
    Wayfarers: "Wayfarer Sunglasses",
  },

  // Facial Hair
  facialHairType: {
    Blank: "None",
    BeardMedium: "Medium Beard",
    BeardLight: "Light Beard",
    BeardMajestic: "Full Beard",
    MoustacheFancy: "Handlebar Mustache",
    MoustacheMagnum: "Full Mustache",
  },

  // Clothes
  clotheType: {
    BlazerShirt: "Blazer with Shirt",
    BlazerSweater: "Blazer with Sweater",
    CollarSweater: "Collared Sweater",
    GraphicShirt: "Graphic T-Shirt",
    Hoodie: "Hoodie",
    Overall: "Overalls",
    ShirtCrewNeck: "Crew Neck Shirt",
    ShirtScoopNeck: "Scoop Neck Shirt",
    ShirtVNeck: "V-Neck Shirt",
  },

  // Eyes
  eyeType: {
    Close: "Closed",
    Cry: "Crying",
    Default: "Default",
    Dizzy: "Dizzy",
    EyeRoll: "Eye Roll",
    Happy: "Happy",
    Hearts: "Heart Eyes",
    Side: "Side Look",
    Squint: "Squinting",
    Surprised: "Surprised",
    Wink: "Winking",
    WinkWacky: "Silly Wink",
  },

  // Eyebrows
  eyebrowType: {
    Angry: "Angry",
    AngryNatural: "Angry Natural",
    Default: "Default",
    DefaultNatural: "Default Natural",
    FlatNatural: "Flat Natural",
    RaisedExcited: "Raised Excited",
    RaisedExcitedNatural: "Raised Excited Natural",
    SadConcerned: "Sad Concerned",
    SadConcernedNatural: "Sad Concerned Natural",
    UnibrowNatural: "Unibrow",
    UpDown: "Up Down",
    UpDownNatural: "Up Down Natural",
  },

  // Mouth
  mouthType: {
    Concerned: "Concerned",
    Default: "Default",
    Disbelief: "Disbelief",
    Eating: "Eating",
    Grimace: "Grimace",
    Sad: "Sad",
    ScreamOpen: "Screaming",
    Serious: "Serious",
    Smile: "Smiling",
    Tongue: "Tongue Out",
    Twinkle: "Twinkle",
    Vomit: "Vomiting",
  },
  // Update the skinColor descriptions to be more descriptive
  skinColor: {
    ae8b70: "Tanned",
    f8d25c: "Yellow Undertone",
    edb98a: "Pale",
    ffdbb4: "Light",
    d08b5b: "Medium Brown",
    "8d5524": "Dark Brown",
    614335: "Deep Brown",
  },
}

/**
 * Gets a user-friendly description for a feature option
 * @param {string} feature - Feature type (e.g., 'topType', 'accessoriesType')
 * @param {string} value - Feature value (e.g., 'WinterHat1', 'Prescription01')
 * @returns {string} - User-friendly description or the original value if not found
 */
export function getFeatureDescription(feature, value) {
  if (featureDescriptions[feature] && featureDescriptions[feature][value]) {
    return featureDescriptions[feature][value]
  }

  // If no description found, format the value to be more readable
  return value ? value.replace(/([A-Z])/g, " $1").trim() : ""
}

/**
 * Generates a DiceBear Avataaars URL from a configuration object
 * @param {Object} config - Avatar configuration
 * @returns {string} - URL for the avatar image
 */
export function generateAvatarUrl(config = defaultAvatarConfig) {
  // Make sure we have a valid config
  const safeConfig = { ...defaultAvatarConfig, ...config }

  // The correct URL format for DiceBear Avataaars API
  const baseUrl = "https://api.dicebear.com/7.x/avataaars/svg"

  // Build query string
  const queryParams = Object.entries(safeConfig)
    .filter(([key, value]) => value) // Filter out undefined values
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&")

  // Return the complete URL
  return `${baseUrl}?${queryParams}`
}

/**
 * Extracts configuration from an existing avatar URL
 * @param {string} url - Avatar URL
 * @returns {Object} - Extracted configuration
 */
export function extractConfigFromUrl(url) {
  try {
    if (!url) return defaultAvatarConfig

    // Parse the URL
    const urlObj = new URL(url)

    // Start with default config
    const extractedConfig = { ...defaultAvatarConfig }

    // Extract seed from path
    const pathParts = urlObj.pathname.split("/")
    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1]
      if (lastPart) {
        const seed = lastPart.split(".")[0]
        if (seed) extractedConfig.seed = decodeURIComponent(seed)
      }
    }

    // Extract parameters from query string
    const searchParams = new URLSearchParams(urlObj.search)
    for (const [key, value] of searchParams.entries()) {
      if (key in defaultAvatarConfig) {
        extractedConfig[key] = value
      }
    }

    return extractedConfig
  } catch (error) {
    console.log("Error parsing avatar URL:", error)
    return defaultAvatarConfig
  }
}

/**
 * Generates a random avatar configuration
 * @returns {Object} - Random avatar configuration
 */
export function generateRandomAvatar() {
  const randomConfig = { ...defaultAvatarConfig }

  // Generate a random seed
  randomConfig.seed = Math.random().toString(36).substring(2, 10)

  // For each feature, select a random option
  Object.keys(avatarOptions).forEach((feature) => {
    const options = avatarOptions[feature]
    const randomIndex = Math.floor(Math.random() * options.length)
    randomConfig[feature] = options[randomIndex]
  })

  return randomConfig
}

/**
 * Updates a specific feature in an avatar configuration
 * @param {Object} currentConfig - Current avatar configuration
 * @param {string} feature - Feature to update
 * @param {string} value - New value for the feature
 * @returns {Object} - Updated configuration
 */
export function updateAvatarFeature(currentConfig, feature, value) {
  return {
    ...currentConfig,
    [feature]: value,
  }
}

/**
 * Gets a user-friendly name for a color hex code
 * @param {string} hexCode - Color hex code
 * @returns {string} - User-friendly color name or the hex code if not found
 */
export function getColorName(hexCode) {
  return colorNameMap[hexCode] || hexCode
}

