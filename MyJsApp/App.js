import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View, ActivityIndicator } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import RecordScreen from './screens/RecordScreen';
import ResultScreen from './screens/ResultScreen';
import SurveyScreen from './screens/SurveyScreen';
import SettingsScreen from './screens/SettingsScreen';
import { AuthProvider, AuthContext } from './AuthContext';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import HospitalScreen from './screens/HospitalScreen';
import ResultExportScreen from './screens/ResultExportScreen';
import AccuracyTestScreen from './screens/AccuracyTestScreen';
import SummaryScreen from './screens/SummaryScreen';
import { colors, shadow } from './utils/theme';
import ModelDebugScreen from './screens/ModelDebugScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// --- Auth Stack ---
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

// --- Home Stack (Record flow: Home → Record → Survey → Result → ResultExport) ---
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Record" component={RecordScreen} />
      <Stack.Screen name="Survey" component={SurveyScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
      <Stack.Screen name="ResultExport" component={ResultExportScreen} />
      <Stack.Screen name="AccuracyTest" component={AccuracyTestScreen} />
      <Stack.Screen name="ModelDebug" component={ModelDebugScreen} />
    </Stack.Navigator>
  );
}

// --- Summary Stack: หน้าสรุปผลใหม่ (รองรับ daily/monthly history) ---
function SummaryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SummaryMain" component={SummaryScreen} />
      <Stack.Screen name="ResultExport" component={ResultExportScreen} />
    </Stack.Navigator>
  );
}

// --- Main App Navigator ---
function AppNavigator() {
  const { isLoggedIn, authLoading } = useContext(AuthContext);

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isLoggedIn ? (
        <Tab.Navigator
          id="RootTabs"
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              borderTopWidth: 1,
              height: 64,
              paddingBottom: 8,
              paddingTop: 8,
              ...shadow.card,
            },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.inkFaint,
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          }}
        >
          {/* Home tab (contains Record flow inside its stack) */}
          <Tab.Screen
            name="Home"
            component={HomeStack}
            options={{
              tabBarLabel: 'Home',
              tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text>,
            }}
          />

          {/* REMOVED: บันทึก/Record tab */}

          {/* Summary tab — now wrapped in SummaryStack so export works */}
          <Tab.Screen
            name="Summary"
            component={SummaryStack}
            options={{
              tabBarLabel: 'Summary',
              tabBarIcon: () => <Text style={{ fontSize: 20 }}>📊</Text>,
            }}
          />

          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              tabBarLabel: 'Settings',
              tabBarIcon: () => <Text style={{ fontSize: 20 }}>⚙️</Text>,
            }}
          />

          <Tab.Screen
            name="โรงพยาบาล"
            component={HospitalScreen}
            options={{
              tabBarLabel: 'Hospital',
              tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏥</Text>,
            }}
          />
        </Tab.Navigator>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}