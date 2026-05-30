import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

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

export default function App() {
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

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Карта дорожной обстановки</Text>
      <Text style={styles.subtitle}>Загружено участков: {roads.length}</Text>
      {loading && <ActivityIndicator size="large" />}
      <Text style={styles.updatedText}>
        {updatedAt ? `Обновлено: ${updatedAt}` : 'Данные ещё не обновлялись'}
      </Text>
      <TouchableOpacity style={styles.button} onPress={updateTrafficData}>
        <Text style={styles.buttonText}>Обновить данные</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#4b5563',
  },
  updatedText: {
    marginTop: 12,
    color: '#6b7280',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});