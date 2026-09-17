import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { type Region } from 'react-native-maps';

interface Props {
  initialRegion: { latitude: number; longitude: number };
  onCenterChange: (coord: { latitude: number; longitude: number }) => void;
}

// Uber/Careem-style picker: the pin stays fixed in the screen center (drawn
// by the caller) and the map pans underneath it — onCenterChange reports
// wherever the map's center ends up after each pan/zoom.
export function DeliveryMap({ initialRegion, onCenterChange }: Props) {
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      initialRegion={{ ...initialRegion, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
      onRegionChangeComplete={(region: Region) =>
        onCenterChange({ latitude: region.latitude, longitude: region.longitude })
      }
    />
  );
}
