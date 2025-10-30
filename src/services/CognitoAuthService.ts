// CognitoAuthService - COMPLETO
class CognitoAuthService {
  private config = {
    userPoolId: 'eu-west-3_lHUi9pWBS',
    clientId: '5ih9lsr8cv6gpvtblpar1sndf3',
    region: 'eu-west-3'
  };

  constructor() {
    console.log('🔧 CognitoAuthService inicializado con configuración real');
    console.log('📋 User Pool:', this.config.userPoolId);
    console.log('🔑 Client ID:', this.config.clientId);
    console.log('🌍 Region:', this.config.region);
  }

  async signIn(email: string, password: string): Promise<any> {
    console.log('🔐 Iniciando login con Cognito real...', email);
    
    // Validar dominio Amazon
    const amazonDomains = [
      '@amazon.com', '@amazon.co.uk', '@amazon.de', 
      '@amazon.fr', '@amazon.es', '@amazon.it',
      '@amazon.ca', '@amazon.com.au', '@amazon.co.jp'
    ];
    
    const isAmazonEmail = amazonDomains.some(domain => email.endsWith(domain));
    if (!isAmazonEmail) {
      throw new Error('Solo empleados de Amazon pueden acceder. Usa tu email corporativo (@amazon.com)');
    }
    
    try {
      const response = await fetch(`https://cognito-idp.${this.config.region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
          'X-Amz-User-Agent': 'aws-amplify/5.0.0'
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

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Error response from Cognito:', result);
        
        // Manejar errores específicos de Cognito
        switch (result.__type) {
          case 'NotAuthorizedException':
            throw new Error('Email o contraseña incorrectos');
          case 'UserNotConfirmedException':
            throw new Error('Usuario no confirmado. Revisa tu email para el código de verificación');
          case 'UserNotFoundException':
            throw new Error('Usuario no encontrado. ¿Te has registrado?');
          case 'TooManyRequestsException':
            throw new Error('Demasiados intentos. Espera un momento antes de intentar de nuevo');
          case 'InvalidParameterException':
            throw new Error('Parámetros inválidos. Verifica tu email y contraseña');
          case 'ResourceNotFoundException':
            throw new Error('Configuración de autenticación no encontrada');
          default:
            throw new Error(result.message || result.__type || 'Error al iniciar sesión');
        }
      }

      console.log('✅ Login exitoso con Cognito real');
      console.log('🎫 Tokens obtenidos:', {
        hasAccessToken: !!result.AuthenticationResult?.AccessToken,
        hasIdToken: !!result.AuthenticationResult?.IdToken,
        hasRefreshToken: !!result.AuthenticationResult?.RefreshToken
      });
      
      // Decodificar información del usuario del ID token
      let userInfo = {
        email: email,
        alias: email.split('@')[0],
        name: email.split('@')[0]
      };

      if (result.AuthenticationResult?.IdToken) {
        try {
          const decodedToken = this.decodeJWT(result.AuthenticationResult.IdToken);
          userInfo = {
            email: decodedToken.email || email,
            alias: decodedToken.preferred_username || decodedToken['cognito:username'] || email.split('@')[0],
            name: decodedToken.name || decodedToken.preferred_username || email.split('@')[0]
          };
          console.log('👤 Información del usuario decodificada:', userInfo);
        } catch (decodeError) {
          console.warn('⚠️ No se pudo decodificar el token, usando datos básicos');
        }
      }
      
      return {
        AuthenticationResult: result.AuthenticationResult,
        user: userInfo
      };
    } catch (error) {
      if (error.message) {
        throw error; // Re-throw errors we've already handled
      }
      
      console.error('❌ Error de red o conexión:', error);
      throw new Error('Error de conexión. Verifica tu conexión a internet y vuelve a intentar');
    }
  }

  async signUp(email: string, password: string, username: string): Promise<any> {
    console.log('📝 Iniciando registro con Cognito real...', email);
    
    // Validar dominio Amazon
    const amazonDomains = [
      '@amazon.com', '@amazon.co.uk', '@amazon.de', 
      '@amazon.fr', '@amazon.es', '@amazon.it',
      '@amazon.ca', '@amazon.com.au', '@amazon.co.jp'
    ];
    
    const isAmazonEmail = amazonDomains.some(domain => email.endsWith(domain));
    if (!isAmazonEmail) {
      throw new Error('Solo empleados de Amazon pueden registrarse. Usa tu email corporativo (@amazon.com)');
    }

    // Validar contraseña
    if (password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }
    
    try {
      const response = await fetch(`https://cognito-idp.${this.config.region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.SignUp',
          'X-Amz-User-Agent': 'aws-amplify/5.0.0'
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

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Error response from Cognito SignUp:', result);
        
        // Manejar errores específicos de registro
        switch (result.__type) {
          case 'UsernameExistsException':
            throw new Error('Este email ya está registrado. ¿Quieres iniciar sesión?');
          case 'InvalidPasswordException':
            throw new Error('Contraseña inválida. Debe tener al menos 8 caracteres con mayúsculas, minúsculas y números');
          case 'InvalidParameterException':
            throw new Error('Parámetros inválidos. Verifica tu email y contraseña');
          case 'TooManyRequestsException':
            throw new Error('Demasiados intentos. Espera un momento antes de intentar de nuevo');
          case 'LimitExceededException':
            throw new Error('Límite de intentos excedido. Intenta más tarde');
          default:
            throw new Error(result.message || result.__type || 'Error al registrarse');
        }
      }

      console.log('✅ Usuario registrado exitosamente en Cognito real');
      console.log('📧 Código de confirmación enviado a:', email);
      
      return {
        UserSub: result.UserSub,
        CodeDeliveryDetails: result.CodeDeliveryDetails || {
          Destination: email,
          DeliveryMedium: 'EMAIL'
        }
      };
    } catch (error) {
      if (error.message) {
        throw error; // Re-throw errors we've already handled
      }
      
      console.error('❌ Error de red en registro:', error);
      throw new Error('Error de conexión durante el registro. Verifica tu conexión a internet');
    }
  }

  async confirmSignUp(email: string, code: string): Promise<any> {
    console.log('✉️ Confirmando registro en Cognito real...', email);
    
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      throw new Error('El código debe ser de 6 dígitos numéricos');
    }
    
    try {
      const response = await fetch(`https://cognito-idp.${this.config.region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.ConfirmSignUp',
          'X-Amz-User-Agent': 'aws-amplify/5.0.0'
        },
        body: JSON.stringify({
          ClientId: this.config.clientId,
          Username: email,
          ConfirmationCode: code,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Error response from Cognito ConfirmSignUp:', result);
        
        // Manejar errores específicos de confirmación
        switch (result.__type) {
          case 'CodeMismatchException':
            throw new Error('Código incorrecto. Verifica el código enviado a tu email');
          case 'ExpiredCodeException':
            throw new Error('El código ha expirado. Solicita un nuevo código');
          case 'UserNotFoundException':
            throw new Error('Usuario no encontrado. ¿Te registraste correctamente?');
          case 'NotAuthorizedException':
            throw new Error('Usuario ya confirmado o código inválido');
          case 'TooManyFailedAttemptsException':
            throw new Error('Demasiados intentos fallidos. Espera antes de intentar de nuevo');
          case 'LimitExceededException':
            throw new Error('Límite de intentos excedido. Intenta más tarde');
          default:
            throw new Error(result.message || result.__type || 'Error al confirmar registro');
        }
      }

      console.log('✅ Registro confirmado exitosamente en Cognito real');
      return result;
    } catch (error) {
      if (error.message) {
        throw error; // Re-throw errors we've already handled
      }
      
      console.error('❌ Error de red en confirmación:', error);
      throw new Error('Error de conexión durante la confirmación. Verifica tu conexión a internet');
    }
  }

  async resendConfirmationCode(email: string): Promise<any> {
    console.log('🔄 Reenviando código de confirmación...', email);
    
    try {
      const response = await fetch(`https://cognito-idp.${this.config.region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.ResendConfirmationCode',
          'X-Amz-User-Agent': 'aws-amplify/5.0.0'
        },
        body: JSON.stringify({
          ClientId: this.config.clientId,
          Username: email,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Error reenviando código:', result);
        throw new Error(result.message || 'Error reenviando código de confirmación');
      }

      console.log('✅ Código de confirmación reenviado');
      return result;
    } catch (error) {
      console.error('❌ Error reenviando código:', error);
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<any> {
    console.log('🔑 Iniciando recuperación de contraseña...', email);
    
    try {
      const response = await fetch(`https://cognito-idp.${this.config.region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.ForgotPassword',
          'X-Amz-User-Agent': 'aws-amplify/5.0.0'
        },
        body: JSON.stringify({
          ClientId: this.config.clientId,
          Username: email,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Error en recuperación de contraseña:', result);
        throw new Error(result.message || 'Error al solicitar recuperación de contraseña');
      }

      console.log('✅ Código de recuperación enviado');
      return result;
    } catch (error) {
      console.error('❌ Error en recuperación de contraseña:', error);
      throw error;
    }
  }

  async confirmForgotPassword(email: string, code: string, newPassword: string): Promise<any> {
    console.log('🔐 Confirmando nueva contraseña...', email);
    
    try {
      const response = await fetch(`https://cognito-idp.${this.config.region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.ConfirmForgotPassword',
          'X-Amz-User-Agent': 'aws-amplify/5.0.0'
        },
        body: JSON.stringify({
          ClientId: this.config.clientId,
          Username: email,
          ConfirmationCode: code,
          Password: newPassword,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Error confirmando nueva contraseña:', result);
        throw new Error(result.message || 'Error al confirmar nueva contraseña');
      }

      console.log('✅ Contraseña actualizada exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error confirmando nueva contraseña:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
    console.log('🔄 Renovando tokens...');
    
    try {
      const response = await fetch(`https://cognito-idp.${this.config.region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
          'X-Amz-User-Agent': 'aws-amplify/5.0.0'
        },
        body: JSON.stringify({
          ClientId: this.config.clientId,
          AuthFlow: 'REFRESH_TOKEN_AUTH',
          AuthParameters: {
            REFRESH_TOKEN: refreshToken,
          },
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Error renovando tokens:', result);
        throw new Error('Sesión expirada. Por favor inicia sesión de nuevo');
      }

      console.log('✅ Tokens renovados exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error renovando tokens:', error);
      throw error;
    }
  }

  async signOut(accessToken: string): Promise<void> {
    console.log('🚪 Cerrando sesión en Cognito...');
    
    try {
      const response = await fetch(`https://cognito-idp.${this.config.region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.GlobalSignOut',
          'X-Amz-User-Agent': 'aws-amplify/5.0.0'
        },
        body: JSON.stringify({
          AccessToken: accessToken,
        }),
      });

      if (response.ok) {
        console.log('✅ Sesión cerrada en Cognito');
      } else {
        console.warn('⚠️ Error cerrando sesión en servidor, pero continuando con logout local');
      }
    } catch (error) {
      console.warn('⚠️ Error cerrando sesión en servidor:', error);
    }
  }

  // Utilidades privadas
  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decodificando JWT:', error);
      throw new Error('Token JWT inválido');
    }
  }

  // Método para obtener información del usuario actual
  getCurrentUser(accessToken: string): Promise<any> {
    console.log('👤 Obteniendo información del usuario actual...');
    
    return fetch(`https://cognito-idp.${this.config.region}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.GetUser',
        'X-Amz-User-Agent': 'aws-amplify/5.0.0'
      },
      body: JSON.stringify({
        AccessToken: accessToken,
      }),
    })
    .then(response => response.json())
    .then(result => {
      if (result.Username) {
        console.log('✅ Información del usuario obtenida');
        return result;
      } else {
        throw new Error('Error obteniendo información del usuario');
      }
    });
  }

  // Método para verificar si el servicio está configurado correctamente
  isConfigured(): boolean {
    return !!(this.config.userPoolId && this.config.clientId && this.config.region);
  }

  // Método para obtener la configuración actual
  getConfig() {
    return {
      userPoolId: this.config.userPoolId,
      clientId: this.config.clientId,
      region: this.config.region
    };
  }
}

// Crear instancia del servicio
const cognitoAuthService = new CognitoAuthService();

// Exportar para uso en otros archivos
export { CognitoAuthService, cognitoAuthService };
