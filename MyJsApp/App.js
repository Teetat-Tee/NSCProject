import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import RecordScreen from './screens/RecordScreen';
import ResultScreen from './screens/ResultScreen';
import SurveyScreen from './screens/SurveyScreen';
import SettingsScreen from './screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Record" component={RecordScreen} />
      <Stack.Screen name="Survey" component={SurveyScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: '#1e293b' },
          tabBarActiveTintColor: '#38bdf8',
          tabBarInactiveTintColor: '#475569',
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text>
          }}
        />
        <Tab.Screen
          name="บันทึก"
          component={RecordScreen}
          options={{
            tabBarLabel: 'Record',
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>🎙️</Text>
          }}
        />
        <Tab.Screen
          name="Summary"
          component={ResultScreen}
          options={{
            tabBarLabel: 'Summary',
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>📊</Text>
          }}
          initialParams={{ demo: true }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarLabel: 'Settings',
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>⚙️</Text>
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}