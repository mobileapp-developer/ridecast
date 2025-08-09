import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, Platform, SafeAreaView, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { calcSuitability, fetchCurrentWeather, WeatherNow } from "../../shared/weatherApi";

type Coordinates = {
  latitude: number;
  longitude: number
};

export default function TodayScreen() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherNow | null>(null);
  const [loading, setLoading] = useState(true);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Location permission denied");
          setLoading(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        const c = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setCoords(c);

        const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || "";
        if (!apiKey) {
          setErrorMsg("Missing OpenWeather API key. Set EXPO_PUBLIC_OPENWEATHER_API_KEY.");
          setLoading(false);
          return;
        }
        const w = await fetchCurrentWeather(c.latitude, c.longitude);
        setWeather(w);
      } catch (e: any) {
        setErrorMsg(e?.message ?? "Failed to fetch location/weather");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const suitability = useMemo(() => (weather ? calcSuitability({
    date: '',
    weekday: '',
    condition: weather.condition,
    tempC: weather.tempC,
    tempMin: weather.tempC,
    tempMax: weather.tempC,
    wind: weather.windSpeed,
    windDir: 0,
    humidity: 60,
    visibility: 10000,
    precipitation: 0,
    pressure: 1015,
  }) : 0), [weather]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Today</Text>

      <Animated.View
        style={[
          styles.card,
          {
            transform: [
              {
                scale: scaleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }),
              },
            ],
          },
        ]}
      >
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Loading weather…</Text>
          </View>
        ) : errorMsg ? (
          <Text style={styles.errorText}>{errorMsg}</Text>
        ) : weather ? (
          <View style={styles.weatherRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tempText}>{weather.tempC}°C</Text>
              <View style={styles.condRow}>
                <Ionicons
                  name={
                    weather.condition === "sunny"
                      ? "sunny-outline"
                      : weather.condition === "cloudy"
                        ? "cloud-outline"
                        : weather.condition === "rainy"
                          ? "rainy-outline"
                          : "partly-sunny-outline"
                  }
                  size={20}
                  color={
                    weather.condition === "sunny"
                      ? "#ffc400ff"
                      : weather.condition === "cloudy"
                        ? "#64748b"
                        : weather.condition === "rainy"
                          ? "#38bdf8"
                          : "#fbbf24"
                  }
                />
                <Text style={styles.condText}>
                  {weather.condition.charAt(0).toUpperCase() + weather.condition.slice(1)}
                </Text>
                <Text style={styles.dot}>•</Text>
                <Ionicons name="leaf-outline" size={18} color="#06ae44ff" />
                <Text style={styles.condText}>{weather.windSpeed} m/s</Text>
              </View>
            </View>
            <View style={styles.suitabilityBox}>
              <Text style={styles.suitabilityValue}>{suitability}%</Text>
              <Text style={styles.suitabilityLabel}>ride score</Text>
            </View>
          </View>
        ) : null}
      </Animated.View>

      <View style={styles.mapWrapper}>
        {coords ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: coords.latitude,
              longitude: coords.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            showsUserLocation
          >
            <Marker coordinate={coords} />
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={{ color: "#64748b" }}>Awaiting location…</Text>
          </View>
        )}
      </View>
      <View style={{ height: 24 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingTop: Platform.select({ ios: 24, android: 24 }),
  },
  header: {
    fontSize: 34,
    fontWeight: "700",
    color: "#0f172a",
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: "#334155"
  },
  errorText: {
    color: "#ef4444"
  },
  weatherRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  tempText: {
    fontSize: 44,
    fontWeight: "800",
    color: "#0f172a"
  },
  condRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6
  },
  condText: {
    color: "#475569",
    fontSize: 14
  },
  dot: {
    color: "#94a3b8",
    marginHorizontal: 4
  },
  suitabilityBox: {
    width: 106,
    height: 106,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  suitabilityValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a"
  },
  suitabilityLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2
  },
  mapWrapper: {
    height: 500,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  map: {
    flex: 1,
    minHeight: 180,
    borderRadius: 20,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
});