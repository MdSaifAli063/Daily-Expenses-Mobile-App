import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';
import { LedgerBackground } from '../components/LedgerBackground';

function RootNavigation() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const initialLaunchHandled = React.useRef(false);

  useEffect(() => {
    if (loading) return;

    const currentSegment = segments[0] as string | undefined;
    const isPublicRoute =
      currentSegment === 'welcome' ||
      !currentSegment ||
      currentSegment === 'register';

    if (session) {
      // Authenticated user trying to access public screens (/welcome, /, /register) -> redirect to /home
      if (isPublicRoute) {
        router.replace('/home');
      }
    } else {
      // Unauthenticated user
      if (!initialLaunchHandled.current && !currentSegment) {
        // Cold start at root / -> redirect to /welcome
        initialLaunchHandled.current = true;
        router.replace('/welcome');
      } else if (!isPublicRoute) {
        // Unauthenticated user trying to access protected screens -> redirect to /welcome
        router.replace('/welcome');
      }
    }
  }, [session, loading, segments, router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LedgerBackground />
        <ActivityIndicator size="large" color={Colors.accentGreen} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <RootNavigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
