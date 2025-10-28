import { useEffect, useState } from "react";
import { Amplify, Auth, Hub } from 'aws-amplify';
import awsconfig from './aws-exports.js'; // Si tienes Amplify configurado
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import './App.css';

// Configuración de Amplify (si la tienes)
if (awsconfig) {
  awsconfig.oauth.redirectSignIn = `${window.location.origin}/`;
  awsconfig.oauth.redirectSignOut = `${window.location.origin}/`;
  Amplify.configure(awsconfig);
}

const client = generateClient<Schema>();

function App() {
  // Estados para autenticación
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Estados para todos (si los tienes)
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);

  // Función para obtener usuario
  function getUser() {
    return Auth.currentAuthenticatedUser()
      .then((userData) => userData)
      .catch(() => {
        console.log("Not signed in");
        return null;
      });
  }

  // Effect para autenticación
  useEffect(() => {
    Hub.listen("auth", ({ payload: { event, data } }) => {
      switch (event) {
        case "signIn":
          console.log('Sign in event:', event, data);
          getUser().then((userData) => {
            setUser(userData);
            setIsAuthenticated(true);
          });
          break;
        case "signOut":
          setUser(null);
          setIsAuthenticated(false);
          setTodos([]);
          break;
        case "signIn_failure":
          console.log("Sign in failure", data);
          break;
      }
    });
    
    // Verificar si ya hay usuario autenticado
    getUser().then((userData) => {
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
      }
    });
  }, []);

  // Effect para cargar todos (solo si está autenticado)
  useEffect(() => {
    if (isAuthenticated && user) {
      client.models.Todo.observeQuery().subscribe({
        next: (data) => setTodos([...data.items]),
      });
    }
  }, [isAuthenticated, user]);

  function createTodo() {
    if (isAuthenticated) {
      const content = window.prompt("Todo content");
      if (content) {
        client.models.Todo.create({ content });
      }
    }
  }

  function signOut() {
    Auth.signOut();
  }

  function loginWithMidway() {
    Auth.federatedSignIn({customProvider: 'FederateOIDC'});
  }

  // Si no está autenticado, mostrar pantalla de login
  if (!isAuthenticated) {
    return (
      <div className="app-container">
        <div className="auth-card">
          <h1>🏆 ZAZ Football Tickets</h1>
          <p>Competencia de Entradas para AWS Builders</p>
          <div className="auth-section">
            <h2>🔐 Autenticación requerida</h2>
            <p>Inicia sesión con tu cuenta Amazon para acceder</p>
            <button className="btn-primary" onClick={loginWithMidway}>
              🔑 Iniciar Sesión con Midway
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si está autenticado, mostrar la aplicación
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="user-info">
          <span>👋 Hola, {user?.username || 'Usuario'}</span>
          <button className="btn-secondary" onClick={signOut}>
            🚪 Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="main-content">
        <h1>🎫 Mis Todos - ZAZ Football</h1>
        <button className="btn-primary" onClick={createTodo}>
          + Nuevo Todo
        </button>
        
        <ul className="todos-list">
          {todos.map((todo) => (
            <li key={todo.id} className="todo-item">
              {todo.content}
            </li>
          ))}
        </ul>
        
        <div className="success-message">
          🥳 App con Midway funcionando correctamente!
        </div>
      </main>
    </div>
  );
}

export default App;
