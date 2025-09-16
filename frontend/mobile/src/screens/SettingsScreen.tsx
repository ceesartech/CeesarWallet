import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card, Title, Paragraph, Button, Switch as PaperSwitch, List } from 'react-native-paper';

const SettingsScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  const [autoTradingEnabled, setAutoTradingEnabled] = useState(false);
  const [riskManagementEnabled, setRiskManagementEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: () => Alert.alert('Logged Out', 'You have been logged out successfully') },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. Are you sure you want to delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => Alert.alert('Account Deleted', 'Your account has been deleted') 
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your account and preferences</Text>
        </View>
      </LinearGradient>

      {/* Account Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Account</Title>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="person" size={24} color="#00d4aa" />
              <Text style={styles.settingText}>Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="shield-checkmark" size={24} color="#00d4aa" />
              <Text style={styles.settingText}>Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="card" size={24} color="#00d4aa" />
              <Text style={styles.settingText}>Payment Methods</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="document-text" size={24} color="#00d4aa" />
              <Text style={styles.settingText}>Documents</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {/* Trading Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Trading</Title>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="hardware-chip" size={24} color="#00d4aa" />
              <Text style={styles.settingText}>Auto Trading</Text>
            </View>
            <Switch
              value={autoTradingEnabled}
              onValueChange={setAutoTradingEnabled}
              trackColor={{ false: '#3d3d3d', true: '#00d4aa' }}
              thumbColor={autoTradingEnabled ? '#ffffff' : '#666666'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="shield" size={24} color="#00d4aa" />
              <Text style={styles.settingText}>Risk Management</Text>
            </View>
            <Switch
              value={riskManagementEnabled}
              onValueChange={setRiskManagementEnabled}
              trackColor={{ false: '#3d3d3d', true: '#00d4aa' }}
              thumbColor={riskManagementEnabled ? '#ffffff' : '#666666'}
            />
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="settings" size={24} color="#00d4aa" />
              <Text style={styles.settingText}>Trading Preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="analytics" size={24} color="#00d4aa" />
              <Text style={styles.settingText}>ML Model Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {/* App Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>App</Title>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={24} color="#00d4aa" />
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#3d3d3d', true: '#00d4aa' }}
              thumbColor={notificationsEnabled ? '#ffffff' : '#666666'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="finger-print" size={24} color="#00d4aa" />
              <Text style={styles.settingText}>Biometric Login</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: '#3d3d3d', true: '#00d4aa' }}
              thumbColor={biometricEnabled ? '#ffffff' : '#666666'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon" size={24} color="#00d4aa" />
              <Text style={styles.settingText}>Dark Mode</Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: '#3d3d3d', true: '#00d4aa' }}
              thumbColor={darkModeEnabled ? '#ffffff' : '#666666'}
            />
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="language" size={24} color="#00d4aa" />
              <Text style={styles.settingText}>Language</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>English</Text>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="globe" size={24} color="#00d4aa" />
              <Text style={styles.settingText}>Currency</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>USD</Text>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </View>
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {/* Support */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Support</Title>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="help-circle" size={24} color="#00d4aa" />
              <Text style={styles.settingText}>Help Center</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="chatbubble" size={24} color="#00d4aa" />
              <Text style={styles.settingText}>Contact Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="document-text" size={24} color="#00d4aa" />
              <Text style={styles.settingText}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="shield-checkmark" size={24} color="#00d4aa" />
              <Text style={styles.settingText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {/* About */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>About</Title>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle" size={24} color="#00d4aa" />
              <Text style={styles.settingText}>App Version</Text>
            </View>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="star" size={24} color="#00d4aa" />
              <Text style={styles.settingText}>Rate App</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="share" size={24} color="#00d4aa" />
              <Text style={styles.settingText}>Share App</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LinearGradient
            colors={['#ff6b6b', '#e74c3c']}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out" size={20} color="#ffffff" />
            <Text style={styles.logoutText}>Logout</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <LinearGradient
            colors={['#2d2d2d', '#1a1a1a']}
            style={styles.deleteGradient}
          >
            <Ionicons name="trash" size={20} color="#ff6b6b" />
            <Text style={styles.deleteText}>Delete Account</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.7,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#3d3d3d',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 15,
    fontWeight: '500',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.7,
    marginRight: 8,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  logoutButton: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  logoutGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteButton: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  deleteGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  deleteText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default SettingsScreen;
