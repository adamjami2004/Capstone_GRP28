import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const IconSymbol = ({ name, size, color }: { name: string; size: number; color: string }) => (
  <Text style={{ fontSize: size, color }}>●</Text>
);

const ThemedView = ({ style, children }: { style: any; children: React.ReactNode }) => (
  <View style={style}>{children}</View>
);

const MinimalToggle = ({ value, onValueChange }: { value: boolean; onValueChange: () => void }) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={onValueChange}
    style={[styles.toggle, value && styles.toggleActive]}
  >
    <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
  </TouchableOpacity>
);

type SettingItem = {
  id: string;
  label: string;
  icon: string;
  type: "toggle" | "navigate" | "action";
  value?: boolean;
  subtitle?: string;
  danger?: boolean;
};

type SettingsCategory = {
  title: string;
  items: SettingItem[];
};

export default function SettingsScreen() {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    smsNotifications: true,
    darkMode: false,
    biometricLogin: true,
    twoFactorAuth: false,
    locationServices: true,
    analytics: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const settingsCategories: SettingsCategory[] = [
    {
      title: "Account",
      items: [
        { id: "editProfile", label: "Edit Profile", icon: "person", type: "navigate", subtitle: "Update your personal information" },
        { id: "changePassword", label: "Change Password", icon: "lock", type: "navigate", subtitle: "Update your password" },
        { id: "linkedAccounts", label: "Linked Accounts", icon: "link", type: "navigate", subtitle: "Google, Apple, Facebook" },
      ],
    },
    {
      title: "Notifications",
      items: [
        { id: "pushNotifications", label: "Push Notifications", icon: "bell", type: "toggle", value: settings.pushNotifications },
        { id: "emailNotifications", label: "Email Notifications", icon: "mail", type: "toggle", value: settings.emailNotifications },
        { id: "smsNotifications", label: "SMS Notifications", icon: "message", type: "toggle", value: settings.smsNotifications },
      ],
    },
    {
      title: "Privacy & Security",
      items: [
        { id: "biometricLogin", label: "Biometric Login", icon: "fingerprint", type: "toggle", value: settings.biometricLogin, subtitle: "Use Face ID or Touch ID" },
        { id: "twoFactorAuth", label: "Two-Factor Authentication", icon: "shield", type: "toggle", value: settings.twoFactorAuth },
        { id: "locationServices", label: "Location Services", icon: "location", type: "toggle", value: settings.locationServices },
        { id: "privacyPolicy", label: "Privacy Policy", icon: "document", type: "navigate" },
      ],
    },
    {
      title: "Appearance",
      items: [
        { id: "darkMode", label: "Dark Mode", icon: "moon", type: "toggle", value: settings.darkMode },
        { id: "language", label: "Language", icon: "globe", type: "navigate", subtitle: "English" },
        { id: "fontSize", label: "Font Size", icon: "textformat", type: "navigate", subtitle: "Medium" },
      ],
    },
    
    
  ];

  const renderSettingItem = (item: SettingItem, isLast: boolean) => (
    <View key={item.id}>
      <TouchableOpacity
        style={styles.settingRow}
        activeOpacity={item.type === "toggle" ? 1 : 0.6}
        onPress={() => {
          if (item.type === "toggle") {
            toggleSetting(item.id as keyof typeof settings);
          }
        }}
      >
        <View style={styles.settingLeft}>
          <View style={[styles.iconContainer, item.danger && styles.iconContainerDanger]}>
            <IconSymbol size={10} name={item.icon} color={item.danger ? "#000" : "#000"} />
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingLabel, item.danger && styles.dangerText]}>
              {item.label}
            </Text>
            {item.subtitle && (
              <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
            )}
          </View>
        </View>
        <View style={styles.settingRight}>
          {item.type === "toggle" ? (
            <MinimalToggle
              value={item.value ?? false}
              onValueChange={() => toggleSetting(item.id as keyof typeof settings)}
            />
          ) : (
            <View style={styles.chevronContainer}>
              
            </View>
          )}
        </View>
      </TouchableOpacity>
      {!isLast && <View style={styles.divider} />}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerIconContainer}>
              <IconSymbol size={32} name="gearshape.fill" color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Settings</Text>
              <Text style={styles.headerSubtitle}>Manage your preferences</Text>
            </View>
          </View>
        </View>

        {settingsCategories.map((category) => (
          <View key={category.title} style={styles.categoryContainer}>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <View style={styles.card}>
              {category.items.map((item, itemIndex) =>
                renderSettingItem(item, itemIndex === category.items.length - 1)
              )}
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: "#fff",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 0,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconContainerDanger: {
    backgroundColor: "#f0f0f0",
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "400",
    color: "#000",
  },
  settingSubtitle: {
    fontSize: 12,
    color: "#999",
    marginTop: 1,
  },
  settingRight: {
    marginLeft: 12,
  },
  chevronContainer: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e5e5e5",
    marginLeft: 58,
  },
  dangerText: {
    color: "#000",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  version: {
    fontSize: 12,
    color: "#bbb",
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e5e5e5",
    padding: 2,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: "#000",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
});