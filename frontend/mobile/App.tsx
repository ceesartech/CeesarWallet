import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { LinearGradient } from 'react-native-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
// import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
// AWS Amplify imports (commented out for now)
// import { Amplify } from 'aws-amplify';
// import { Authenticator } from '@aws-amplify/ui-react-native';

// Import screens
import DashboardScreen from './src/screens/DashboardScreen';
import TradingScreen from './src/screens/TradingScreen';
import PortfolioScreen from './src/screens/PortfolioScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LoginScreen from './src/screens/LoginScreen';

// Import store
import { store } from './src/store';

// Import AWS configuration (commented out for now)
// import awsconfig from './aws-exports';

// Configure Amplify (commented out for now)
// Amplify.configure(awsconfig);

// Keep the splash screen visible while we fetch resources (commented out for now)
// SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Custom tab bar component
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  return (
    <View style={styles.tabBar}>
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={styles.tabBarGradient}
      >
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const getIconName = (routeName: string) => {
            switch (routeName) {
              case 'Dashboard':
                return isFocused ? 'home' : 'home-outline';
              case 'Trading':
                return isFocused ? 'trending-up' : 'trending-up-outline';
              case 'Portfolio':
                return isFocused ? 'pie-chart' : 'pie-chart-outline';
              case 'Settings':
                return isFocused ? 'settings' : 'settings-outline';
              default:
                return 'home';
            }
          };

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tabItem}
            >
              <Ionicons
                name={getIconName(route.name)}
                size={24}
                color={isFocused ? '#00d4aa' : '#666666'}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isFocused ? '#00d4aa' : '#666666' }
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </LinearGradient>
    </View>
  );
};

// Main Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Trading"
        component={TradingScreen}
        options={{
          tabBarLabel: 'Trading',
        }}
      />
      <Tab.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{
          tabBarLabel: 'Portfolio',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

// Main App Component
const App = () => {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts (commented out for now - will use system fonts)
        // await Font.loadAsync({
        //   'Roboto': require('./assets/fonts/Roboto-Regular.ttf'),
        //   'Roboto-Bold': require('./assets/fonts/Roboto-Bold.ttf'),
        //   'Roboto-Medium': require('./assets/fonts/Roboto-Medium.ttf'),
        // });

        // Check authentication status
        // This would typically check with AWS Cognito
        // For now, we'll simulate a check
        setTimeout(() => {
          // Check if user has previously logged in (simulate persistent auth)
          const hasStoredAuth = false; // This would check AsyncStorage or similar
          setIsAuthenticated(hasStoredAuth);
          setIsReady(true);
        }, 1000); // Reduced loading time for better UX
      } catch (e) {
        console.warn(e);
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  // Function to handle successful authentication
  const handleAuthenticationSuccess = () => {
    setIsAuthenticated(true);
  };

  // Function to handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  useEffect(() => {
    if (isReady) {
      // SplashScreen.hideAsync(); // Commented out for now
    }
  }, [isReady]);

  if (!isReady) {
    return (
      <View style={styles.splashContainer}>
        <LinearGradient
          colors={['#1a1a1a', '#2d2d2d']}
          style={styles.splashGradient}
        >
          <Text style={styles.splashTitle}>CeesarWallet</Text>
          <Text style={styles.splashSubtitle}>Automated Trading Platform</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <Provider store={store}>
      <PaperProvider>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <SafeAreaView style={styles.container}>
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
              }}
            >
              {isAuthenticated ? (
                <Stack.Screen name="Main" component={MainTabNavigator} />
              ) : (
                <Stack.Screen name="Login">
                  {(props) => <LoginScreen {...props} onAuthenticationSuccess={handleAuthenticationSuccess} />}
                </Stack.Screen>
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaView>
      </PaperProvider>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  splashGradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00d4aa',
    marginBottom: 8,
  },
  splashSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    paddingBottom: 20,
  },
  tabBarGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});

export default App;
