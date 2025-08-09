import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { fetchCurrentWeather } from "../../shared/weatherApi";
type RideEntry = {
  startedAt: string;
  durationSec: number;
  tempC: number;
  condition: string;
  windSpeed: number;
  humidity: number;
};

const STORAGE_KEY = "ridecast.history";

export default function RidesScreen() {
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<RideEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [isRiding, setIsRiding] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rideStartTime = useRef<Date | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setHistory(JSON.parse(raw));
      } catch { }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (isRiding) {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRiding]);

  const startRide = () => {
    setIsRiding(true);
    setSeconds(0);
    rideStartTime.current = new Date();
  };

  const stopRide = async () => {
    setIsRiding(false);
    setSaving(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Location permission is needed to save a ride");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const w = await fetchCurrentWeather(loc.coords.latitude, loc.coords.longitude);
      const entry: RideEntry = {
        startedAt: rideStartTime.current?.toISOString() ?? new Date().toISOString(),
        durationSec: seconds,
        tempC: w.tempC,
        condition: w.condition,
        windSpeed: w.windSpeed,
        humidity: 60, // fetchCurrentWeather не повертає, ставимо середнє
      };
      const next = [entry, ...history].slice(0, 30);
      setHistory(next);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to save ride");
    } finally {
      setSaving(false);
      setSeconds(0);
    }
  };

  const handleDeleteRide = (idx: number) => {
    Alert.alert(
      "Delete ride",
      "Are you sure you want to delete this ride?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive",
          onPress: () => {
            const next = history.filter((_, i) => i !== idx);
            setHistory(next);
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>My Bike Ride</Text>

      <Pressable
        onPress={isRiding ? stopRide : startRide}
        style={({ pressed }) => [
          styles.button,
          { opacity: pressed || saving ? 0.8 : 1 },
        ]}
        disabled={saving}
      >
        <Text style={styles.buttonText}>
          {saving ? "Saving…" : isRiding ? "Stop Ride" : "Start Ride"}
        </Text>
      </Pressable>

      {isRiding && (
        <View style={styles.timerBox}>
          <Text style={styles.timerText}>
            {`${Math.floor(seconds / 60)
              .toString()
              .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`}
          </Text>
        </View>
      )}

      {history.length > 0 && (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          {history.map((ride, idx) => (
            <View style={styles.card} key={ride.startedAt + idx}>
              <Text style={styles.tempText}>{ride.tempC}°C</Text>
              <Text style={styles.dateText}>{new Date(ride.startedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</Text>
              <View style={styles.condRow}>
                <Text style={styles.condText}>{ride.condition.charAt(0).toUpperCase() + ride.condition.slice(1)}</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.condText}>Wind: {ride.windSpeed} m/s</Text>
              </View>
              <View style={styles.condRow2}>
                <Text style={styles.condText}>Humidity: {ride.humidity}%</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.condText}>Duration: {Math.floor(ride.durationSec / 60)}:{(ride.durationSec % 60).toString().padStart(2, "0")}</Text>
              </View>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteRide(idx)}>
                <Ionicons name="trash-outline" size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
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
    marginBottom: 12
  },
  button: {
    marginHorizontal: 16,
    backgroundColor: "#00ad5cff",
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
    marginTop: 4,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0ea5e9",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 18
  },
  card: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8
  },
  timerBox: {
    alignSelf: "center",
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: "#00ad5cff",
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  timerText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#F5F5F5",
    letterSpacing: 2,
  },
  tempText: {
    fontSize: 44,
    fontWeight: "800",
    color: "#0f172a"
  },
  dateText: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 2,
    marginBottom: 2,
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
  condRow2: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2
  },
  deleteBtn: {
    position: "absolute",
    right: 12,
    bottom: 12,
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    padding: 8,
    elevation: 2,
  },
});