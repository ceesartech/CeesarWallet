import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card, Title, Paragraph, Button, TextInput as PaperTextInput } from 'react-native-paper';

interface LoginScreenProps {
  onAuthenticationSuccess: () => void;
}

const LoginScreen = ({ onAuthenticationSuccess }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Success', 'Login successful!', [
        {
          text: 'OK',
          onPress: () => {
            // Call the authentication success callback to navigate to main app
            onAuthenticationSuccess();
          }
        }
      ]);
    }, 1500); // Reduced time for better UX
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Success', 'Account created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Call the authentication success callback to navigate to main app
            onAuthenticationSuccess();
          }
        }
      ]);
    }, 1500); // Reduced time for better UX
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert('Social Login', `${provider} login would be implemented here`, [
      {
        text: 'OK',
        onPress: () => {
          // For demo purposes, simulate successful social login
          onAuthenticationSuccess();
        }
      }
    ]);
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset functionality would be implemented here');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#1a1a1a', '#2d2d2d']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.logo}>CeesarTrader</Text>
            <Text style={styles.subtitle}>Automated Trading Platform</Text>
            <Text style={styles.welcomeText}>
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </Text>
          </View>
        </LinearGradient>

        {/* Login Form */}
        <Card style={styles.formCard}>
          <Card.Content>
            <Title style={styles.formTitle}>
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Title>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#666666"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#666666"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#666666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {!isSignUp && (
              <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={isSignUp ? handleSignUp : handleLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#00d4aa', '#00b894']}
                style={styles.submitGradient}
              >
                {isLoading ? (
                  <Text style={styles.submitText}>Loading...</Text>
                ) : (
                  <Text style={styles.submitText}>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login */}
            <View style={styles.socialContainer}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin('Google')}
              >
                <LinearGradient
                  colors={['#4285f4', '#357ae8']}
                  style={styles.socialGradient}
                >
                  <Ionicons name="logo-google" size={20} color="#ffffff" />
                  <Text style={styles.socialText}>Google</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin('Apple')}
              >
                <LinearGradient
                  colors={['#000000', '#1a1a1a']}
                  style={styles.socialGradient}
                >
                  <Ionicons name="logo-apple" size={20} color="#ffffff" />
                  <Text style={styles.socialText}>Apple</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Toggle Sign Up/Sign In */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </Text>
              <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
                <Text style={styles.toggleLink}>
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* Features */}
        <Card style={styles.featuresCard}>
          <Card.Content>
            <Title style={styles.featuresTitle}>Why Choose CeesarTrader?</Title>
            
            <View style={styles.featureItem}>
              <Ionicons name="hardware-chip" size={24} color="#00d4aa" />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>AI-Powered Trading</Text>
                <Text style={styles.featureDescription}>
                  Advanced ML models for intelligent trading decisions
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark" size={24} color="#00d4aa" />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Real-Time Fraud Detection</Text>
                <Text style={styles.featureDescription}>
                  Protect your investments with advanced security
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="trending-up" size={24} color="#00d4aa" />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Professional Tools</Text>
                <Text style={styles.featureDescription}>
                  Access to institutional-grade trading tools
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00d4aa',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '500',
  },
  formCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
  },
  formTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#3d3d3d',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#4d4d4d',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3d3d3d',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4d4d4d',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#00d4aa',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#3d3d3d',
  },
  dividerText: {
    color: '#ffffff',
    opacity: 0.6,
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  socialButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  socialGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    color: '#ffffff',
    opacity: 0.7,
    fontSize: 14,
  },
  toggleLink: {
    color: '#00d4aa',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  featuresCard: {
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
  },
  featuresTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureContent: {
    flex: 1,
    marginLeft: 15,
  },
  featureTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    color: '#ffffff',
    opacity: 0.7,
    fontSize: 14,
  },
});

export default LoginScreen;
