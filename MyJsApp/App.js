// app.js
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import RecordScreen from './screens/RecordScreen';
import ResultScreen from './screens/ResultScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#1a1a2e' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'OSA Detect' }}
        />
        <Stack.Screen
          name="Record"
          component={RecordScreen}
          options={{ title: 'บันทึกการนอนหลับ' }}
        />
        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{ title: 'ผลการวิเคราะห์' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}