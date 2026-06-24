import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: -1.517684,
          longitude: 37.263415,
          latitudeDelta: 0.05, 
          longitudeDelta: 0.05,
        }}
      >
        {/* THE PURE, NATIVE ANDROID MARKER */}
        <Marker
          coordinate={{ latitude: -1.517684, longitude: 37.263415 }}
          title="Machakos Water Borehole"
          description="Status: Delayed"
          pinColor="#BB0000" 
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: width, height: height }
});