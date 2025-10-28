import '@aws-amplify/ui-react/styles.css';
import React, { useState, useEffect } from 'react';
import { Amplify, Auth, Hub } from 'aws-amplify';
import awsconfig from './aws-exports.js';
import {
  Button,
  View,
  Card,
  Loader,
  Text
} from '@aws-amplify/ui-react';

awsconfig.oauth.redirectSignIn = `${window.location.origin}/`;
awsconfig.oauth.redirectSignOut = `${window.location.origin}/`;
Amplify.configure(awsconfig);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Función para obtener usuario
  function getUser() {
    return Auth.currentAuthenticatedUser()
      .then((userData) => userData)
      .catch(() => null);
  }

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const userData = await getUser();
      if (userData) {
        // Usuario ya autenticado
        setUser(userData);
        setLoading(false);
        setAuthChecked(true);
      } else {
        // No autenticado - redirigir inmediatamente a login
        setAuthChecked(true);
        Auth.federatedSignIn({customProvider: 'FederateOIDC'});
      }
    } catch (error) {
      console.log('Error checking auth:', error);
      setAuthChecked(true);
      // Forzar login si hay error
      Auth.federatedSignIn({customProvider: 'FederateOIDC'});
    }
  };

  // Listener para cambios de autenticación
  useEffect(() => {
    Hub.listen("auth", ({ payload: { event, data } }) => {
      switch (event) {
        case "signIn":
          console.log('User signed in:', data);
          getUser().then((userData) => {
            setUser(userData);
            setLoading(false);
          });
          break;
        case "signOut":
          setUser(null);
          setLoading(false);
          // Redirigir a login después de logout
          Auth.federatedSignIn({customProvider: 'FederateOIDC'});
          break;
        case "signIn_failure":
          console.log("Sign in failure", data);
          setLoading(false);
          break;
      }
    });
  }, []);

  // Mostrar loader mientras verifica autenticación
  if (!authChecked || loading) {
    return (
      <View className='App' style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column'
      }}>
        <Loader size="large" />
        <Text style={{marginTop: '20px'}}>
          Verificando acceso de Amazon...
        </Text>
      </View>
    );
  }

  // Si no hay usuario autenticado, no mostrar nada (ya se redirigió)
  if (!user) {
    return (
      <View className='App' style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <Text>Redirigiendo a autenticación...</Text>
      </View>
    );
  }

  // Usuario autenticado - mostrar la aplicación
  return (
    <View className='App'>
      <Card>
        <Text>¡Bienvenido, {user.attributes?.given_name}!</Text>
        <Text>Email: {user.attributes?.email}</Text>
        <Button onClick={() => Auth.signOut()}>
          Cerrar Sesión
        </Button>
        
        {/* Aquí va el contenido de tu aplicación */}
        <div style={{marginTop: '20px'}}>
          <h2>Tu aplicación interna aquí</h2>
          {/* Resto de tu contenido */}
        </div>
      </Card>
    </View>
  );
}

export default App;
