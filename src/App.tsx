import @aws-amplify/ui-react/styles.css;

import React, { useState, useEffect } from react;

import { Amplify, Auth, Hub } from aws-amplify;

import awsconfig from ./aws-exports.js;

import {

  Button,

  View,

  Card,

} from @aws-amplify/ui-react;

awsconfig.oauth.redirectSignIn = `${window.location.origin}/`;

awsconfig.oauth.redirectSignOut = `${window.location.origin}/`;

Amplify.configure(awsconfig);

function App() {
  // Amazon Federate Midway athentication
  const [user, setUser] = useState(null);
  // getUser function
  function getUser() {
    return Auth.currentAuthenticatedUser()
      .then((userData) => userData)
      .catch(() => console.log("Not signed in"));
  }

  // Use effect for auth
  useEffect(() => {
    Hub.listen("auth", ({ payload: { event, data } }) => {
      switch (event) {
        case "signIn":
          console.log(event);
          console.log(data);
          getUser().then((userData) => setUser(userData));
          console.log(user);
          break;
        case "signOut":
          setUser(null);
          break;
        case "signIn_failure":
          console.log("Sign in failure", data);
          break;
      }
    });
    getUser().then((userData) => setUser(userData));
  }, []);
  return (
    <View className='App'>
      <Card>
        <Button onClick={() => Auth.federatedSignIn({customProvider: 'FederateOIDC'})}>Login</Button>
      </Card>
    </View>
  );
}

export default App;
