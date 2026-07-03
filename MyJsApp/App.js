import React, { useContext } from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';
import { Home, BarChart2, Hospital, Settings } from 'lucide-react-native';

import HomeScreen         from './screens/HomeScreen';
import RecordScreen       from './screens/RecordScreen';
import ResultScreen       from './screens/ResultScreen';
import SurveyScreen       from './screens/SurveyScreen';
import SettingsScreen     from './screens/SettingsScreen';
import LoginScreen        from './screens/LoginScreen';
import SignUpScreen       from './screens/SignUpScreen';
import HospitalScreen     from './screens/HospitalScreen';
import ResultExportScreen from './screens/ResultExportScreen';
import AccuracyTestScreen from './screens/AccuracyTestScreen';
import SummaryScreen      from './screens/SummaryScreen';
import ModelDebugScreen   from './screens/ModelDebugScreen';

import { AuthProvider, AuthContext } from './AuthContext';
import { useTheme, radius } from './utils/theme';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"  component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain"     component={HomeScreen} />
      <Stack.Screen name="Record"       component={RecordScreen} />
      <Stack.Screen name="Survey"       component={SurveyScreen} />
      <Stack.Screen name="Result"       component={ResultScreen} />
      <Stack.Screen name="ResultExport" component={ResultExportScreen} />
      <Stack.Screen name="AccuracyTest" component={AccuracyTestScreen} />
      <Stack.Screen name="ModelDebug"   component={ModelDebugScreen} />
    </Stack.Navigator>
  );
}

function SummaryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SummaryMain"  component={SummaryScreen} />
      <Stack.Screen name="ResultExport" component={ResultExportScreen} />
      <Stack.Screen name="Result"       component={ResultScreen} />
      <Stack.Screen name="Record"       component={RecordScreen} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { isLoggedIn, authLoading } = useContext(AuthContext);
  const { colors, isDark }          = useTheme();

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const navTheme = isDark
    ? { ...DarkTheme,    colors: { ...DarkTheme.colors,    background: colors.bg, card: colors.surface, border: colors.border } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.surface, border: colors.border } };

  const floatTabBar = {
    position:        'absolute',
    bottom:          24,
    left:            20,
    right:           20,
    height:          72,
    borderRadius:    radius.xl,
    backgroundColor: colors.tabBar,
    borderTopWidth:  0,
    paddingBottom:   10,
    paddingTop:      4,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 8 },
    shadowOpacity:   isDark ? 0.4 : 0.15,
    shadowRadius:    20,
    elevation:       16,
  };

  return (
    <NavigationContainer theme={navTheme}>
      {isLoggedIn ? (
        <Tab.Navigator
          id="RootTabs"
          screenOptions={{
            headerShown:             false,
            tabBarStyle:             floatTabBar,
            tabBarActiveTintColor:   colors.tabActive,
            tabBarInactiveTintColor: colors.tabInactive,
            tabBarLabelStyle:        { fontSize: 11, fontWeight: '600', marginTop: -2 },
            tabBarItemStyle:         { paddingTop: 8 },
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeStack}
            options={{
              tabBarLabel: 'หน้าหลัก',
              tabBarIcon: ({ color, size }) => <Home color={color} size={size ?? 22} strokeWidth={2} />,
            }}
          />
          <Tab.Screen
            name="Summary"
            component={SummaryStack}
            options={{
              tabBarLabel: 'สรุปผล',
              tabBarIcon: ({ color, size }) => <BarChart2 color={color} size={size ?? 22} strokeWidth={2} />,
            }}
          />
          <Tab.Screen
            name="โรงพยาบาล"
            component={HospitalScreen}
            options={{
              tabBarLabel: 'โรงพยาบาล',
              tabBarIcon: ({ color, size }) => <Hospital color={color} size={size ?? 22} strokeWidth={2} />,
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              tabBarLabel: 'ตั้งค่า',
              tabBarIcon: ({ color, size }) => <Settings color={color} size={size ?? 22} strokeWidth={2} />,
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