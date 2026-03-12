import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useWatchlistStore } from "../store/watchlistStore";

export default function RootLayout() {
  const load = useWatchlistStore((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0F172A" },
          headerTintColor: "#F1F5F9",
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: "#0F172A" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="stock/[symbol]"
          options={{ title: "銘柄詳細", headerBackTitle: "戻る" }}
        />
      </Stack>
    </>
  );
}
