import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import RecordScreen from './screens/RecordScreen';
import ResultScreen from './screens/ResultScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Record" component={RecordScreen} />
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
          tabBarStyle: {
            backgroundColor: '#0f172a',
            borderTopColor: '#1e293b',
          },
          tabBarActiveTintColor: '#38bdf8',
          tabBarInactiveTintColor: '#475569',
        }}
      >
        <Tab.Screen
          name="บันทึก"
          component={HomeStack}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🎙️</Text> }}
        />
        <Tab.Screen
          name="ผลลัพธ์"
          component={ResultScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📊</Text> }}
          initialParams={{ demo: true }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}