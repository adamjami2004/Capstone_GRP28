// config/avatarConfig.js

// Default avatar configuration for new users
export const defaultAvatarConfig = {
    seed: "Default",
    topType: "ShortHairShortFlat",
    accessoriesType: "Blank",
    hairColor: "Brown",
    facialHairType: "Blank",
    facialHairColor: "Brown",
    clotheType: "ShirtCrewNeck",
    clotheColor: "Blue03",
    eyeType: "Default",
    eyebrowType: "Default",
    mouthType: "Smile",
    skinColor: "Light"
  };
  
  // Available options for each customizable feature
  export const avatarOptions = {
    topType: [
      "NoHair", "Eyepatch", "Hat", "Hijab", "Turban", "WinterHat1", "WinterHat2", "WinterHat3", "WinterHat4",
      "LongHairBigHair", "LongHairBob", "LongHairBun", "LongHairCurly", "LongHairCurvy", "LongHairDreads",
      "LongHairFrida", "LongHairFro", "LongHairFroBand", "LongHairNotTooLong", "LongHairShavedSides",
      "LongHairMiaWallace", "LongHairStraight", "LongHairStraight2", "LongHairStraightStrand",
      "ShortHairDreads01", "ShortHairDreads02", "ShortHairFrizzle", "ShortHairShaggyMullet", 
      "ShortHairShortCurly", "ShortHairShortFlat", "ShortHairShortRound", "ShortHairShortWaved", 
      "ShortHairSides", "ShortHairTheCaesar", "ShortHairTheCaesarSidePart"
    ],
    accessoriesType: [
      "Blank", "Kurt", "Prescription01", "Prescription02", "Round", "Sunglasses", "Wayfarers"
    ],
    hairColor: [
      "Auburn", "Black", "Blonde", "BlondeGolden", "Brown", "BrownDark", "PastelPink", 
      "Platinum", "Red", "SilverGray"
    ],
    facialHairType: [
      "Blank", "BeardMedium", "BeardLight", "BeardMajestic", "MoustacheFancy", "MoustacheMagnum"
    ],
    facialHairColor: [
      "Auburn", "Black", "Blonde", "BlondeGolden", "Brown", "BrownDark", "Platinum", "Red"
    ],
    clotheType: [
      "BlazerShirt", "BlazerSweater", "CollarSweater", "GraphicShirt", "Hoodie", "Overall", 
      "ShirtCrewNeck", "ShirtScoopNeck", "ShirtVNeck"
    ],
    clotheColor: [
      "Black", "Blue01", "Blue02", "Blue03", "Gray01", "Gray02", "Heather", "PastelBlue", 
      "PastelGreen", "PastelOrange", "PastelRed", "PastelYellow", "Pink", "Red", "White"
    ],
    eyeType: [
      "Close", "Cry", "Default", "Dizzy", "EyeRoll", "Happy", "Hearts", "Side", "Squint", "Surprised", "Wink", "WinkWacky"
    ],
    eyebrowType: [
      "Angry", "AngryNatural", "Default", "DefaultNatural", "FlatNatural", "RaisedExcited", 
      "RaisedExcitedNatural", "SadConcerned", "SadConcernedNatural", "UnibrowNatural", "UpDown", "UpDownNatural"
    ],
    mouthType: [
      "Concerned", "Default", "Disbelief", "Eating", "Grimace", "Sad", "ScreamOpen", "Serious", 
      "Smile", "Tongue", "Twinkle", "Vomit"
    ],
    skinColor: [
      "Tanned", "Yellow", "Pale", "Light", "Brown", "DarkBrown", "Black"
    ]
  };
  
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
    skinColor: "Skin Tone"
  };
  
  /**
   * Generates a DiceBear Avataaars URL from a configuration object
   * @param {Object} config - Avatar configuration
   * @returns {string} - URL for the avatar image
   */
  export function generateAvatarUrl(config = defaultAvatarConfig) {
    // Make sure we have a valid config
    const safeConfig = { ...defaultAvatarConfig, ...config };
    
    // The correct URL format for DiceBear Avataaars API
    const baseUrl = "https://avatars.dicebear.com/api/avataaars";
    
    // Build query string
    const queryParams = Object.entries(safeConfig)
      .filter(([key, value]) => key !== 'seed' && value) // Exclude seed from query params
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    // Use seed in the path
    const seed = safeConfig.seed || 'default';
    
    // Return the complete URL
    return `${baseUrl}/${encodeURIComponent(seed)}.svg?${queryParams}`;
  }
  
  /**
   * Extracts configuration from an existing avatar URL
   * @param {string} url - Avatar URL
   * @returns {Object} - Extracted configuration
   */
  export function extractConfigFromUrl(url) {
    try {
      if (!url) return defaultAvatarConfig;
      
      // Parse the URL
      const urlObj = new URL(url);
      
      // Start with default config
      const extractedConfig = { ...defaultAvatarConfig };
      
      // Extract seed from path
      const pathParts = urlObj.pathname.split('/');
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart) {
          const seed = lastPart.split('.')[0];
          if (seed) extractedConfig.seed = decodeURIComponent(seed);
        }
      }
      
      // Extract parameters from query string
      const searchParams = new URLSearchParams(urlObj.search);
      for (const [key, value] of searchParams.entries()) {
        if (key in defaultAvatarConfig) {
          extractedConfig[key] = value;
        }
      }
      
      return extractedConfig;
    } catch (error) {
      console.log("Error parsing avatar URL:", error);
      return defaultAvatarConfig;
    }
  }
  
  /**
   * Generates a random avatar configuration
   * @returns {Object} - Random avatar configuration
   */
  export function generateRandomAvatar() {
    const randomConfig = { ...defaultAvatarConfig };
    
    // Generate a random seed
    randomConfig.seed = Math.random().toString(36).substring(2, 10);
    
    // For each feature, select a random option
    Object.keys(avatarOptions).forEach(feature => {
      const options = avatarOptions[feature];
      const randomIndex = Math.floor(Math.random() * options.length);
      randomConfig[feature] = options[randomIndex];
    });
    
    return randomConfig;
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
      [feature]: value
    };
  }