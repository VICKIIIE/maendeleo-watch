import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Pressable, 
  SafeAreaView, 
  Platform, 
  StatusBar, 
  useColorScheme 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing, 
  withSpring 
} from 'react-native-reanimated';

// Import themes
import { KenyanColors, LightTheme } from '../../theme/colors';
import { Typography, Spacing } from '../../theme/typography';

/* --- THE MAGIC ANIMATED GLOWING & BOUNCING CARD --- */
const AnimatedGlowingCard = ({ children, isDark, onPress }) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  // Super slow infinite rotation (30 seconds per lap)
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 30000, easing: Easing.linear }),
      -1, 
      false 
    );
  }, []);

  const animatedGlowStyles = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: `${rotation.value}deg` }],
    };
  });

  const animatedScaleStyles = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const innerCardColor = isDark ? '#111827' : '#FFFFFF';

  return (
    <Pressable
      onPressIn={() => scale.value = withSpring(0.96, { damping: 15, stiffness: 300 })}
      onPressOut={() => scale.value = withSpring(1, { damping: 15, stiffness: 300 })}
      onPress={onPress}
      style={styles.pressableWrapper}
    >
      <Animated.View style={[styles.glowContainer, animatedScaleStyles]}>
        
        {/* Rotating Kenyan Flag Gradient */}
        <Animated.View style={[styles.gradientWrapper, animatedGlowStyles]}>
          <LinearGradient
            colors={['#006B3F', 'transparent', '#BB0000', 'transparent', '#FFFFFF', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        
        {/* Solid Inner Card */}
        <View style={[styles.innerCard, { backgroundColor: innerCardColor }]}>
          {children}
        </View>

      </Animated.View>
    </Pressable>
  );
};

export default function HomeScreen() {
  const systemTheme = useColorScheme();
  const isDark = systemTheme === 'dark';

  const currentBackground = isDark ? '#0F172A' : LightTheme.background;
  const currentTextPrimary = isDark ? '#FFFFFF' : LightTheme.textPrimary;
  const currentTextSecondary = isDark ? '#94A3B8' : LightTheme.textSecondary;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentBackground }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: currentTextSecondary }]}>Good Morning,</Text>
            <Text style={[styles.userName, { color: currentTextPrimary }]}>Victor</Text>
          </View>
          <TouchableOpacity style={styles.profileImageContainer}>
            <Ionicons name="person" size={24} color={LightTheme.primary} />
          </TouchableOpacity>
        </View>

        {/* QUICK ACTIONS ROW */}
        <AnimatedGlowingCard isDark={isDark} onPress={() => console.log('Quick Actions Pressed')}>
          <View style={styles.quickActionsContent}>
            <ActionIcon name="camera" label="Report" color={KenyanColors.red} textColor={currentTextPrimary} />
            <ActionIcon name="map" label="View Map" color={KenyanColors.green} textColor={currentTextPrimary} />
            <ActionIcon name="document-text" label="My Reports" color={isDark ? '#E2E8F0' : KenyanColors.black} textColor={currentTextPrimary} />
            <ActionIcon name="star" label="Watchlist" color="#F59E0B" textColor={currentTextPrimary} />
          </View>
        </AnimatedGlowingCard>

        {/* STATISTICS SECTION */}
        <Text style={[styles.sectionTitle, { color: currentTextPrimary }]}>Development Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.halfCardWrapper}>
            <AnimatedGlowingCard isDark={isDark} onPress={() => console.log('Active Projects')}>
              <StatCardContent title="Active Projects" count="124" icon="construct" color={KenyanColors.green} isDark={isDark} />
            </AnimatedGlowingCard>
          </View>
          
          <View style={styles.halfCardWrapper}>
            <AnimatedGlowingCard isDark={isDark} onPress={() => console.log('Delayed Projects')}>
              <StatCardContent title="Delayed" count="12" icon="warning" color={KenyanColors.red} isDark={isDark} />
            </AnimatedGlowingCard>
          </View>

          <View style={styles.halfCardWrapper}>
            <AnimatedGlowingCard isDark={isDark} onPress={() => console.log('Nearby Projects')}>
              <StatCardContent title="Total Nearby" count="45" icon="location" color={isDark ? '#E2E8F0' : KenyanColors.black} isDark={isDark} />
            </AnimatedGlowingCard>
          </View>

          <View style={styles.halfCardWrapper}>
            <AnimatedGlowingCard isDark={isDark} onPress={() => console.log('Reports Center')}>
              <StatCardContent title="Reports" count="8" icon="checkmark-circle" color="#10B981" isDark={isDark} />
            </AnimatedGlowingCard>
          </View>
        </View>

        {/* RECENT REPORTS SECTION */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: currentTextPrimary }]}>Recent Citizen Reports</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <AnimatedGlowingCard isDark={isDark} onPress={() => console.log('Report Detail')}>
          <View style={styles.reportCardContent}>
            <View style={styles.reportImagePlaceholder}>
              <Ionicons name="image-outline" size={32} color="#94A3B8" />
            </View>
            <View style={styles.reportInfo}>
              <Text style={[styles.reportTitle, { color: currentTextPrimary }]}>Moi's Bridge Market</Text>
              <Text style={styles.reportLocation}><Ionicons name="location" size={12} color={KenyanColors.red} /> Uasin Gishu County</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Verified</Text>
              </View>
            </View>
          </View>
        </AnimatedGlowingCard>

      </ScrollView>
    </SafeAreaView>
  );
}

/* --- INNER COMPONENTS --- */
const ActionIcon = ({ name, label, color, textColor }) => (
  <View style={styles.actionItem}>
    <View style={[styles.iconCircle, { backgroundColor: color + '15' }]}>
      <Ionicons name={name} size={28} color={color} />
    </View>
    <Text style={[styles.actionLabel, { color: textColor }]}>{label}</Text>
  </View>
);

const StatCardContent = ({ title, count, icon, color, isDark }) => (
  <View style={styles.statCardInner}>
    <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={[styles.statCount, { color: isDark ? '#FFF' : '#111' }]}>{count}</Text>
    <Text style={[styles.statTitle, { color: isDark ? '#94A3B8' : '#4B5563' }]}>{title}</Text>
  </View>
);

/* --- STYLES --- */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm,
  },
  greeting: {
    fontSize: Typography.size.md,
  },
  userName: {
    fontSize: Typography.size.xl,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  profileImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#006B3F15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressableWrapper: {
    marginBottom: Spacing.xl,
  },
  glowContainer: {
    position: 'relative',
    borderRadius: Spacing.radius.lg + 2,
    overflow: 'hidden',
    shadowColor: '#006B3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  gradientWrapper: {
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    zIndex: 0,
  },
  innerCard: {
    margin: 1.5, // Sleek border thickness
    borderRadius: Spacing.radius.lg,
    zIndex: 1,
  },
  quickActionsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  actionItem: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionLabel: {
    fontSize: Typography.size.xs,
    fontWeight: '500',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  seeAllText: {
    color: '#006B3F',
    fontWeight: '600',
    fontSize: Typography.size.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  halfCardWrapper: {
    width: '48%',
    marginBottom: Spacing.md,
  },
  statCardInner: {
    padding: Spacing.md,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statCount: {
    fontSize: Typography.size.xl,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: Typography.size.xs,
  },
  reportCardContent: {
    flexDirection: 'row',
    padding: Spacing.sm,
  },
  reportImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#334155',
    borderRadius: Spacing.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  reportInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  reportTitle: {
    fontSize: Typography.size.md,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  reportLocation: {
    fontSize: Typography.size.xs,
    color: '#94A3B8',
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#10B98115',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Spacing.radius.full,
  },
  statusText: {
    color: '#10B981',
    fontSize: Typography.size.xs,
    fontWeight: 'bold',
  },
});