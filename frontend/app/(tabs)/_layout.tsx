import { Tabs } from "expo-router";
import { Text } from "react-native";

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6 }}>
      {emoji}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#1E293B",
          borderTopColor: "#334155",
        },
        tabBarActiveTintColor: "#38BDF8",
        tabBarInactiveTintColor: "#94A3B8",
        headerStyle: { backgroundColor: "#0F172A" },
        headerTintColor: "#F1F5F9",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "ダッシュボード",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📈" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "銘柄検索",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔍" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: "ウォッチリスト",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⭐" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: "ニュース",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📰" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
