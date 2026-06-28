import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Platform,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Animated,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';

// Theme imports
import { useTheme } from '../../theme/ThemeContext';
import { KenyanColors } from '../../theme/colors';
import { Spacing, Typography } from '../../theme/typography';

const { width } = Dimensions.get('window');
const TOTAL_STEPS = 10;

// Simulated Database for Jurisdiction fetching (Feature 2)
const JURISDICTION_DB = {
  "Machakos": { governor: "H.E. Wavinya Ndeti", mp: "Hon. Patrick Makau", mca: "Hon. Jeremiah Kaloi" },
  "Nairobi": { governor: "H.E. Johnson Sakaja", mp: "Hon. Amos Mwago", mca: "Hon. Robert Mbatia" },
  "Uasin Gishu": { governor: "H.E. Jonathan Bii", mp: "Hon. David Kiplagat", mca: "Hon. Mary Goretti" },
  "DEFAULT": { governor: "Pending Verification", mp: "Pending Verification", mca: "Pending Verification" }
};

// Expanded Mock Database including Official Intelligence, Coordinates & History
// Added county, constituency, and ward for Breadcrumbs and Jurisdiction logic
const MOCK_PROJECTS = [
  {
    id: '1',
    name: "Mlolongo Fresh Produce Market",
    category: "Infrastructure",
    type: "Markets",
    county: "Machakos",
    constituency: "Mavoko",
    ward: "Athi River",
    budget: "KES 45,000,000",
    funding: "County Government",
    contractor: "Nairobi BuildCo Ltd",
    startDate: "12 Jan 2024",
    expectedCompletion: "12 Dec 2024",
    officialProgress: "85%",
    status: "Delayed",
    mockDistance: "250m",
    lat: -1.3950,
    lng: 36.9350,
    desc: "Construction of a modern 2-story market with fresh water supply, drainage, and 200 stalls.",
    recentReports: [
      { date: "10 Jun 2026", status: "Stalled", score: "92%" }
    ]
  },
  {
    id: '2',
    name: "Athi River Health Centre Digitization",
    category: "Digital Services",
    type: "ICT",
    county: "Machakos",
    constituency: "Mavoko",
    ward: "Athi River",
    budget: "KES 15,000,000",
    funding: "National Ministry of Health",
    contractor: "TechKenya Solutions",
    startDate: "01 Mar 2025",
    expectedCompletion: "30 Aug 2025",
    officialProgress: "100%",
    status: "Completed",
    mockDistance: "3.2km",
    lat: -1.4430,
    lng: 36.9780,
    desc: "Deployment of e-Health records system and high-speed fiber internet for paperless operations.",
    recentReports: [
      { date: "22 Jun 2026", status: "Ongoing", score: "88%" }
    ]
  },
  {
    id: '3',
    name: "Mavoko Ward Roads Upgrade",
    category: "Infrastructure",
    type: "Roads",
    county: "Machakos",
    constituency: "Mavoko",
    ward: "Syokimau",
    budget: "KES 120,000,000",
    funding: "KeRRA",
    contractor: "Rift Valley Contractors",
    startDate: "10 Nov 2023",
    expectedCompletion: "10 Nov 2025",
    officialProgress: "40%",
    status: "Ongoing",
    mockDistance: "1.5km",
    lat: -1.4000,
    lng: 36.9500,
    desc: "Tarmacking of 15km of feeder roads connecting Syokimau to the main expressway.",
    recentReports: []
  }
];

// Haversine formula to calculate distance between two coordinates in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

export default function ReportScreen() {
  const { isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();

  // Wizard State
  const [step, setStep] = useState(1);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  // Feature 5: Offline Indicator State
  const [isOffline, setIsOffline] = useState(false);

  // Data Payloads
  const [discoveryMode, setDiscoveryMode] = useState(null);
  const [selectedProject, setSelectedProject] = useState(route.params?.project || null);
  
  // Verification States
  const [locationData, setLocationData] = useState(null);
  const [evidence, setEvidence] = useState(null);
  const [aiSequenceText, setAiSequenceText] = useState("");
  const [verificationScores, setVerificationScores] = useState(null);

  // Audit Questionnaire
  const [auditData, setAuditData] = useState({
    status: null,
    progress: 0,
    quality: null,
    safety: null,
    comments: ''
  });

  // Dynamic Theme Variables
  const bg = isDark ? '#0F172A' : '#F8FAFC';
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748b';
  const inputBg = isDark ? '#0F172A' : '#F1F5F9';
  const borderColor = isDark ? '#334155' : '#E2E8F0';
  const accentGreen = '#006B3F';
  const accentRed = '#E3242B';

  // --- NAVIGATION HELPERS ---
  const nextStep = () => { setStep(prev => prev < TOTAL_STEPS ? prev + 1 : prev); };
  const prevStep = () => { if (step > 1) setStep(prev => prev - 1); else navigation.goBack(); };

  const resetWizard = () => {
    setStep(1);
    setDiscoveryMode(null);
    setSelectedProject(null);
    setLocationData(null);
    setEvidence(null);
    setAiSequenceText("");
    setVerificationScores(null);
    setAuditData({
      status: null,
      progress: 0,
      quality: null,
      safety: null,
      comments: ''
    });
  };

  const runGPSVerification = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error("GPS access denied.");

      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      
      let distance = 0;
      if (selectedProject?.lat && selectedProject?.lng) {
        distance = calculateDistance(loc.coords.latitude, loc.coords.longitude, selectedProject.lat, selectedProject.lng);
      }

      // Feature 2: Dynamic Political Leaders API Simulation
      setTimeout(() => {
        const county = selectedProject?.county || "DEFAULT";
        const officials = JURISDICTION_DB[county] || JURISDICTION_DB["DEFAULT"];

        setLocationData({
          coords: loc.coords,
          distance: distance,
          county: selectedProject?.county || "Machakos",
          constituency: selectedProject?.constituency || "Mavoko",
          ward: selectedProject?.ward || "Athi River",
          governor: officials.governor,
          mp: officials.mp,
          mca: officials.mca,
          isVerified: distance < 500 // Within 500m is verified
        });
      }, 1500);

    } catch (error) {
      alert("Verification Failed: " + error.message);
    }
  };

  const captureLiveEvidence = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      setEvidence({ uri: photo.uri, type: 'live_camera' });
      setStep(6); 
      runAIVerification();
    }
  };

  const uploadDigitalEvidence = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setEvidence({ uri: result.assets[0].uri, type: 'gallery_upload' });
      setStep(6);
      runAIVerification();
    }
  };

  const runAIVerification = async () => {
    const sequence = [
      "Analyzing Evidence...",
      "Checking Authenticity & EXIF Data...",
      "Checking Location Match...",
      "Comparing Historical Reports...",
      "Generating Confidence Score..."
    ];
    
    for (let i = 0; i < sequence.length; i++) {
      setAiSequenceText(sequence[i]);
      await new Promise(resolve => setTimeout(resolve, 1200));
    }
    
    // Feature 1: Deterministic AI Scores (No longer random)
    let calcConfidence = 70; // Base Score
    let calcTrust = 70; // Base Score

    // A. GPS Verification Factor
    if (locationData?.isVerified) {
      calcConfidence += 15;
      calcTrust += 15;
    } else {
      calcTrust -= 10; // Penalty for being far away
    }

    // B. Evidence Type Factor
    if (evidence?.type === 'live_camera') {
      calcConfidence += 10;
      calcTrust += 10;
    } else {
      calcConfidence += 5; // Gallery upload is less secure
    }

    // C. Community History Factor (e.g. are there past reliable reports?)
    if (selectedProject?.recentReports && selectedProject.recentReports.length > 0) {
      calcTrust += 5;
    }

    // Ensure it caps at 99%
    calcConfidence = Math.min(calcConfidence, 99);
    calcTrust = Math.min(calcTrust, 99);

    setVerificationScores({
      confidence: calcConfidence, 
      trust: calcTrust,      
      reliability: calcTrust >= 85 ? "High" : (calcTrust >= 70 ? "Moderate" : "Low")
    });
    
    setStep(7);
  };

  // --- STEP RENDERS ---

  const renderStep1Discovery = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: textPrimary, textAlign: 'center', marginBottom: 40 }]}>What would you like to report?</Text>
      
      <TouchableOpacity style={[styles.discoveryCard, { backgroundColor: cardBg, borderColor }]} onPress={() => { setDiscoveryMode('nearby'); nextStep(); }}>
        <View style={[styles.iconCircle, { backgroundColor: accentGreen + '15', width: 60, height: 60, marginBottom: 0 }]}><Ionicons name="location" size={28} color={accentGreen} /></View>
        <View style={{ marginLeft: 16, flex: 1 }}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>Nearby Projects</Text>
          <Text style={styles.cardSubtitle}>Auto-detect using my GPS</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.discoveryCard, { backgroundColor: cardBg, borderColor }]} onPress={() => { setDiscoveryMode('search'); nextStep(); }}>
        <View style={[styles.iconCircle, { backgroundColor: '#3B82F615', width: 60, height: 60, marginBottom: 0 }]}><Ionicons name="search" size={28} color="#3B82F6" /></View>
        <View style={{ marginLeft: 16, flex: 1 }}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>Search Project</Text>
          <Text style={styles.cardSubtitle}>Find by name, ward, or contractor</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.discoveryCard, { backgroundColor: cardBg, borderColor }]} onPress={() => { setDiscoveryMode('browse'); nextStep(); }}>
        <View style={[styles.iconCircle, { backgroundColor: '#F59E0B15', width: 60, height: 60, marginBottom: 0 }]}><Ionicons name="folder-open" size={28} color="#F59E0B" /></View>
        <View style={{ marginLeft: 16, flex: 1 }}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>Browse Development Hub</Text>
          <Text style={styles.cardSubtitle}>Navigate Kenya's project registry</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const renderStep2Selection = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: textPrimary }]}>Project Selection</Text>
      <Text style={[styles.stepDescription, { color: textSecondary, marginBottom: 20 }]}>Select the specific project you are auditing.</Text>
      
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
        {MOCK_PROJECTS.map(proj => (
          <TouchableOpacity 
            key={proj.id}
            style={[styles.selectionCard, { backgroundColor: cardBg, borderColor: selectedProject?.id === proj.id ? accentGreen : borderColor }, selectedProject?.id === proj.id && { borderWidth: 2 }]}
            onPress={() => setSelectedProject(proj)}
          >
            <View style={styles.cardRow}>
              <Text style={[styles.cardTitle, { color: textPrimary, flex: 1 }]}>{proj.name}</Text>
              {selectedProject?.id === proj.id && <Ionicons name="checkmark-circle" size={24} color={accentGreen} />}
            </View>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: textPrimary + '10' }]}><Text style={[styles.badgeText, { color: textPrimary }]}>{proj.category}</Text></View>
              <View style={[styles.badge, { backgroundColor: accentGreen + '15' }]}><Text style={[styles.badgeText, { color: accentGreen }]}>{proj.budget}</Text></View>
              <View style={[styles.badge, { backgroundColor: '#3B82F615' }]}><Text style={[styles.badgeText, { color: '#3B82F6' }]}>{proj.mockDistance}</Text></View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <Text style={styles.cardMeta}><Text style={{fontWeight: 'bold'}}>Status:</Text> {proj.status}</Text>
              <Text style={styles.cardMeta}><Text style={{fontWeight: 'bold'}}>Contractor:</Text> {proj.contractor}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={[styles.primaryButton, { marginTop: 20 }, !selectedProject && { opacity: 0.5 }]} disabled={!selectedProject} onPress={nextStep}>
        <Text style={styles.primaryButtonText}>View Project Intelligence</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3Intelligence = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, padding: Spacing.xl, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      
      {/* Feature 6: Development Hub Breadcrumb */}
      <Text style={{ fontSize: 12, color: textSecondary, marginBottom: 15, fontWeight: '600' }}>
        Kenya &gt; {selectedProject?.county || 'County'} &gt; {selectedProject?.constituency || 'Constituency'} &gt; {selectedProject?.ward || 'Ward'} &gt; <Text style={{color: accentGreen}}>{selectedProject?.name}</Text>
      </Text>

      <Text style={[styles.metaLabel, { color: accentRed }]}>OFFICIAL PROJECT OVERVIEW</Text>
      <Text style={[styles.stepTitle, { color: textPrimary, marginTop: 5, fontSize: 22 }]}>{selectedProject.name}</Text>
      <Text style={[styles.stepDescription, { color: textSecondary }]}>{selectedProject.desc}</Text>

      <View style={[styles.intelligenceCard, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.intelRow}><Text style={styles.intelLabel}>Budget:</Text><Text style={[styles.intelValue, { color: textPrimary }]}>{selectedProject.budget}</Text></View>
        <View style={styles.intelRow}><Text style={styles.intelLabel}>Funding:</Text><Text style={[styles.intelValue, { color: textPrimary }]}>{selectedProject.funding}</Text></View>
        <View style={styles.intelRow}><Text style={styles.intelLabel}>Contractor:</Text><Text style={[styles.intelValue, { color: textPrimary }]}>{selectedProject.contractor}</Text></View>
        <View style={styles.intelRow}><Text style={styles.intelLabel}>Timeline:</Text><Text style={[styles.intelValue, { color: textPrimary }]}>{selectedProject.startDate} - {selectedProject.expectedCompletion}</Text></View>
        <View style={[styles.intelRow, { borderBottomWidth: 0 }]}><Text style={styles.intelLabel}>Official Progress:</Text><Text style={[styles.intelValue, { color: accentGreen, fontWeight: '900' }]}>{selectedProject.officialProgress}</Text></View>
      </View>

      <Text style={[styles.metaLabel, { color: textPrimary, marginTop: 20, marginBottom: 10 }]}>LATEST CITIZEN REPORTS</Text>
      {selectedProject.recentReports.length > 0 ? (
        selectedProject.recentReports.map((rep, idx) => (
          <View key={idx} style={[styles.reportHistoryCard, { backgroundColor: cardBg, borderColor }]}>
            <Ionicons name="time" size={16} color={textSecondary} />
            <Text style={{ color: textSecondary, fontSize: 13, marginLeft: 6, flex: 1 }}>{rep.date}</Text>
            <View style={[styles.badge, { backgroundColor: textPrimary + '10' }]}><Text style={[styles.badgeText, { color: textPrimary }]}>{rep.status}</Text></View>
            <Text style={{ color: accentGreen, fontSize: 13, fontWeight: 'bold', marginLeft: 10 }}>{rep.score}</Text>
          </View>
        ))
      ) : (
        <Text style={{ color: textSecondary, fontSize: 13, fontStyle: 'italic', marginBottom: 20 }}>No recent reports for this project.</Text>
      )}

      <View style={[styles.infoBanner, { backgroundColor: '#F59E0B15', borderColor: '#F59E0B50' }]}>
        <Ionicons name="information-circle" size={24} color="#F59E0B" />
        <Text style={[styles.infoText, { color: textPrimary }]}>Compare the official claims above with your actual ground reality before continuing.</Text>
      </View>

      <TouchableOpacity style={[styles.primaryButton, { marginTop: 30, marginBottom: 40 }]} onPress={() => { runGPSVerification(); nextStep(); }}>
        <Text style={styles.primaryButtonText}>Begin GPS Verification</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep4GPS = () => (
    <View style={styles.centerContent}>
      {!locationData ? (
        <>
          <View style={styles.radarCircle}>
            <ActivityIndicator size="large" color={accentGreen} />
          </View>
          <Text style={[styles.title, { color: textPrimary, marginTop: 30, textAlign: 'center' }]}>Acquiring Secure Satellite Lock...</Text>
          <Text style={[styles.subtext, { textAlign: 'center' }]}>Verifying coordinates, county, and regional officials.</Text>
        </>
      ) : (
        <View style={{ width: '100%', alignItems: 'center' }}>
          <View style={[styles.iconCircle, { backgroundColor: locationData.isVerified ? accentGreen + '20' : accentRed + '20', width: 100, height: 100 }]}>
            <Ionicons name={locationData.isVerified ? "location" : "warning"} size={48} color={locationData.isVerified ? accentGreen : accentRed} />
          </View>
          <Text style={[styles.title, { color: textPrimary, marginTop: 20, textAlign: 'center' }]}>Location Locked</Text>
          
          <View style={[styles.locationCard, { backgroundColor: cardBg, borderColor, width: '100%' }]}>
            <View style={styles.locRow}>
              <Text style={styles.locLabel}>Distance from Target:</Text>
              <Text style={[styles.locValue, { color: locationData.isVerified ? accentGreen : accentRed }]}>{locationData.distance} meters</Text>
            </View>
            <View style={styles.locRow}>
              <Text style={styles.locLabel}>Verified Jurisdiction:</Text>
              <Text style={[styles.locValue, { color: textPrimary }]}>{locationData.ward} Ward</Text>
            </View>
            <View style={styles.locRow}>
              <Text style={styles.locLabel}>Governor:</Text>
              <Text style={[styles.locValue, { color: textPrimary }]}>{locationData.governor}</Text>
            </View>
            <View style={styles.locRow}>
              <Text style={styles.locLabel}>MP:</Text>
              <Text style={[styles.locValue, { color: textPrimary }]}>{locationData.mp}</Text>
            </View>
            <View style={[styles.locRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.locLabel}>MCA:</Text>
              <Text style={[styles.locValue, { color: textPrimary }]}>{locationData.mca}</Text>
            </View>
          </View>

          {!locationData.isVerified && (
            <Text style={[styles.subtext, { color: accentRed, marginTop: 15, textAlign: 'center', fontWeight: 'bold' }]}>
              FLAGGED: You are >500m from the project site. This report will require additional community verification.
            </Text>
          )}

          <TouchableOpacity style={[styles.primaryButton, { width: '100%', marginTop: 30 }]} onPress={nextStep}>
            <Text style={styles.primaryButtonText}>Continue to Evidence</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderStep5Evidence = () => {
    const isInfrastructure = selectedProject.category === 'Infrastructure';

    if (isInfrastructure) {
      if (!cameraPermission?.granted) {
        return (
          <View style={styles.centerContent}>
            <View style={[styles.iconCircle, { backgroundColor: cardBg, width: 100, height: 100 }]}><Ionicons name="camera" size={48} color={textPrimary} /></View>
            <Text style={[styles.title, { color: textPrimary, marginTop: 20, textAlign: 'center' }]}>Camera Required</Text>
            <Text style={[styles.subtext, { textAlign: 'center', marginBottom: 30 }]}>Infrastructure projects require live photo evidence to prevent fraud. Gallery uploads are prohibited for this category.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={requestCameraPermission}>
              <Text style={styles.primaryButtonText}>Enable Camera</Text>
            </TouchableOpacity>
          </View>
        );
      }
      return (
        <View style={styles.cameraContainer}>
          <CameraView ref={cameraRef} style={styles.camera} facing="back">
            <View style={styles.cameraOverlay}>
              <View style={styles.cameraHeaderAlert}>
                <Ionicons name="shield-checkmark" size={16} color="#FFF" />
                <Text style={styles.cameraHeaderText}>Live Infrastructure Audit</Text>
              </View>
              <View style={styles.cameraFrame} />
              <View style={styles.cameraControls}>
                <TouchableOpacity style={styles.captureButton} onPress={captureLiveEvidence}>
                  <View style={styles.captureInner} />
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      );
    }

    return (
      <View style={styles.stepContainer}>
        <Text style={[styles.stepTitle, { color: textPrimary }]}>Digital Evidence</Text>
        <Text style={[styles.stepDescription, { color: textSecondary }]}>For digital services, websites, or document portals, please upload a clear screenshot of the issue.</Text>
        
        <TouchableOpacity style={[styles.evidenceUploadCard, { backgroundColor: cardBg, borderColor, borderStyle: 'dashed' }]} onPress={uploadDigitalEvidence}>
          <View style={[styles.iconCircle, { backgroundColor: '#3B82F620', width: 80, height: 80, marginBottom: 16 }]} ><Ionicons name="images" size={32} color="#3B82F6" /></View>
          <Text style={[styles.cardTitle, { color: textPrimary, textAlign: 'center' }]}>Tap to Upload Screenshot</Text>
          <Text style={[styles.cardSubtitle, { textAlign: 'center', marginTop: 8 }]}>PNG, JPG max 5MB</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderStep6AI = () => (
    <View style={styles.centerContent}>
      <View style={[styles.radarCircle, { borderColor: accentGreen, borderWidth: 2 }]}>
        <Ionicons name="scan" size={48} color={accentGreen} />
      </View>
      <Text style={[styles.title, { color: textPrimary, marginTop: 40, textAlign: 'center' }]}>{aiSequenceText}</Text>
      <Text style={[styles.subtext, { textAlign: 'center', marginTop: 16 }]}>Maendeleo AI Engine is processing the evidence payload against metadata...</Text>
    </View>
  );

  const renderStep7Audit = () => {
    const statuses = ['Not Started', 'Ongoing', 'Near Completion', 'Completed', 'Stalled', 'Abandoned'];
    const qualities = ['Excellent', 'Good', 'Fair', 'Poor'];
    const safeties = ['Safe', 'Unsafe'];
    
    const handleProgressTap = (evt) => {
      const x = evt.nativeEvent.locationX;
      const totalWidth = width - (Spacing.xl * 2) - 32; 
      const percentage = Math.max(0, Math.min(100, Math.round((x / totalWidth) * 100)));
      setAuditData({ ...auditData, progress: percentage });
    };

    // Features 3 & 4: Corruption Risk & Budget Anomaly Logic
    const officialProgressValue = parseInt(selectedProject?.officialProgress?.replace('%', '') || "0");
    const progressDiscrepancy = officialProgressValue - auditData.progress;
    const showAnomalyWarning = progressDiscrepancy >= 30;

    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, padding: Spacing.xl, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          <Text style={[styles.stepTitle, { color: textPrimary, marginBottom: 20 }]}>Project Audit</Text>
          
          <Text style={[styles.formLabel, { color: textPrimary }]}>1. Current Ground Status</Text>
          <View style={styles.chipRow}>
            {statuses.map(stat => (
              <TouchableOpacity key={stat} style={[styles.chip, { backgroundColor: cardBg, borderColor }, auditData.status === stat && { backgroundColor: accentGreen, borderColor: accentGreen }]} onPress={() => setAuditData({ ...auditData, status: stat })}>
                <Text style={[styles.chipText, { color: textPrimary }, auditData.status === stat && { color: '#FFF' }]}>{stat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.formLabel, { color: textPrimary, marginTop: 24 }]}>2. Estimated Progress: {auditData.progress}%</Text>
          <View style={styles.sliderContainer}>
            <TouchableOpacity activeOpacity={1} style={[styles.sliderTrack, { backgroundColor: borderColor }]} onPress={(e) => handleProgressTap(e)}>
              <View style={[styles.sliderFill, { backgroundColor: accentGreen, width: `${auditData.progress}%` }]} />
              <View style={[styles.sliderThumb, { left: `${auditData.progress}%`, backgroundColor: cardBg, borderColor: accentGreen }]} pointerEvents="none" />
            </TouchableOpacity>
            <View style={styles.sliderMarks}>
              <Text style={styles.sliderMarkText}>0%</Text><Text style={styles.sliderMarkText}>50%</Text><Text style={styles.sliderMarkText}>100%</Text>
            </View>
          </View>

          {/* Features 3 & 4: Corruption Risk & Budget Anomaly Alert */}
          {showAnomalyWarning && (
            <View style={[styles.anomalyAlert, { backgroundColor: accentRed + '15', borderColor: accentRed }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Ionicons name="warning" size={20} color={accentRed} />
                <Text style={{ color: accentRed, fontWeight: 'bold', marginLeft: 8, fontSize: 15 }}>Potential Progress Mismatch Detected</Text>
              </View>
              <Text style={{ color: textPrimary, fontSize: 13, marginBottom: 8 }}>Official Claims: {selectedProject?.officialProgress} | Citizen Audit: {auditData.progress}%</Text>
              <View style={{height: 1, backgroundColor: accentRed, opacity: 0.2, marginBottom: 8}} />
              <Text style={{ color: accentRed, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }}>SYSTEM ACTION: BUDGET UTILIZATION REVIEW RECOMMENDED</Text>
            </View>
          )}

          <Text style={[styles.formLabel, { color: textPrimary, marginTop: 24 }]}>3. Quality Assessment</Text>
          <View style={styles.chipRow}>
            {qualities.map(q => (
              <TouchableOpacity key={q} style={[styles.chip, { backgroundColor: cardBg, borderColor }, auditData.quality === q && { backgroundColor: accentGreen, borderColor: accentGreen }]} onPress={() => setAuditData({ ...auditData, quality: q })}>
                <Text style={[styles.chipText, { color: textPrimary }, auditData.quality === q && { color: '#FFF' }]}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.formLabel, { color: textPrimary, marginTop: 24 }]}>4. Safety Assessment</Text>
          <View style={styles.chipRow}>
            {safeties.map(s => (
              <TouchableOpacity key={s} style={[styles.chip, { flex: 1, backgroundColor: cardBg, borderColor }, auditData.safety === s && { backgroundColor: s === 'Safe' ? accentGreen : accentRed, borderColor: s === 'Safe' ? accentGreen : accentRed }]} onPress={() => setAuditData({ ...auditData, safety: s })}>
                <Text style={[styles.chipText, { color: textPrimary, textAlign: 'center' }, auditData.safety === s && { color: '#FFF' }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.formLabel, { color: textPrimary, marginTop: 24 }]}>5. Additional Comments (Min. 50 chars)</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: inputBg, color: textPrimary, borderColor: borderColor }]}
            placeholder="Describe specifics about materials, worker activity, or digital errors..."
            placeholderTextColor={textSecondary}
            multiline
            numberOfLines={5}
            value={auditData.comments}
            onChangeText={(text) => setAuditData({ ...auditData, comments: text })}
          />
          <Text style={[styles.charCount, { color: auditData.comments.length >= 50 ? accentGreen : textSecondary }]}>
            {auditData.comments.length} / 50 chars minimum
          </Text>

          <TouchableOpacity 
            style={[styles.primaryButton, { marginTop: 30, marginBottom: 40 }, (!auditData.status || !auditData.quality || !auditData.safety || auditData.comments.length < 50) && { opacity: 0.5 }]}
            disabled={!auditData.status || !auditData.quality || !auditData.safety || auditData.comments.length < 50}
            onPress={nextStep}
          >
            <Text style={styles.primaryButtonText}>Generate Trust Score</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  const renderStep8TrustScore = () => (
    <View style={styles.centerContent}>
      <Text style={[styles.metaLabel, { color: accentGreen, letterSpacing: 2, marginBottom: 10 }]}>VERIFICATION SUMMARY</Text>
      <Text style={[styles.stepTitle, { color: textPrimary, textAlign: 'center', marginBottom: 40 }]}>System Confidence High</Text>

      <View style={styles.scoreRow}>
        <View style={[styles.scoreCircle, { borderColor: cardBg }]}>
          <Text style={[styles.scoreNumber, { color: textPrimary }]}>{verificationScores?.confidence}%</Text>
          <Text style={styles.scoreLabel}>Evidence</Text>
        </View>
        <View style={[styles.scoreCircle, { borderColor: accentGreen }]}>
          <Text style={[styles.scoreNumber, { color: accentGreen }]}>{verificationScores?.trust}%</Text>
          <Text style={styles.scoreLabel}>Trust Score</Text>
        </View>
      </View>

      <View style={styles.checklist}>
        <View style={styles.checkItem}><Ionicons name="checkmark-circle" size={20} color={accentGreen} /><Text style={[styles.checkText, { color: textPrimary }]}>GPS Anchored ({locationData?.distance}m offset)</Text></View>
        <View style={styles.checkItem}><Ionicons name="checkmark-circle" size={20} color={accentGreen} /><Text style={[styles.checkText, { color: textPrimary }]}>Device EXIF Verified</Text></View>
        <View style={styles.checkItem}><Ionicons name="checkmark-circle" size={20} color={accentGreen} /><Text style={[styles.checkText, { color: textPrimary }]}>Project Match Algorithm Passed</Text></View>
        <View style={styles.checkItem}><Ionicons name="checkmark-circle" size={20} color={accentGreen} /><Text style={[styles.checkText, { color: textPrimary }]}>Community Reliability: {verificationScores?.reliability}</Text></View>
      </View>

      <TouchableOpacity style={[styles.primaryButton, { width: '100%', marginTop: 40 }]} onPress={nextStep}>
        <Text style={styles.primaryButtonText}>Proceed to Final Review</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep9Review = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, padding: Spacing.xl, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <Text style={[styles.stepTitle, { color: textPrimary }]}>Official Audit Receipt</Text>
      <Text style={[styles.stepDescription, { color: textSecondary, marginBottom: 20 }]}>Please review the dossier before writing to the public ledger.</Text>
      
      {evidence && <Image source={{ uri: evidence.uri }} style={styles.reviewImage} />}
      
      <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.metaLabel, { color: accentGreen }]}>PROJECT PROFILE</Text>
        <Text style={[styles.summaryText, { color: textPrimary, fontWeight: '700', fontSize: 16, marginTop: 5 }]}>{selectedProject?.name}</Text>
        <Text style={[styles.summaryText, { color: textSecondary, marginBottom: 15 }]}>Budget: {selectedProject?.budget}</Text>

        <Text style={[styles.metaLabel, { color: accentGreen }]}>JURISDICTION</Text>
        <Text style={[styles.summaryText, { color: textPrimary, marginTop: 5 }]}>{locationData?.county} County, {locationData?.ward} Ward</Text>
        <Text style={[styles.summaryText, { color: textSecondary, marginBottom: 15 }]}>Gov: {locationData?.governor} | MP: {locationData?.mp} | MCA: {locationData?.mca}</Text>

        <Text style={[styles.metaLabel, { color: accentGreen }]}>YOUR AUDIT</Text>
        <Text style={[styles.summaryText, { color: textPrimary, marginTop: 5 }]}><Text style={{fontWeight: 'bold'}}>Status:</Text> {auditData.status}</Text>
        <Text style={[styles.summaryText, { color: textPrimary }]}><Text style={{fontWeight: 'bold'}}>Progress:</Text> {auditData.progress}% (Official claimed: {selectedProject?.officialProgress})</Text>
        <Text style={[styles.summaryText, { color: textPrimary }]}><Text style={{fontWeight: 'bold'}}>Quality:</Text> {auditData.quality} | <Text style={{fontWeight: 'bold'}}>Safety:</Text> {auditData.safety}</Text>
        <Text style={[styles.summaryText, { color: textSecondary, marginTop: 10, fontStyle: 'italic' }]}>"{auditData.comments}"</Text>
      </View>

      <TouchableOpacity style={[styles.primaryButton, { marginTop: 30 }]} onPress={nextStep}>
        <Ionicons name="cloud-upload" size={20} color="#FFF" style={{ marginRight: 8 }} />
        <Text style={styles.primaryButtonText}>Publish Official Report</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep10Submit = () => {
    const trackingId = "MW-" + Math.random().toString(16).slice(2, 10).toUpperCase();
    const submitTime = new Date().toLocaleString();
    return (
      <View style={styles.centerContent}>
        <View style={[styles.iconCircle, { backgroundColor: accentGreen + '20', width: 100, height: 100 }]}>
          <Ionicons name="checkmark-done" size={60} color={accentGreen} />
        </View>
        <Text style={[styles.title, { color: textPrimary, marginTop: 24, textAlign: 'center' }]}>Report Published</Text>
        
        <View style={[styles.trackingCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={styles.locLabel}>Tracking ID</Text>
          <Text style={[styles.trackingIdText, { color: textPrimary }]}>{trackingId}</Text>
          <Text style={[styles.locLabel, { marginTop: 10 }]}>Submitted: {submitTime}</Text>
          <View style={{height: 1, backgroundColor: borderColor, marginVertical: 20, width: '100%'}} />
          <Text style={[styles.locValue, { color: textSecondary, textAlign: 'center' }]}>Your audit has been secured on the Maendeleo ledger and flagged for official review.</Text>
          <Text style={[styles.locValue, { color: accentGreen, textAlign: 'center', marginTop: 15, fontWeight: '700' }]}>Expected Review: 48 Hours</Text>
        </View>

        <TouchableOpacity style={[styles.primaryButton, { width: '100%', marginTop: 40 }]} onPress={resetWizard}>
          <Ionicons name="add-circle-outline" size={24} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>Submit Another Report</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.primaryButton, { width: '100%', marginTop: 15, backgroundColor: 'transparent', borderWidth: 1, borderColor }]} onPress={() => navigation.navigate('Map')}>
          <Text style={[styles.primaryButtonText, { color: textPrimary }]}>Return to Map</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      
      {/* GLOBAL HEADER */}
      {/* Hidden during immersive Camera and Loading Steps */}
      {(step !== 5 || selectedProject?.category !== 'Infrastructure') && step !== 6 && step !== 10 && (
        <View style={styles.header}>
          <TouchableOpacity onPress={prevStep} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={textPrimary} />
          </TouchableOpacity>
          
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: borderColor }]}>
              <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%`, backgroundColor: accentGreen }]} />
            </View>
            <Text style={[styles.progressText, { color: textSecondary }]}>Step {step} of {TOTAL_STEPS}</Text>
          </View>
          
          {/* Feature 5: Offline Indicator Toggle */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Switch
              trackColor={{ false: borderColor, true: accentRed + '80' }}
              thumbColor={isOffline ? accentRed : '#f4f3f4'}
              ios_backgroundColor={borderColor}
              onValueChange={setIsOffline}
              value={isOffline}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
        </View>
      )}

      {/* Feature 5: Offline Warning Banner */}
      {isOffline && step !== 6 && step !== 10 && (
        <View style={{ backgroundColor: accentRed + '20', paddingVertical: 6, alignItems: 'center' }}>
          <Text style={{ color: accentRed, fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 }}>
            <Ionicons name="cloud-offline" size={12} /> OFFLINE MODE ACTIVE. REPORTS WILL SYNC LATER.
          </Text>
        </View>
      )}

      {/* WIZARD ROUTER */}
      {step === 1 && renderStep1Discovery()}
      {step === 2 && renderStep2Selection()}
      {step === 3 && renderStep3Intelligence()}
      {step === 4 && renderStep4GPS()}
      {step === 5 && renderStep5Evidence()}
      {step === 6 && renderStep6AI()}
      {step === 7 && renderStep7Audit()}
      {step === 8 && renderStep8TrustScore()}
      {step === 9 && renderStep9Review()}
      {step === 10 && renderStep10Submit()}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  stepContainer: { flex: 1, padding: Spacing.xl },
  
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  progressContainer: { flex: 1, alignItems: 'center', marginHorizontal: Spacing.md },
  progressBar: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },

  title: { fontSize: 24, fontWeight: 'bold' },
  stepTitle: { fontSize: 28, fontWeight: '900', marginBottom: 8, letterSpacing: -0.5 },
  stepDescription: { fontSize: 15, lineHeight: 22 },
  subtext: { fontSize: 15, color: '#94A3B8', marginTop: 10, lineHeight: 22 },
  metaLabel: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 4 },
  
  primaryButton: { height: 56, borderRadius: Spacing.radius.full, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#006B3F', elevation: 4, shadowColor: '#006B3F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  
  discoveryCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderRadius: Spacing.radius.lg, borderWidth: 1, marginBottom: Spacing.md },
  selectionCard: { padding: Spacing.lg, borderRadius: Spacing.radius.lg, borderWidth: 1, marginBottom: Spacing.md },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#94A3B8' },
  cardMeta: { fontSize: 13, color: '#94A3B8' },
  iconCircle: { borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  
  badgeRow: { flexDirection: 'row', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  intelligenceCard: { borderWidth: 1, borderRadius: Spacing.radius.lg, padding: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.md },
  intelRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.1)' },
  intelLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  intelValue: { fontSize: 14, fontWeight: '600', maxWidth: '70%', textAlign: 'right' },
  infoBanner: { flexDirection: 'row', padding: 16, borderRadius: Spacing.radius.lg, borderWidth: 1, alignItems: 'center' },
  infoText: { flex: 1, marginLeft: 12, fontSize: 13, lineHeight: 20 },
  reportHistoryCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderRadius: Spacing.radius.md, marginBottom: 8 },

  radarCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(0,107,63,0.1)', justifyContent: 'center', alignItems: 'center' },
  locationCard: { borderWidth: 1, borderRadius: Spacing.radius.lg, padding: 20, marginTop: 30 },
  locRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.1)' },
  locLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  locValue: { fontSize: 14, fontWeight: '700' },

  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'space-between', alignItems: 'center' },
  cameraHeaderAlert: { position: 'absolute', top: 50, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 8 },
  cameraHeaderText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  cameraFrame: { width: width * 0.85, height: width * 1.2, borderWidth: 2, borderColor: '#FFF', borderStyle: 'dashed', borderRadius: 16, marginTop: 120 },
  cameraControls: { paddingBottom: 60 },
  captureButton: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF' },
  evidenceUploadCard: { alignItems: 'center', justifyContent: 'center', padding: 40, borderWidth: 2, borderRadius: Spacing.radius.lg, marginTop: 20 },

  formLabel: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderRadius: 20 },
  chipText: { fontSize: 13, fontWeight: '600' },
  sliderContainer: { marginVertical: 10, paddingHorizontal: 10 },
  sliderTrack: { height: 40, borderRadius: 20, overflow: 'hidden', justifyContent: 'center' },
  sliderFill: { position: 'absolute', top: 0, bottom: 0, left: 0 },
  sliderThumb: { width: 20, height: 30, borderRadius: 10, borderWidth: 2, position: 'absolute', top: 5, marginLeft: -10 },
  sliderMarks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 10 },
  sliderMarkText: { fontSize: 11, color: '#94A3B8', fontWeight: 'bold' },
  textInput: { borderWidth: 1, borderRadius: Spacing.radius.md, padding: 16, fontSize: 15, textAlignVertical: 'top' },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 8, fontWeight: '600' },
  
  anomalyAlert: { padding: 16, borderRadius: Spacing.radius.lg, borderWidth: 1, marginTop: 20 },

  scoreRow: { flexDirection: 'row', gap: 20, marginBottom: 40 },
  scoreCircle: { width: 140, height: 140, borderRadius: 70, borderWidth: 6, alignItems: 'center', justifyContent: 'center' },
  scoreNumber: { fontSize: 36, fontWeight: '900' },
  scoreLabel: { fontSize: 12, color: '#94A3B8', fontWeight: 'bold', marginTop: 4 },
  checklist: { width: '100%', paddingHorizontal: 20 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  checkText: { fontSize: 14, fontWeight: '600' },

  reviewImage: { width: '100%', height: 200, borderRadius: Spacing.radius.lg, marginBottom: 20 },
  summaryCard: { borderWidth: 1, borderRadius: Spacing.radius.lg, padding: 20 },
  summaryText: { fontSize: 14, lineHeight: 22 },
  trackingCard: { borderWidth: 1, borderRadius: Spacing.radius.lg, padding: 24, width: '100%', marginTop: 30, alignItems: 'center' },
  trackingIdText: { fontSize: 32, fontWeight: '900', letterSpacing: 2, marginTop: 5 },
});