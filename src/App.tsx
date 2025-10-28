import '@aws-amplify/ui-react/styles.css';
import React, { useState, useEffect } from 'react';
import { Amplify, Auth, Hub } from 'aws-amplify';
import awsconfig from './aws-exports.js';
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import {
  Button,
  View,
  Card,
} from '@aws-amplify/ui-react';

// Configuración de Amplify
awsconfig.oauth.redirectSignIn = `${window.location.origin}/`;
awsconfig.oauth.redirectSignOut = `${window.location.origin}/`;
Amplify.configure(awsconfig);

const client = generateClient<Schema>();

function App() {
  // Estados para autenticación
  const [user, setUser] = useState(null);
  // Estados para todos
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);

  // Función para obtener usuario
  function getUser() {
    return Auth.currentAuthenticatedUser()
      .then((userData) => userData)
      .catch(() => console.log("Not signed in"));
  }

  // Effect para autenticación
  useEffect(() => {
    Hub.listen("auth", ({ payload: { event, data } }) => {
      switch (event) {
        case "signIn":
          console.log(event);
          console.log(data);
          getUser().then((userData) => setUser(userData));
          break;
        case "signOut":
          setUser(null);
          setTodos([]); // Limpiar todos al cerrar sesión
          break;
        case "signIn_failure":
          console.log("Sign in failure", data);
          break;
      }
    });
    getUser().then((userData) => setUser(userData));
  }, []);

  // Effect para cargar todos (solo si está autenticado)
  useEffect(() => {
    if (user) {
      client.models.Todo.observeQuery().subscribe({
        next: (data) => setTodos([...data.items]),
      });
    }
  }, [user]);

  function createTodo() {
    if (user) {
      client.models.Todo.create({ content: window.prompt("Todo content") });
    }
  }

  function signOut() {
    Auth.signOut();
  }

  // Si no está autenticado, mostrar pantalla de login
  if (!user) {
    return (
      <View className='App'>
        <Card>
          <h1>Please sign in to access your todos</h1>
          <Button onClick={() => Auth.federatedSignIn({customProvider: 'FederateOIDC'})}>
            Login with Midway
          </Button>
        </Card>
      </View>
    );
  }

  // Si está autenticado, mostrar la aplicación de todos
  return (
    <main>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>My todos</h1>
        <Button onClick={signOut}>Sign Out</Button>
      </div>
      <button onClick={createTodo}>+ new</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.content}</li>
        ))}
      </ul>
      <div>
        🥳 App successfully hosted and authenticated with Midway!
      </div>
    </main>
  );
}

export default App;
