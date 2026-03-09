// import { StatusBar } from 'expo-status-bar';
// import { StyleSheet, Text, View } from 'react-native';

// export default function App() {
//   return (
//     <View style={styles.container}>
//       <Text>Open up App.js to start working on your app!</Text>
//       <StatusBar style="auto" />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });

import * as React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import AppNav from './AppNav';


// const Stack = createNativeStackNavigator();

function App() {
  return (
    <AuthProvider>

      <AppNav />

    </AuthProvider>
  );
}

export default App;