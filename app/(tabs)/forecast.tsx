import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Platform, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { calcSuitability, fetch7Day, ForecastItem } from "../../shared/weatherApi";

export default function ForecastScreen() {
  const [items, setItems] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const renderItem = ({ item }: { item: ForecastItem }) => {
    const suitability = calcSuitability(item);
    let percentColor = '#06ae44ff';
    if (suitability <= 75) percentColor = '#ffc400ff';
    if (suitability <= 50) percentColor = '#fb923c';
    if (suitability <= 25) percentColor = '#ef4444';

    return (
      <SafeAreaView style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.weekday}>{item.weekday}</Text>
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
                  ? "#facc15" // yellow
                  : item.condition === "cloudy"
                    ? "#64748b" // gray
                    : item.condition === "rainy"
                      ? "#38bdf8" // blue
                      : "#fbbf24" // partly sunny - orange/yellow
              }
            />
            <Text style={styles.meta}>{item.tempC}°C</Text>
            <Text style={styles.dot}>•</Text>
            <Ionicons name="leaf-outline" size={18} color="#06ae44ff" />
            <Text style={styles.meta}>{item.wind} м/с</Text>
            <Text style={styles.dot}>•</Text>
            <Ionicons name="water-outline" size={18} color="#3b82f6" />
            <Text style={styles.meta}>{item.humidity}%</Text>
          </View>
        </View>
        <View style={styles.suitabilityBox}>
          <Text style={[styles.suitabilityValue, { color: percentColor }]}>{suitability}%</Text>
          <Text style={styles.suitabilityLabel}>ride</Text>
        </View>
      </SafeAreaView>
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 28,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  weekday: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    marginLeft: 12,
  },
  condRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    marginLeft: 12,
  },
  meta: {
    color: "#475569"
  },
  suitabilityBox: {
    width: 110,
    height: 110,
    borderRadius: 22,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  suitabilityValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0f172a"
  },
  suitabilityLabel: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 2
  },
  dot: {
    color: "#94a3b8",
    marginHorizontal: 1,
  },
});