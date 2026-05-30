import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import YaMap, { Marker } from 'react-native-yamap';

const YANDEX_MAPKIT_API_KEY = '929833d7-22fe-4127-b4df-c4a787066040';
const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

YaMap.init(YANDEX_MAPKIT_API_KEY);

const fallbackRoads = [
  {
    id: 'tverskaya',
    name: 'Тверская улица',
    latitude: 55.7646,
    longitude: 37.6057,
    level: 'free',
    description: 'Тверская улица: движение свободное',
  },
  {
    id: 'okhotny-ryad',
    name: 'Охотный Ряд',
    latitude: 55.7576,
    longitude: 37.6156,
    level: 'medium',
    description: 'Охотный Ряд: средняя загруженность',
  },
  {
    id: 'lubyanka',
    name: 'Лубянская площадь',
    latitude: 55.7596,
    longitude: 37.6262,
    level: 'traffic',
    description: 'Лубянская площадь: пробка, движение затруднено',
  },
  {
    id: 'moskvoretskaya',
    name: 'Москворецкая набережная',
    latitude: 55.7498,
    longitude: 37.6286,
    level: 'medium',
    description: 'Москворецкая набережная: средняя загруженность',
  },
  {
    id: 'novy-arbat',
    name: 'Новый Арбат',
    latitude: 55.7524,
    longitude: 37.5904,
    level: 'traffic',
    description: 'Новый Арбат: пробка, движение затруднено',
  },
];

function getRandomTrafficLevel() {
  const levels = ['free', 'medium', 'traffic'];
  return levels[Math.floor(Math.random() * levels.length)];
}

function getDescription(level) {
  if (level === 'free') {
    return 'Движение свободное';
  }

  if (level === 'medium') {
    return 'Средняя загруженность дороги';
  }

  return 'Пробка, движение затруднено';
}

function getMarkerColor(level) {
  if (level === 'free') {
    return '#2ecc71';
  }

  if (level === 'medium') {
    return '#f1c40f';
  }

  return '#e74c3c';
}

async function loadTrafficData() {
  const query = `
    [out:json][timeout:25];
    (
      way["highway"](55.70,37.50,55.82,37.75);
    );
    out center 20;
  `;

  try {
    const response = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: query,
    });

    const data = await response.json();

    const roads = data.elements
      .filter(item => item.center && item.tags && item.tags.name)
      .slice(0, 15)
      .map(item => {
        const level = getRandomTrafficLevel();

        return {
          id: String(item.id),
          name: item.tags.name,
          latitude: item.center.lat,
          longitude: item.center.lon,
          level,
          description: getDescription(level),
        };
      });

    if (roads.length === 0) {
      return fallbackRoads;
    }

    return roads;
  } catch (error) {
    return fallbackRoads;
  }
}

function LegendItem({ color, text }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendCircle, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{text}</Text>
    </View>
  );
}

function TrafficMarker({ road }) {
  const color = getMarkerColor(road.level);

  return (
    <Marker
      point={{
        lat: road.latitude,
        lon: road.longitude,
      }}
      onPress={() => Alert.alert(road.name, road.description)}>
      <View style={[styles.marker, { backgroundColor: color }]} />
    </Marker>
  );
}

export default function App() {
  const mapRef = useRef(null);

  const [roads, setRoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);

  async function updateTrafficData() {
    setLoading(true);

    const trafficData = await loadTrafficData();

    setRoads(trafficData);
    setUpdatedAt(new Date().toLocaleTimeString());
    setLoading(false);
  }

  useEffect(() => {
    updateTrafficData();
  }, []);

  function handleMapLoaded() {
    if (mapRef.current) {
      mapRef.current.setTrafficVisible(true);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1f2937" />

      <View style={styles.header}>
        <Text style={styles.title}>Карта дорожной обстановки</Text>
        <Text style={styles.subtitle}>Карта Яндекс</Text>
      </View>

      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loaderText}>Загрузка данных...</Text>
          </View>
        ) : (
          <YaMap
            ref={mapRef}
            style={styles.map}
            showUserPosition={false}
            initialRegion={{
              lat: 55.751244,
              lon: 37.618423,
              zoom: 10,
              azimuth: 0,
              tilt: 0,
            }}
            onMapLoaded={handleMapLoaded}>
            {roads.map(road => (
              <TrafficMarker key={road.id} road={road} />
            ))}
          </YaMap>
        )}
      </View>

      <View style={styles.legend}>
        <LegendItem color="#2ecc71" text="Свободно" />
        <LegendItem color="#f1c40f" text="Средняя загрузка" />
        <LegendItem color="#e74c3c" text="Пробка" />
      </View>

      <View style={styles.footer}>
        <Text style={styles.updatedText}>
          {updatedAt ? `Обновлено: ${updatedAt}` : 'Данные ещё не обновлялись'}
        </Text>

        <TouchableOpacity style={styles.button} onPress={updateTrafficData}>
          <Text style={styles.buttonText}>Обновить данные</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#1f2937',
    padding: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#d1d5db',
    marginTop: 4,
    fontSize: 14,
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333333',
  },
  legend: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  legendCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#222222',
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  updatedText: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#555555',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});