import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Platform, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { calcSuitability, fetch7Day, fetchCurrentWeather, ForecastItem, WeatherNow } from "../../shared/weatherApi";
import { Coordinates } from "./today";

export default function ForecastScreen() {
  const [items, setItems] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherNow | null>(null);


  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Location permission denied");
          setLoading(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        const days = await fetch7Day(loc.coords.latitude, loc.coords.longitude);
        setItems(days);
      } catch (e: any) {
        setError(e?.message ?? "Failed to fetch forecast");
      } finally {
        setLoading(false);
      }
    })();
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

        const w = await fetchCurrentWeather(c.latitude, c.longitude);
        setWeather(w);
      } catch (e: any) {
        setErrorMsg(e?.message ?? "Failed to fetch location/weather");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const renderItem = ({ item }: { item: ForecastItem }) => {
    const suitability = calcSuitability(item);
    let percentColor = '#06ae44ff';
    if (suitability <= 75) percentColor = '#ffc400ff';
    if (suitability <= 50) percentColor = '#fb923c';
    if (suitability <= 25) percentColor = '#ef4444';
    return (
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.tempText}>{item.tempC}°C</Text>
          <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()}</Text>
          <View style={styles.condRow}>
            <Ionicons name={
              item.condition === "sunny"
                ? "sunny-outline"
                : item.condition === "cloudy"
                  ? "cloud-outline"
                  : item.condition === "rainy"
                    ? "rainy-outline"
                    : "partly-sunny-outline"
            }
              size={20}
              color={
                item.condition === "sunny"
                  ? "#ffc400ff"
                  : item.condition === "cloudy"
                    ? "#64748b"
                    : item.condition === "rainy"
                      ? "#38bdf8"
                      : "#fbbf24"
              }
            />
            <Text style={styles.condText}>
              {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
            </Text>
            <Text style={styles.dot}>•</Text>
            <Ionicons name="leaf-outline" size={18} color="#06ae44ff" />
            <Text style={styles.condText}>{item.wind} m/s</Text>
            <Text style={styles.dot}>•</Text>
            <Ionicons name="water-outline" size={18} color="#3b82f6" />
            <Text style={styles.condText}>{item.humidity}%</Text>

          </View>
        </View>
        <View style={styles.suitabilityBox}>
          <Text style={[styles.suitabilityValue, { color: percentColor }]}>{suitability}%</Text>
          <Text style={styles.suitabilityLabel}>ride score</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>7-Day Forecast</Text>
      {loading ? (
        <View style={{ paddingHorizontal: 20 }}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <Text style={{ color: "#ef4444", paddingHorizontal: 20 }}>{error}</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.date}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
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
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
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
    marginHorizontal: 1
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
  dateText: {
    color: "#64748b",
    fontSize: 16,
    marginTop: 2,
    marginBottom: 4,
  },
});