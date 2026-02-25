import { Stack } from "expo-router";
import { ThemeProvider } from "../context/ThemeContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="completion" options={{ headerShown: false }} />
        <Stack.Screen name="fields" options={{ headerShown: false }} />
        <Stack.Screen name="harvests" options={{ headerShown: false }} />
        <Stack.Screen name="pests" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}