import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CeesarTrader Mobile</Text>
      <Text style={styles.subtitle}>Mobile App is Working!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00d4aa',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
  },
});
