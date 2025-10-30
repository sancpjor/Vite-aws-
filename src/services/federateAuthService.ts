class FederateAuthService {
  private config = {
    userPoolId: 'eu-west-3_lHUi9pWBS',
    clientId: 'playzaz-federate-oidc',
    region: 'eu-west-3',
    domain: 'playzaz-federate.auth.eu-west-3.amazoncognito.com'
  };

  // Redirigir a Federate para login
  initiateLogin(): void {
    const authUrl = new URL(`https://${this.config.domain}/oauth2/authorize`);
    authUrl.searchParams.append('client_id', this.config.clientId);
    authUrl.searchParams.append('redirect_uri', window.location.origin + '/auth/callback');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'openid email profile');
    authUrl.searchParams.append('state', this.generateState());
    
    console.log('🚀 Redirigiendo a Federate:', authUrl.toString());
    window.location.href = authUrl.toString();
  }

  // Procesar callback de Federate
  async handleCallback(code: string, state: string): Promise<any> {
    console.log('🔄 Procesando callback de Federate...');
    
    try {
      // Intercambiar código por tokens
      const tokenResponse = await fetch(`https://${this.config.domain}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.config.clientId,
          code: code,
          redirect_uri: window.location.origin + '/auth/callback',
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${error}`);
      }

      const tokens = await tokenResponse.json();
      console.log('✅ Tokens obtenidos de Federate');
      
      // Decodificar JWT para obtener información del usuario
      const userInfo = this.decodeJWT(tokens.id_token);
      console.log('👤 Información del usuario:', userInfo);
      
      return {
        AuthenticationResult: tokens,
        user: {
          email: userInfo.email,
          alias: userInfo.preferred_username || userInfo.email?.split('@')[0],
          name: userInfo.name || userInfo.preferred_username,
          groups: userInfo['cognito:groups'] || []
        }
      };
    } catch (error) {
      console.error('❌ Error en callback de Federate:', error);
      throw error;
    }
  }

  // Login directo con usuario/contraseña (para desarrollo)
  async signInDirect(email: string, password: string): Promise<any> {
    console.log('🔐 Login directo con Cognito...');
    
    try {
      const response = await fetch(`https://cognito-idp.${this.config.region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
        },
        body: JSON.stringify({
          ClientId: this.config.clientId,
          AuthFlow: 'USER_PASSWORD_AUTH',
          AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al iniciar sesión');
      }

      const result = await response.json();
      console.log('✅ Login directo exitoso');
      
      return {
        AuthenticationResult: result.AuthenticationResult,
        user: {
          email: email,
          alias: email.split('@')[0],
          name: email.split('@')[0]
        }
      };
    } catch (error) {
      console.error('❌ Error en login directo:', error);
      throw error;
    }
  }

  // Registro de usuario
  async signUp(email: string, password: string, username: string): Promise<any> {
    console.log('📝 Registrando usuario en Cognito...');
    
    try {
      const response = await fetch(`https://cognito-idp.${this.config.region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.SignUp',
        },
        body: JSON.stringify({
          ClientId: this.config.clientId,
          Username: email,
          Password: password,
          UserAttributes: [
            { Name: 'email', Value: email },
            { Name: 'preferred_username', Value: username }
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al registr****');
      }

      const result = await response.json();
      console.log('✅ Usuario registrado, requiere confirmación');
      return result;
    } catch (error) {
      console.error('❌ Error en registro:', error);
      throw error;
    }
  }

  // Confirmar registro
  async confirmSignUp(email: string, code: string): Promise<any> {
    console.log('✉️ Confirmando registro...');
    
    try {
      const response = await fetch(`https://cognito-idp.${this.config.region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.ConfirmSignUp',
        },
        body: JSON.stringify({
          ClientId: this.config.clientId,
          Username: email,
          ConfirmationCode: code,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al confirmar registro');
      }

      console.log('✅ Registro confirmado');
      return await response.json();
    } catch (error) {
      console.error('❌ Error confirmando registro:', error);
      throw error;
    }
  }

  // Utilidades
  private generateState(): string {
    const state = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('federate_state', state);
    return state;
  }

  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decodificando JWT:', error);
      throw new Error('Invalid JWT token');
    }
  }
}

export const federateAuthService = new FederateAuthService();
