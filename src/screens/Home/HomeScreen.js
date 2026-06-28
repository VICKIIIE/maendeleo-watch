import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";

// Import global theme context and colors
import { useTheme } from "../../theme/ThemeContext";
import { KenyanColors, LightTheme } from "../../theme/colors";
import { Spacing, Typography } from "../../theme/typography";

/* --- Waving Flag Background Components --- */
const WavingKenyanFlagBackground = ({ visible }) => {
  const wave = useSharedValue(0);
  const { height } = useWindowDimensions();

  useEffect(() => {
    if (!visible) return;

    wave.value = 0;
    wave.value = withRepeat(
      withTiming(Math.PI * 2, {
        duration: 5200,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [visible]);

  if (!visible) return null;

  return (
    <View
      pointerEvents="none"
      style={[styles.flagBackground, { minHeight: Math.max(height, 820) }]}
    >
      {Array.from({ length: 11 }).map((_, index) => (
        <FlagWavePanel key={index} index={index} wave={wave} />
      ))}

      <LinearGradient
        colors={[
          "rgba(248,250,252,0.16)",
          "rgba(248,250,252,0.62)",
          "rgba(248,250,252,0.95)",
        ]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

const FlagWavePanel = ({ index, wave }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const movement = Math.sin(wave.value + index * 0.55);
    const shine = Math.cos(wave.value + index * 0.55);

    return {
      opacity: 0.34 + shine * 0.05,
      transform: [{ translateY: movement * 14 }, { scaleY: 1 + shine * 0.025 }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.flagWavePanel,
        {
          left: `${index * 9.5}%`,
          width: "10.8%",
        },
        animatedStyle,
      ]}
    >
      <View style={styles.flagBlack} />
      <View style={styles.flagWhite} />
      <View style={styles.flagRed} />
      <View style={styles.flagWhite} />
      <View style={styles.flagGreen} />
    </Animated.View>
  );
};

/* --- THE MAGIC ANIMATED GLOWING & BOUNCING CARD --- */
const AnimatedGlowingCard = ({ children, isDark, onPress, noPadding = false }) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 30000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const animatedGlowStyles = useAnimatedStyle(() => {
    return { transform: [{ rotateZ: `${rotation.value}deg` }] };
  });

  const animatedScaleStyles = useAnimatedStyle(() => {
    return { transform: [{ scale: scale.value }] };
  });

  const innerCardColor = isDark ? "#111827" : "#FFFFFF";

  return (
    <Pressable
      onPressIn={() =>
        (scale.value = withSpring(0.96, { damping: 15, stiffness: 300 }))
      }
      onPressOut={() =>
        (scale.value = withSpring(1, { damping: 15, stiffness: 300 }))
      }
      onPress={onPress}
      style={styles.pressableWrapper}
    >
      <Animated.View style={[styles.glowContainer, animatedScaleStyles]}>
        <Animated.View style={[styles.gradientWrapper, animatedGlowStyles]}>
          <LinearGradient
            colors={[
              "#006B3F",
              "transparent",
              "#BB0000",
              "transparent",
              "#FFFFFF",
              "transparent",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <View style={[styles.innerCard, { backgroundColor: innerCardColor, padding: noPadding ? 0 : Spacing.md }]}>
          {children}
        </View>
      </Animated.View>
    </Pressable>
  );
};

export default function HomeScreen() {
  const { isDark, toggleTheme } = useTheme();
  const navigation = useNavigation();
  const [greeting, setGreeting] = useState("Good Morning,");

  // Dynamic Time-based Salutation
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning,");
    else if (hour < 17) setGreeting("Good Afternoon,");
    else setGreeting("Good Evening,");
  }, []);

  const currentBackground = isDark ? "#0F172A" : LightTheme.background;
  const currentTextPrimary = isDark ? "#FFFFFF" : LightTheme.textPrimary;
  const currentTextSecondary = isDark ? "#94A3B8" : LightTheme.textSecondary;
  const metaBg = isDark ? "#1E293B" : "#F8FAFC";

  return (
    <View style={{ flex: 1, backgroundColor: currentBackground }}>
      <WavingKenyanFlagBackground visible={!isDark} />

      <SafeAreaView style={[styles.safeArea, { zIndex: 1 }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.container}
        >
          {/* HEADER AREA */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.greeting, { color: currentTextSecondary }]}>
                {greeting}
              </Text>
              <Text style={[styles.userName, { color: currentTextPrimary }]}>
                Victor
              </Text>
            </View>

            <View style={styles.headerActionsRow}>
              <TouchableOpacity
                style={[
                  styles.themeToggleButton,
                  { backgroundColor: isDark ? "#1E293B" : "rgba(255,255,255,0.8)" },
                ]}
                onPress={toggleTheme}
                activeOpacity={0.7}
              >
                <Ionicons name={isDark ? "sunny" : "moon"} size={20} color={isDark ? "#F59E0B" : "#006B3F"} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.profileImageContainer} onPress={() => navigation.navigate("Profile")}>
                <Ionicons name="person" size={22} color={LightTheme.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* HYPER-LOCAL HERO CARD */}
          <AnimatedGlowingCard isDark={isDark} onPress={() => navigation.navigate("Map")}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="location" size={20} color={KenyanColors.green} />
              <Text style={{ color: currentTextPrimary, fontSize: 16, fontWeight: 'bold', marginLeft: 8 }}>Your Development Area</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <View>
                <Text style={{ color: currentTextSecondary, fontSize: 11, textTransform: 'uppercase' }}>County</Text>
                <Text style={{ color: currentTextPrimary, fontWeight: '600' }}>Uasin Gishu</Text>
              </View>
              <View>
                <Text style={{ color: currentTextSecondary, fontSize: 11, textTransform: 'uppercase' }}>Constituency</Text>
                <Text style={{ color: currentTextPrimary, fontWeight: '600' }}>Soy</Text>
              </View>
              <View>
                <Text style={{ color: currentTextSecondary, fontSize: 11, textTransform: 'uppercase' }}>Ward</Text>
                <Text style={{ color: currentTextPrimary, fontWeight: '600' }}>Moi's Bridge</Text>
              </View>
            </View>

            <View style={[styles.leadershipBox, { backgroundColor: metaBg }]}>
              <Text style={{ color: currentTextSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 6 }}>LOCAL LEADERSHIP</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: currentTextPrimary, fontSize: 13 }}><Text style={{fontWeight: 'bold'}}>Gov:</Text> Jonathan Bii</Text>
                <Text style={{ color: currentTextPrimary, fontSize: 13 }}><Text style={{fontWeight: 'bold'}}>MP:</Text> David Kiplagat</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <Text style={{ color: currentTextPrimary, fontWeight: 'bold' }}>12 <Text style={{fontWeight: 'normal', color: currentTextSecondary}}>Active Projects</Text></Text>
              <Text style={{ color: KenyanColors.red, fontWeight: 'bold' }}>2 <Text style={{fontWeight: 'normal'}}>Need Verification</Text></Text>
            </View>
          </AnimatedGlowingCard>

          {/* QUICK ACTIONS */}
          <View style={[styles.quickActionsContent, { backgroundColor: isDark ? "#1E293B" : "#FFF", borderRadius: 16, marginBottom: Spacing.xl }]}>
            <ActionIcon name="camera" label="Report" color={KenyanColors.red} textColor={currentTextPrimary} onPress={() => navigation.navigate("Report")} />
            <ActionIcon name="map" label="View Map" color={KenyanColors.green} textColor={currentTextPrimary} onPress={() => navigation.navigate("Map")} />
            <ActionIcon name="document-text" label="My Audits" color={isDark ? "#E2E8F0" : KenyanColors.black} textColor={currentTextPrimary} onPress={() => navigation.navigate("Profile")} />
            <ActionIcon name="star" label="Watchlist" color="#F59E0B" textColor={currentTextPrimary} onPress={() => navigation.navigate("Notifications")} />
          </View>

          {/* INSIGHTS GRID */}
          <Text style={[styles.sectionTitle, { color: currentTextPrimary }]}>Development Health</Text>
          
          <View style={styles.statsGrid}>
            
            {/* Health Score Card */}
            <View style={styles.halfCardWrapper}>
              <AnimatedGlowingCard isDark={isDark} onPress={() => {}}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: currentTextSecondary, fontSize: 12, fontWeight: 'bold' }}>AREA SCORE</Text>
                  <Ionicons name="pulse" size={16} color={KenyanColors.green} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                  <Text style={{ color: currentTextPrimary, fontSize: 32, fontWeight: '900' }}>84</Text>
                  <Text style={{ color: currentTextSecondary, fontSize: 16, marginBottom: 4 }}>/100</Text>
                </View>
                <Text style={{ color: KenyanColors.green, fontSize: 12, fontWeight: 'bold', marginTop: 5 }}>↑ 6% this month</Text>
              </AnimatedGlowingCard>
            </View>

            {/* AI Corruption Watch Card */}
            <View style={styles.halfCardWrapper}>
              <AnimatedGlowingCard isDark={isDark} onPress={() => navigation.navigate("Map")}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: currentTextSecondary, fontSize: 12, fontWeight: 'bold' }}>AI INSIGHTS</Text>
                  <Ionicons name="warning" size={16} color={KenyanColors.red} />
                </View>
                <Text style={{ color: KenyanColors.red, fontSize: 24, fontWeight: '900' }}>3 Alerts</Text>
                <Text style={{ color: currentTextPrimary, fontSize: 11, marginTop: 5, lineHeight: 16 }}>Projects showing signs of delay or mismatch.</Text>
              </AnimatedGlowingCard>
            </View>

            {/* Sector Distribution Card */}
            <View style={{ width: '100%', marginBottom: Spacing.md }}>
              <AnimatedGlowingCard isDark={isDark}>
                <Text style={{ color: currentTextSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 15 }}>SECTOR DISTRIBUTION</Text>
                
                <DistributionBar label="Roads" value={45} max={50} color={KenyanColors.black} isDark={isDark} />
                <DistributionBar label="Schools" value={18} max={50} color={KenyanColors.green} isDark={isDark} />
                <DistributionBar label="Markets" value={12} max={50} color={KenyanColors.red} isDark={isDark} />
                <DistributionBar label="Hospitals" value={10} max={50} color="#F59E0B" isDark={isDark} />
                
              </AnimatedGlowingCard>
            </View>

          </View>

          {/* LIVE ACTIVITY FEED */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: currentTextPrimary, marginBottom: 0 }]}>Activity Feed</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Map")}>
              <Text style={styles.seeAllText}>View Ledger</Text>
            </TouchableOpacity>
          </View>

          <View style={{ backgroundColor: isDark ? "#1E293B" : "#FFF", borderRadius: 16, padding: 15, marginTop: 10 }}>
            <FeedItem 
              icon="checkmark-circle" color={KenyanColors.green} 
              title="Market Project Verified" subtitle="Moi's Bridge • 12 mins ago" isDark={isDark}
            />
            <FeedItem 
              icon="warning" color={KenyanColors.red} 
              title="Progress Anomaly Flagged" subtitle="Soy Road Upgrade • 1 hr ago" isDark={isDark}
            />
            <FeedItem 
              icon="document-text" color="#F59E0B" 
              title="Audit Submitted" subtitle="Ziwa Health Centre • 3 hrs ago" isDark={isDark}
              hideBorder={true}
            />
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/* --- INNER COMPONENTS --- */

const ActionIcon = ({ name, label, color, textColor, onPress }) => (
  <TouchableOpacity style={styles.actionItem} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.iconCircle, { backgroundColor: color + "15" }]}>
      <Ionicons name={name} size={26} color={color} />
    </View>
    <Text style={[styles.actionLabel, { color: textColor }]}>{label}</Text>
  </TouchableOpacity>
);

const DistributionBar = ({ label, value, max, color, isDark }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
    <Text style={{ width: 65, color: isDark ? '#FFF' : '#0F172A', fontSize: 12 }}>{label}</Text>
    <View style={{ flex: 1, height: 8, backgroundColor: isDark ? '#334155' : '#E2E8F0', borderRadius: 4, marginHorizontal: 10 }}>
      <View style={{ width: `${(value / max) * 100}%`, height: '100%', backgroundColor: color, borderRadius: 4 }} />
    </View>
    <Text style={{ width: 25, color: isDark ? '#94A3B8' : '#64748b', fontSize: 12, fontWeight: 'bold', textAlign: 'right' }}>{value}</Text>
  </View>
);

const FeedItem = ({ icon, color, title, subtitle, isDark, hideBorder }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: hideBorder ? 0 : 1, borderBottomColor: isDark ? '#334155' : '#F1F5F9' }}>
    <View style={[styles.feedIconBox, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <View style={{ marginLeft: 12 }}>
      <Text style={{ color: isDark ? '#FFF' : '#0F172A', fontSize: 14, fontWeight: '600' }}>{title}</Text>
      <Text style={{ color: isDark ? '#94A3B8' : '#64748b', fontSize: 12, marginTop: 2 }}>{subtitle}</Text>
    </View>
  </View>
);


/* --- STYLES --- */
const styles = StyleSheet.create({
  flagBackground: { ...StyleSheet.absoluteFillObject, overflow: "hidden", zIndex: 0 },
  flagWavePanel: { bottom: 0, position: "absolute", top: 0 },
  flagBlack: { backgroundColor: "#111111", flex: 2 },
  flagWhite: { backgroundColor: "#FFFFFF", flex: 0.18 },
  flagRed: { backgroundColor: "#BB0000", flex: 1.5 },
  flagGreen: { backgroundColor: "#006B3F", flex: 2 },
  
  safeArea: { flex: 1, zIndex: 1, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  container: { padding: Spacing.lg, paddingBottom: 100 },
  
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.xl, marginTop: Spacing.sm },
  headerActionsRow: { flexDirection: "row", alignItems: "center" },
  themeToggleButton: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginRight: Spacing.sm, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  greeting: { fontSize: Typography.size.md },
  userName: { fontSize: Typography.size.xl, fontWeight: "bold", letterSpacing: -0.5 },
  profileImageContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0, 107, 63, 0.15)", justifyContent: "center", alignItems: "center" },
  
  pressableWrapper: { marginBottom: Spacing.md },
  glowContainer: { position: "relative", borderRadius: Spacing.radius.lg + 2, overflow: "hidden" },
  gradientWrapper: { position: "absolute", top: "-50%", left: "-50%", width: "200%", height: "200%", zIndex: 0 },
  innerCard: { margin: 1.5, borderRadius: Spacing.radius.lg, zIndex: 1 },
  
  leadershipBox: { padding: 12, borderRadius: 8, marginTop: 10 },
  
  quickActionsContent: { flexDirection: "row", justifyContent: "space-between", padding: Spacing.md, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  actionItem: { alignItems: "center", width: '25%' },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  actionLabel: { fontSize: 11, fontWeight: "600", textAlign: 'center' },
  
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: Spacing.lg },
  sectionTitle: { fontSize: Typography.size.lg, fontWeight: "bold", marginBottom: Spacing.md },
  seeAllText: { color: "#006B3F", fontWeight: "600", fontSize: Typography.size.sm },
  
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  halfCardWrapper: { width: "48%", marginBottom: Spacing.sm },
  
  feedIconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' }
});