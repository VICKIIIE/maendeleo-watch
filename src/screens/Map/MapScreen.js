import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { useRef, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Image
} from "react-native";
import MapView, { Marker, Heatmap, PROVIDER_DEFAULT } from "react-native-maps";

// Import global theme context and colors
import { useTheme } from "../../theme/ThemeContext";
import { KenyanColors } from "../../theme/colors";
import { Spacing, Typography } from "../../theme/typography";

const { width, height } = Dimensions.get("window");

// UPGRADED DATA STRUCTURE: Predictive Intelligence & Accountability
const mockProjects = [
  {
    id: "1",
    name: "Mlolongo Fresh Produce Market",
    type: "Markets",
    status: "Stalled",
    budget: "KES 45M",
    budgetConsumed: 80, // 80% of budget spent
    county: "Machakos",
    constituency: "Mavoko",
    ward: "Syokimau/Mlolongo",
    governor: "H.E. Wavinya Ndeti",
    mp: "Hon. Patrick Makau",
    mca: "Hon. Daniel Mbevi",
    contractor: "Rift Valley Builders Ltd",
    startDate: "Jan 2023",
    expectedCompletion: "Dec 2023",
    officialProgress: 85,
    citizenProgress: 35,
    riskScore: "High",
    performanceRank: "Flagged",
    trustScore: 42,
    lat: -1.3950,
    lng: 36.9350,
  },
  {
    id: "2",
    name: "Athi River Health Centre",
    type: "Hospitals",
    status: "Completed",
    budget: "KES 120M",
    budgetConsumed: 100,
    county: "Machakos",
    constituency: "Mavoko",
    ward: "Athi River",
    governor: "H.E. Wavinya Ndeti",
    mp: "Hon. Patrick Makau",
    mca: "Hon. Jeremiah Kaloi",
    contractor: "AfyaTech Constructors",
    startDate: "Mar 2022",
    expectedCompletion: "Nov 2023",
    officialProgress: 100,
    citizenProgress: 98,
    riskScore: "Low",
    performanceRank: "Top",
    trustScore: 96,
    lat: -1.4430,
    lng: 36.9780,
  },
  {
    id: "3",
    name: "Nairobi Expressway Feeder Roads",
    type: "Roads",
    status: "Ongoing",
    budget: "KES 800M",
    budgetConsumed: 60,
    county: "Nairobi",
    constituency: "Embakasi South",
    ward: "Imara Daima",
    governor: "H.E. Johnson Sakaja",
    mp: "Hon. Julius Mawathe",
    mca: "Hon. Kennedy Obuya",
    contractor: "China Road Bridge Corp",
    startDate: "Feb 2024",
    expectedCompletion: "Dec 2025",
    officialProgress: 60,
    citizenProgress: 55,
    riskScore: "Low",
    performanceRank: "Average",
    trustScore: 88,
    lat: -1.3500,
    lng: 36.9000,
  },
  {
    id: "4",
    name: "Syokimau Electrification",
    type: "ICT",
    status: "Delayed",
    budget: "KES 50M",
    budgetConsumed: 70, // 70% budget spent
    county: "Machakos",
    constituency: "Mavoko",
    ward: "Syokimau/Mlolongo",
    governor: "H.E. Wavinya Ndeti",
    mp: "Hon. Patrick Makau",
    mca: "Hon. Daniel Mbevi",
    contractor: "PowerGrid Kenya",
    startDate: "Aug 2023",
    expectedCompletion: "Mar 2024",
    officialProgress: 50,
    citizenProgress: 20, // Only 20% done
    riskScore: "High",
    performanceRank: "Flagged",
    trustScore: 55,
    lat: -1.3700,
    lng: 36.9250,
  },
];

const filterCategories = ["All", "Roads", "Markets", "Hospitals", "Water Projects", "ICT"];

// Helper function to calculate distance (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1); // Returns distance in km
};

export default function MapScreen() {
  const { isDark } = useTheme();
  const navigation = useNavigation();
  
  // State
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  
  // Intelligence States
  const [mapLayer, setMapLayer] = useState("Standard"); // 'Standard', 'Corruption', 'Rankings', 'Heatmap'
  const [nearbyProjects, setNearbyProjects] = useState([]);
  const [showNearby, setShowNearby] = useState(false);
  
  // Advanced Modals
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showProjectDetail, setShowProjectDetail] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({ county: 'All', constituency: 'All', ward: 'All' });

  const mapRef = useRef(null);

  const initialRegion = {
    latitude: -1.3900,
    longitude: 36.9400,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLocateMe = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showToast("Permission to access location denied");
        return;
      }
      showToast("Acquiring secure location...");
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });

      if (Platform.OS === "android" && location.mocked) {
        showToast("🚨 SECURITY ALERT: Fake GPS detected!");
        return;
      }

      const userLat = location.coords.latitude;
      const userLng = location.coords.longitude;

      mapRef.current?.animateToRegion({
        latitude: userLat, longitude: userLng,
        latitudeDelta: 0.02, longitudeDelta: 0.02,
      }, 1500);

      const projectsWithDistance = mockProjects.map(p => ({
        ...p, distance: calculateDistance(userLat, userLng, p.lat, p.lng)
      })).sort((a, b) => a.distance - b.distance);

      setNearbyProjects(projectsWithDistance);
      setShowNearby(true);
      setSelectedProject(null);
    } catch (error) {
      showToast("Failed to get location. Check GPS.");
    }
  };

  // Determine Marker Color Based on Active Layer
  const getMarkerColor = (project) => {
    if (mapLayer === "Corruption") {
      if (project.riskScore === "High") return KenyanColors.red;
      if (project.riskScore === "Medium") return "#F59E0B";
      return KenyanColors.green;
    }
    if (mapLayer === "Rankings") {
      if (project.performanceRank === "Top") return "#F59E0B"; // Gold for top
      if (project.performanceRank === "Flagged") return "#000000"; // Black for flagged
      return "#3B82F6"; // Blue for average
    }
    // Standard Layer Colors
    if (project.status === "Completed") return KenyanColors.green;
    if (project.status === "Stalled") return KenyanColors.red;
    if (project.status === "Delayed") return "#F59E0B";
    return "#3B82F6"; // Ongoing
  };

  const getMarkerIcon = (project) => {
    if (mapLayer === "Rankings" && project.performanceRank === "Top") return "star";
    if (mapLayer === "Rankings" && project.performanceRank === "Flagged") return "warning";
    if (project.type === "Hospitals") return "medkit";
    if (project.type === "Roads") return "car";
    if (project.type === "Markets") return "cart";
    return "business";
  };

  // Theme Colors
  const searchBg = isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)";
  const chipBg = isDark ? "#1E293B" : "#FFFFFF";
  const chipBorder = isDark ? "#334155" : "#E2E8F0";
  const textPrimary = isDark ? "#FFFFFF" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748b";
  const cardBg = isDark ? "#1E293B" : "#FFFFFF";
  const metaBg = isDark ? "#0F172A" : "#F8FAFC";
  const bg = isDark ? "#0F172A" : "#F8FAFC";
  const accentGreen = KenyanColors.green;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsCompass={false}
        userInterfaceStyle={isDark ? "dark" : "light"}
        onPress={() => { setSelectedProject(null); setShowNearby(false); }}
      >
        {mapLayer === "Heatmap" && (
          <Heatmap
            points={mockProjects.map(p => ({ latitude: p.lat, longitude: p.lng, weight: p.riskScore === "High" ? 3 : 1 }))}
            radius={40}
            opacity={0.7}
            gradient={{ colors: ["#00E400", "#FFFF00", "#FF7E00", "#FF0000"], startPoints: [0.2, 0.4, 0.6, 0.8], colorMapSize: 256 }}
          />
        )}

        {mapLayer !== "Heatmap" && mockProjects.map((project) => {
          if (activeFilter !== "All" && project.type !== activeFilter) return null;
          if (advancedFilters.county !== 'All' && project.county !== advancedFilters.county) return null;
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (!project.name.toLowerCase().includes(query) && !project.county.toLowerCase().includes(query)) return null;
          }

          const markerColor = getMarkerColor(project);

          return (
            <Marker
              key={project.id}
              coordinate={{ latitude: project.lat, longitude: project.lng }}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedProject(project);
                setShowNearby(false);
                mapRef.current?.animateToRegion({
                  latitude: project.lat - 0.015, longitude: project.lng,
                  latitudeDelta: 0.03, longitudeDelta: 0.03,
                }, 500);
              }}
            >
              <View style={[styles.customMarker, { backgroundColor: markerColor }]}>
                <Ionicons name={getMarkerIcon(project)} size={14} color="#FFFFFF" />
              </View>
            </Marker>
          );
        })}
      </MapView>

      <SafeAreaView style={styles.floatingUIContainer}>
        <View style={[styles.searchContainer, { backgroundColor: searchBg }]}>
          <Ionicons name="search" size={20} color={textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search projects..."
            placeholderTextColor={textSecondary}
            style={[styles.searchInput, { color: textPrimary }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={[styles.filterButton, { borderLeftColor: chipBorder }]} onPress={() => setShowFiltersModal(true)}>
            <Ionicons name="options" size={20} color={advancedFilters.county !== 'All' ? KenyanColors.green : textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterScrollWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {filterCategories.map((category, index) => {
              const isActive = activeFilter === category;
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.filterChip, { backgroundColor: chipBg, borderColor: chipBorder }, isActive && { backgroundColor: KenyanColors.green, borderColor: KenyanColors.green }]}
                  onPress={() => { setActiveFilter(category); setSelectedProject(null); setShowNearby(false); }}
                >
                  <Text style={[styles.filterText, { color: textSecondary }, isActive && { color: "#FFFFFF" }]}>{category}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>

      <View style={styles.layerControls}>
        {['Standard', 'Corruption', 'Rankings', 'Heatmap'].map((layer) => (
          <TouchableOpacity
            key={layer}
            style={[styles.layerBtn, { backgroundColor: mapLayer === layer ? KenyanColors.green : searchBg }]}
            onPress={() => setMapLayer(layer)}
          >
            <Ionicons 
              name={layer === 'Standard' ? "map" : layer === 'Corruption' ? "warning" : layer === 'Rankings' ? "trophy" : "flame"} 
              size={20} color={mapLayer === layer ? "#FFF" : textPrimary} 
            />
          </TouchableOpacity>
        ))}
      </View>

      {mapLayer !== "Heatmap" && (
        <View style={[styles.legendCard, { backgroundColor: searchBg }]}>
          <Text style={[styles.legendTitle, { color: textPrimary }]}>
            {mapLayer === "Corruption" ? "Risk Level" : mapLayer === "Rankings" ? "Performance" : "Status"}
          </Text>
          {mapLayer === "Corruption" ? (
            <>
              <View style={styles.legendRow}><View style={[styles.legendDot, {backgroundColor: KenyanColors.red}]}/><Text style={[styles.legendText, {color: textSecondary}]}>High Risk</Text></View>
              <View style={styles.legendRow}><View style={[styles.legendDot, {backgroundColor: "#F59E0B"}]}/><Text style={[styles.legendText, {color: textSecondary}]}>Medium Risk</Text></View>
              <View style={styles.legendRow}><View style={[styles.legendDot, {backgroundColor: KenyanColors.green}]}/><Text style={[styles.legendText, {color: textSecondary}]}>Low Risk</Text></View>
            </>
          ) : mapLayer === "Rankings" ? (
            <>
              <View style={styles.legendRow}><View style={[styles.legendDot, {backgroundColor: "#F59E0B"}]}/><Text style={[styles.legendText, {color: textSecondary}]}>Top Performing</Text></View>
              <View style={styles.legendRow}><View style={[styles.legendDot, {backgroundColor: "#000000"}]}/><Text style={[styles.legendText, {color: textSecondary}]}>Flagged/Stalled</Text></View>
            </>
          ) : (
            <>
              <View style={styles.legendRow}><View style={[styles.legendDot, {backgroundColor: KenyanColors.green}]}/><Text style={[styles.legendText, {color: textSecondary}]}>Completed</Text></View>
              <View style={styles.legendRow}><View style={[styles.legendDot, {backgroundColor: "#3B82F6"}]}/><Text style={[styles.legendText, {color: textSecondary}]}>Ongoing</Text></View>
              <View style={styles.legendRow}><View style={[styles.legendDot, {backgroundColor: KenyanColors.red}]}/><Text style={[styles.legendText, {color: textSecondary}]}>Stalled</Text></View>
            </>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.myLocationButton, { backgroundColor: isDark ? "#1E293B" : "#FFFFFF", bottom: selectedProject || showNearby ? 380 : Spacing.xl }]}
        onPress={handleLocateMe}
      >
        <Ionicons name="locate" size={24} color={textPrimary} />
      </TouchableOpacity>

      {showNearby && !selectedProject && (
        <View style={[styles.sheet, { backgroundColor: cardBg }]}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.projectTitle, { color: textPrimary }]}>Projects Near You</Text>
            <Pressable style={[styles.closeButton, { backgroundColor: metaBg }]} onPress={() => setShowNearby(false)}>
              <Ionicons name="close" size={20} color={textSecondary} />
            </Pressable>
          </View>
          <ScrollView style={{ maxHeight: 200, marginTop: 10 }}>
            {nearbyProjects.map(proj => (
              <TouchableOpacity 
                key={proj.id} 
                style={[styles.nearbyRow, { borderBottomColor: chipBorder }]}
                onPress={() => { setSelectedProject(proj); setShowNearby(false); }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nearbyName, { color: textPrimary }]}>{proj.name}</Text>
                  <Text style={{ color: textSecondary, fontSize: 12 }}>{proj.status} • {proj.budget}</Text>
                </View>
                <Text style={{ color: KenyanColors.green, fontWeight: 'bold' }}>{proj.distance} km</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {selectedProject && (
        <View style={[styles.sheet, { backgroundColor: cardBg }]}>
          <View style={styles.sheetHeader}>
            <View style={styles.titleArea}>
              <Text style={[styles.projectTitle, { color: textPrimary }]}>{selectedProject.name}</Text>
              <Text style={styles.projectCounty}><Ionicons name="location" size={12} /> {selectedProject.county} • {selectedProject.ward}</Text>
            </View>
            <Pressable style={[styles.closeButton, { backgroundColor: metaBg }]} onPress={() => setSelectedProject(null)}>
              <Ionicons name="close" size={20} color={textSecondary} />
            </Pressable>
          </View>

          <View style={styles.accountabilityBox}>
            <Text style={{fontSize: 10, color: textSecondary, fontWeight: 'bold', letterSpacing: 1}}>ACCOUNTABILITY</Text>
            <Text style={{fontSize: 12, color: textPrimary, marginTop: 4}}>Gov: {selectedProject.governor} | MP: {selectedProject.mp} | MCA: {selectedProject.mca}</Text>
          </View>

          {/* BUDGET VS REALITY CHECK */}
          {(() => {
            const budgetDiscrepancy = selectedProject.budgetConsumed - selectedProject.citizenProgress;
            const isHighRisk = budgetDiscrepancy > 30;
            return (
              <View style={[styles.realityBox, { backgroundColor: isHighRisk ? KenyanColors.red + '15' : metaBg, borderColor: isHighRisk ? KenyanColors.red : chipBorder }]}>
                <View style={styles.realityRow}>
                  <Text style={{color: textSecondary, fontSize: 12}}>Budget Consumed:</Text>
                  <Text style={{color: textPrimary, fontWeight: 'bold'}}>{selectedProject.budgetConsumed}%</Text>
                </View>
                <View style={styles.realityRow}>
                  <Text style={{color: textSecondary, fontSize: 12}}>Citizen Physical Audit:</Text>
                  <Text style={{color: textPrimary, fontWeight: 'bold'}}>{selectedProject.citizenProgress}% Complete</Text>
                </View>
                {isHighRisk && (
                  <Text style={{color: KenyanColors.red, fontSize: 12, fontWeight: 'bold', marginTop: 8}}>
                    <Ionicons name="warning" size={12}/> 🚨 High Risk: {budgetDiscrepancy}% Budget vs Progress Mismatch
                  </Text>
                )}
              </View>
            );
          })()}

          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.8}
            onPress={() => setShowProjectDetail(true)}
          >
            <Text style={styles.actionButtonText}>View Full Intelligence Dossier</Text>
            <Ionicons name="expand" size={16} color="#FFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showProjectDetail} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowProjectDetail(false)}>
        <View style={{ flex: 1, backgroundColor: bg }}>
          <View style={[styles.modalHeader, { borderBottomColor: chipBorder }]}>
            <TouchableOpacity onPress={() => setShowProjectDetail(false)}><Ionicons name="close" size={28} color={textPrimary}/></TouchableOpacity>
            <Text style={{ color: textPrimary, fontSize: 16, fontWeight: 'bold' }}>Project Dossier</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}>
            {selectedProject && (
              <>
                <Text style={[styles.projectTitle, { color: textPrimary, fontSize: 24, marginBottom: 8 }]}>{selectedProject.name}</Text>
                <Text style={{ color: textSecondary, marginBottom: 20 }}>{selectedProject.county} &gt; {selectedProject.constituency} &gt; {selectedProject.ward}</Text>
                
                <View style={[styles.realityBox, { backgroundColor: cardBg, borderColor: chipBorder }]}>
                  <Text style={{fontSize: 10, color: accentGreen, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10}}>OFFICIAL METRICS</Text>
                  <View style={styles.realityRow}><Text style={{color: textSecondary}}>Budget:</Text><Text style={{color: textPrimary, fontWeight: 'bold'}}>{selectedProject.budget}</Text></View>
                  <View style={styles.realityRow}><Text style={{color: textSecondary}}>Contractor:</Text><Text style={{color: textPrimary, fontWeight: 'bold'}}>{selectedProject.contractor}</Text></View>
                  <View style={styles.realityRow}><Text style={{color: textSecondary}}>Timeline:</Text><Text style={{color: textPrimary, fontWeight: 'bold'}}>{selectedProject.startDate} - {selectedProject.expectedCompletion}</Text></View>
                </View>

                <View style={[styles.realityBox, { backgroundColor: cardBg, borderColor: chipBorder, marginTop: 15 }]}>
                  <Text style={{fontSize: 10, color: accentGreen, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10}}>AI RISK ANALYSIS</Text>
                  <View style={styles.realityRow}><Text style={{color: textSecondary}}>Budget Consumed:</Text><Text style={{color: KenyanColors.red, fontWeight: 'bold'}}>{selectedProject.budgetConsumed}%</Text></View>
                  <View style={styles.realityRow}><Text style={{color: textSecondary}}>Citizen Progress:</Text><Text style={{color: KenyanColors.green, fontWeight: 'bold'}}>{selectedProject.citizenProgress}%</Text></View>
                  <View style={styles.realityRow}><Text style={{color: textSecondary}}>Community Trust Score:</Text><Text style={{color: textPrimary, fontWeight: 'bold'}}>{selectedProject.trustScore}/100</Text></View>
                </View>

                <View style={[styles.realityBox, { backgroundColor: cardBg, borderColor: chipBorder, marginTop: 15 }]}>
                  <Text style={{fontSize: 10, color: accentGreen, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10}}>LEADERSHIP ACCOUNTABILITY</Text>
                  <View style={styles.realityRow}><Text style={{color: textSecondary}}>Governor:</Text><Text style={{color: textPrimary}}>{selectedProject.governor}</Text></View>
                  <View style={styles.realityRow}><Text style={{color: textSecondary}}>MP:</Text><Text style={{color: textPrimary}}>{selectedProject.mp}</Text></View>
                  <View style={styles.realityRow}><Text style={{color: textSecondary}}>MCA:</Text><Text style={{color: textPrimary}}>{selectedProject.mca}</Text></View>
                </View>
              </>
            )}
          </ScrollView>

          <View style={[styles.modalFooter, { backgroundColor: cardBg, borderTopColor: chipBorder }]}>
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.8}
              onPress={() => { setShowProjectDetail(false); navigation.navigate("Report", { project: selectedProject }); }}
            >
              <Text style={styles.actionButtonText}>Audit Project / File Report</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showFiltersModal} transparent={true} animationType="fade" onRequestClose={() => setShowFiltersModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.filterSheet, { backgroundColor: cardBg }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ color: textPrimary, fontSize: 18, fontWeight: 'bold' }}>Intelligence Filters</Text>
              <TouchableOpacity onPress={() => setShowFiltersModal(false)}><Ionicons name="close" size={24} color={textSecondary}/></TouchableOpacity>
            </View>
            
            <Text style={{ color: textSecondary, marginBottom: 5 }}>County</Text>
            <View style={[styles.dropdownFake, { backgroundColor: metaBg, borderColor: chipBorder }]}><Text style={{color: textPrimary}}>Machakos</Text><Ionicons name="chevron-down" color={textSecondary}/></View>
            
            <Text style={{ color: textSecondary, marginBottom: 5, marginTop: 15 }}>Constituency</Text>
            <View style={[styles.dropdownFake, { backgroundColor: metaBg, borderColor: chipBorder }]}><Text style={{color: textPrimary}}>Mavoko</Text><Ionicons name="chevron-down" color={textSecondary}/></View>
            
            <Text style={{ color: textSecondary, marginBottom: 5, marginTop: 15 }}>Ward</Text>
            <View style={[styles.dropdownFake, { backgroundColor: metaBg, borderColor: chipBorder }]}><Text style={{color: textPrimary}}>Syokimau/Mlolongo</Text><Ionicons name="chevron-down" color={textSecondary}/></View>

            <TouchableOpacity
              style={[styles.actionButton, { marginTop: 30 }]}
              onPress={() => { setAdvancedFilters({ county: 'Machakos', constituency: 'Mavoko', ward: 'Syokimau/Mlolongo' }); setShowFiltersModal(false); }}
            >
              <Text style={styles.actionButtonText}>Apply Intelligence Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {toastMessage && (
        <View style={styles.toastContainer}>
          <Ionicons name="information-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  map: { ...StyleSheet.absoluteFillObject },

  floatingUIContainer: { position: "absolute", top: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 50, width: "100%", zIndex: 1 },
  searchContainer: { flexDirection: "row", alignItems: "center", marginHorizontal: Spacing.lg, paddingHorizontal: Spacing.md, height: 52, borderRadius: Spacing.radius.full, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, fontSize: Typography.size.sm + 1 },
  filterButton: { padding: Spacing.xs, borderLeftWidth: 1, paddingLeft: Spacing.sm, marginLeft: Spacing.xs },
  
  filterScrollWrapper: { marginTop: Spacing.md },
  filterScroll: { paddingHorizontal: Spacing.lg, paddingBottom: 10 },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Spacing.radius.full, marginRight: Spacing.sm, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 3, borderWidth: 1 },
  filterText: { fontSize: Typography.size.sm, fontWeight: "600" },

  layerControls: { position: 'absolute', right: Spacing.lg, top: 160, gap: 10, zIndex: 2 },
  layerBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },

  legendCard: { position: 'absolute', left: Spacing.lg, bottom: Spacing.xl + 60, padding: 12, borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, elevation: 5, zIndex: 2, minWidth: 120 },
  legendTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, letterSpacing: 0.5 },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { fontSize: 11, fontWeight: '500' },

  customMarker: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  myLocationButton: { position: "absolute", right: Spacing.lg, width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, elevation: 6, zIndex: 2 },

  sheet: { position: "absolute", left: Spacing.lg, right: Spacing.lg, bottom: Spacing.xl, padding: Spacing.lg, borderRadius: Spacing.radius.lg, shadowColor: "#000", shadowOpacity: 0.16, shadowRadius: 18, elevation: 8, zIndex: 3 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  titleArea: { flex: 1 },
  projectTitle: { fontSize: Typography.size.md + 2, fontWeight: "700", lineHeight: 22 },
  projectCounty: { marginTop: 4, fontSize: Typography.size.sm, color: "#64748b", fontWeight: "500" },
  closeButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  accountabilityBox: { marginTop: 15, marginBottom: 5 },
  realityBox: { padding: 12, borderRadius: 8, borderWidth: 1, marginVertical: 10 },
  realityRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },

  nearbyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  nearbyName: { fontSize: 14, fontWeight: '600', marginBottom: 4 },

  actionButton: { backgroundColor: "#006B3F", height: 48, borderRadius: Spacing.radius.md, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  actionButtonText: { color: "#FFF", fontWeight: "bold", fontSize: Typography.size.sm + 1 },

  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, borderBottomWidth: 1 },
  modalFooter: { position: 'absolute', bottom: 0, width: '100%', padding: 20, borderTopWidth: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  filterSheet: { padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  dropdownFake: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderWidth: 1, borderRadius: 8 },

  toastContainer: { position: "absolute", top: Platform.OS === "android" ? StatusBar.currentHeight + 120 : 120, alignSelf: "center", backgroundColor: "#1E293B", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: Spacing.radius.full, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 12, elevation: 10, zIndex: 100 },
  toastText: { color: "#FFF", fontWeight: "600", fontSize: Typography.size.sm },
});