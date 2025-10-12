import React, { useState, useEffect, useCallback, memo, lazy, Suspense } from 'react';
import { Box, Typography, Alert, CircularProgress, Paper } from '@mui/material';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import * as turf from '@turf/turf';
import * as topojson from 'topojson-client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// North East India bounds (approximate coordinates)
const NORTH_EAST_BOUNDS = {
  north: 29.5,  // Northern boundary (Arunachal Pradesh)
  south: 21.5,  // Southern boundary (Tripura)
  east: 97.5,   // Eastern boundary (Arunachal Pradesh)
  west: 88.0    // Western boundary (West Bengal border)
};

// Component to restrict map bounds to North East India
const MapBoundsController = memo(() => {
  const map = useMap();

  useEffect(() => {
    // Define the bounds for North East India
    const northEastBounds = L.latLngBounds(
      [NORTH_EAST_BOUNDS.south, NORTH_EAST_BOUNDS.west], // Southwest corner
      [NORTH_EAST_BOUNDS.north, NORTH_EAST_BOUNDS.east]  // Northeast corner
    );

    // Set maximum bounds to prevent panning outside North East India
    map.setMaxBounds(northEastBounds);

    // Set minimum and maximum zoom levels
    map.setMinZoom(6);  // Prevent zooming out too far
    map.setMaxZoom(15); // Allow detailed zoom for verification

    // Fit the map to North East bounds initially
    map.fitBounds(northEastBounds, { padding: [20, 20] });

    // Add event listener to enforce bounds
    map.on('drag', () => {
      map.panInsideBounds(northEastBounds, { animate: false });
    });

    return () => {
      map.off('drag');
    };
  }, [map]);

  return null;
});

MapBoundsController.displayName = 'MapBoundsController';

// Component to get user location (only if within North East India)
const LocationMarker = memo(() => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const map = useMap();

  useEffect(() => {
    map.locate().on("locationfound", function (e: L.LocationEvent) {
      const { lat, lng } = e.latlng;

      // Check if location is within North East India bounds
      if (lat >= NORTH_EAST_BOUNDS.south && lat <= NORTH_EAST_BOUNDS.north &&
        lng >= NORTH_EAST_BOUNDS.west && lng <= NORTH_EAST_BOUNDS.east) {
        setPosition([lat, lng]);
        map.flyTo(e.latlng, Math.max(map.getZoom(), 10));
      } else {
        // If outside North East, show a message but don't set position
        console.log('Location is outside North East India region');
      }
    });
  }, [map]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>
        <div>
          <strong>You are here</strong><br />
          <small>Location: {position[0].toFixed(4)}, {position[1].toFixed(4)}</small>
        </div>
      </Popup>
    </Marker>
  );
});

LocationMarker.displayName = 'LocationMarker';

interface GeoJSONFeature {
  type: string;
  properties: {
    name?: string;
    description?: string;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}

interface GeoJSONData {
  type: string;
  features: GeoJSONFeature[];
}

// Simplify GeoJSON to reduce complexity
const simplifyGeoJSON = (data: GeoJSONData, tolerance = 0.001): GeoJSONData => {
  if (!data || !data.features) return data;

  const simplifiedFeatures = data.features.map(feature => {
    if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
      // Create a simplified version of the geometry
      const simplified = turf.simplify(feature as any, { tolerance, highQuality: true });
      return simplified;
    }
    return feature;
  });

  return {
    ...data,
    features: simplifiedFeatures
  };
};

// Memoized GeoJSON layers
const ForestLayer = memo(({ data, style }: { data: GeoJSON.GeoJsonObject, style: L.PathOptions }) => {
  return (
    <GeoJSON
      key="forest-areas"
      data={data}
      pathOptions={style}
      onEachFeature={(feature: GeoJSON.Feature, layer: L.Layer) => {
        if (feature.properties) {
          layer.bindPopup(`
            <strong>${feature.properties.name || 'Forest Area'}</strong>
            ${feature.properties.description ? `<br/>${feature.properties.description}` : ''}
            ${feature.properties.type ? `<br/>Type: ${feature.properties.type}` : ''}
            ${feature.properties.area ? `<br/>Area: ${feature.properties.area} sq km` : ''}
          `);
        }
      }}
    />
  );
});

ForestLayer.displayName = 'ForestLayer';

const RiverLayer = memo(({ data, style }: { data: GeoJSON.GeoJsonObject, style: L.PathOptions }) => {
  return (
    <GeoJSON
      key="rivers"
      data={data}
      pathOptions={style}
      onEachFeature={(feature: GeoJSON.Feature, layer: L.Layer) => {
        if (feature.properties) {
          layer.bindPopup(`
            <strong>${feature.properties.name || 'River'}</strong>
            ${feature.properties.description ? `<br/>${feature.properties.description}` : ''}
            ${feature.properties.length ? `<br/>Length: ${feature.properties.length} km` : ''}
          `);
        }
      }}
    />
  );
});

RiverLayer.displayName = 'RiverLayer';

const LandmarkLayer = memo(({ data }: { data: GeoJSON.GeoJsonObject }) => {
  return (
    <MarkerClusterGroup chunkedLoading>
      <GeoJSON
        key="landmarks"
        data={data}
        pointToLayer={(feature: GeoJSON.Feature, latlng: L.LatLng) => {
          return L.circleMarker(latlng, {
            radius: 8,
            fillColor: "#FF4500",
            color: "#8B0000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
          });
        }}
        onEachFeature={(feature: GeoJSON.Feature, layer: L.Layer) => {
          if (feature.properties) {
            layer.bindPopup(`
              <strong>${feature.properties.name || 'Landmark'}</strong>
              ${feature.properties.description ? `<br/>${feature.properties.description}` : ''}
              ${feature.properties.type ? `<br/>Type: ${feature.properties.type}` : ''}
            `);
          }
        }}
      />
    </MarkerClusterGroup>
  );
});

LandmarkLayer.displayName = 'LandmarkLayer';

// Component to fit map bounds to all layers
const FitBoundsToLayers = memo(({ forestAreas, landmarks, riversRoads }: {
  forestAreas: GeoJSONData | null,
  landmarks: GeoJSONData | null,
  riversRoads: GeoJSONData | null
}) => {
  const map = useMap();
  const [boundsSet, setBoundsSet] = useState(false);

  useEffect(() => {
    if (forestAreas && landmarks && riversRoads && !boundsSet) {
      try {
        // Combine all features into one collection
        const allFeatures = [
          ...(forestAreas?.features || []),
          ...(landmarks?.features || []),
          ...(riversRoads?.features || [])
        ];

        if (allFeatures.length > 0) {
          // Create a feature collection with all features
          const featureCollection = turf.featureCollection(allFeatures as any);

          // Get the bounding box
          const bbox = turf.bbox(featureCollection);

          // Convert to Leaflet bounds format [southWest, northEast]
          const dataBounds = L.latLngBounds(
            [bbox[1], bbox[0]],
            [bbox[3], bbox[2]]
          );

          // Define North East India bounds
          const northEastBounds = L.latLngBounds(
            [NORTH_EAST_BOUNDS.south, NORTH_EAST_BOUNDS.west],
            [NORTH_EAST_BOUNDS.north, NORTH_EAST_BOUNDS.east]
          );

          // Use the intersection of data bounds and North East bounds
          // If data extends beyond North East, clip to North East bounds
          const clippedBounds = L.latLngBounds(
            [
              Math.max(dataBounds.getSouth(), northEastBounds.getSouth()),
              Math.max(dataBounds.getWest(), northEastBounds.getWest())
            ],
            [
              Math.min(dataBounds.getNorth(), northEastBounds.getNorth()),
              Math.min(dataBounds.getEast(), northEastBounds.getEast())
            ]
          );

          // Fit the map to the clipped bounds with padding
          map.fitBounds(clippedBounds, { padding: [30, 30] });
          setBoundsSet(true);
        }
      } catch (err) {
        console.error('Error fitting bounds:', err);
      }
    }
  }, [map, forestAreas, landmarks, riversRoads, boundsSet]);

  return null;
});

FitBoundsToLayers.displayName = 'FitBoundsToLayers';

// Main GeoCheck component
const GeoCheck: React.FC = () => {
  const { t } = useTranslation();
  const [forestAreas, setForestAreas] = useState<GeoJSONData | null>(null);
  const [landmarks, setLandmarks] = useState<GeoJSONData | null>(null);
  const [riversRoads, setRiversRoads] = useState<GeoJSONData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Define styles for different GeoJSON layers
  const forestStyle: L.PathOptions = {
    fillColor: '#228B22',
    weight: 2,
    opacity: 1,
    color: '#006400',
    fillOpacity: 0.7
  };

  const riverStyle: L.PathOptions = {
    color: '#4682B4',
    weight: 3,
    opacity: 0.7
  };

  // Load GeoJSON data
  useEffect(() => {
    const loadGeoData = async () => {
      try {
        setLoading(true);

        // Load forest areas
        const forestResponse = await fetch('/geo/forest_ne.geojson');
        const forestData = await forestResponse.json();
        setForestAreas(simplifyGeoJSON(forestData));

        // Load landmarks
        const landmarksResponse = await fetch('/geo/landmarks_ne.geojson');
        const landmarksData = await landmarksResponse.json();
        setLandmarks(landmarksData);

        // Load rivers/roads
        const riversResponse = await fetch('/geo/rivers_ne.geojson');
        const riversData = await riversResponse.json();
        setRiversRoads(simplifyGeoJSON(riversData));

        setLoading(false);
      } catch (err) {
        console.error('Error loading GeoJSON data:', err);
        setError(t('errors.processingFailed'));
        setLoading(false);
      }
    };

    loadGeoData();
  }, []);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('geospatial.title')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', height: 'calc(100vh - 180px)', gap: 2 }}>
        {/* Map Container */}
        <Box sx={{ flex: 3, position: 'relative', border: '1px solid #ccc', borderRadius: 1 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : (
            <MapContainer
              center={[25.5, 92.0] as L.LatLngExpression}
              zoom={7}
              minZoom={6}
              maxZoom={15}
              style={{ height: '100%', width: '100%' }}
              maxBounds={[
                [NORTH_EAST_BOUNDS.south, NORTH_EAST_BOUNDS.west],
                [NORTH_EAST_BOUNDS.north, NORTH_EAST_BOUNDS.east]
              ]}
              maxBoundsViscosity={1.0}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Map bounds controller for North East India */}
              <MapBoundsController />

              {/* Auto-zoom to fit all layers */}
              {forestAreas && landmarks && riversRoads &&
                <FitBoundsToLayers
                  forestAreas={forestAreas}
                  landmarks={landmarks}
                  riversRoads={riversRoads}
                />
              }

              {/* Forest Areas Layer */}
              {forestAreas && (
                <ForestLayer
                  data={forestAreas as GeoJSON.GeoJsonObject}
                  style={forestStyle}
                />
              )}

              {/* Landmarks Layer */}
              {landmarks && (
                <LandmarkLayer
                  data={landmarks as GeoJSON.GeoJsonObject}
                />
              )}

              {/* Rivers Layer */}
              {riversRoads && (
                <RiverLayer
                  data={riversRoads as GeoJSON.GeoJsonObject}
                  style={riverStyle}
                />
              )}

              {/* User Location Marker */}
              <LocationMarker />
            </MapContainer>
          )}
        </Box>

        {/* Information Panel */}
        <Paper sx={{ flex: 1, p: 2, maxHeight: 'calc(100vh - 180px)', overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            {t('geospatial.mapInformation')}
          </Typography>

          <Typography variant="body2" color="text.secondary" paragraph>
            {t('geospatial.mapDescription')}
          </Typography>

          <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="caption" color="info.contrastText">
              <strong>{t('geospatial.coverageArea')}:</strong> {t('geospatial.coverageStates')}
            </Typography>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Legend:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: 16, height: 16, bgcolor: '#228B22', mr: 1, opacity: 0.7 }} />
                <Typography variant="body2">Forest/Protected Areas</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: 16, height: 16, bgcolor: '#FFD700', mr: 1, opacity: 0.7 }} />
                <Typography variant="body2">Landmarks</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: 16, height: 16, bgcolor: '#4682B4', mr: 1, opacity: 0.7 }} />
                <Typography variant="body2">Rivers/Roads</Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Map Controls:
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary', mb: 1 }}>
              • Zoom: 6x to 15x (restricted to North East region)
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary', mb: 1 }}>
              • Pan: Limited to North Eastern states boundary
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary', mb: 1 }}>
              • Click on features for detailed information
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
              • Location detection works within NE region only
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default GeoCheck;