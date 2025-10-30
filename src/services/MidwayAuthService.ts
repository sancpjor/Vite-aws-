// MidwayAuthService - SERVICIO CON MIDWAY
class MidwayAuthService {
  private config = {
    midwayUrl: 'https://midway-auth.amazon.com',
    redirectUri: window.location.origin,
    clientId: 'zaz-football-quiz' // Tu app identifier
  };

  constructor() {
    console.log('🔧 MidwayAuthService inicializado');
    console.log('🌐 Midway URL:', this.config.midwayUrl);
    console.log('🔄 Redirect URI:', this.config.redirectUri);
  }

  // Redirigir a Midway para autenticación
  redirectToMidway(): void {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'openid profile email'
    });

    const midwayAuthUrl = `${this.config.midwayUrl}/oauth2/authorize?${params.toString()}`;
    console.log('🔐 Redirigiendo a Midway:', midwayAuthUrl);
    
    window.location.href = midwayAuthUrl;
  }

  // Procesar respuesta de Midway
  async handleMidwayCallback(): Promise<any> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      throw new Error(`Error de Midway: ${error}`);
    }

    if (!code) {
      throw new Error('No se recibió código de autorización de Midway');
    }

    console.log('✅ Código de autorización recibido de Midway');
    
    // Intercambiar código por tokens
    return await this.exchangeCodeForTokens(code);
  }

  // Intercambiar código por tokens
  private async exchangeCodeForTokens(code: string): Promise<any> {
    try {
      const response = await fetch(`${this.config.midwayUrl}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.config.clientId,
          code: code,
          redirect_uri: this.config.redirectUri,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error_description || 'Error obteniendo tokens');
      }

      console.log('🎫 Tokens obtenidos de Midway');
      
      // Decodificar información del usuario
      const userInfo = this.decodeJWT(result.id_token);
      
      return {
        tokens: result,
        user: {
          email: userInfo.email,
          name: userInfo.name || userInfo.preferred_username,
          alias: userInfo.preferred_username || userInfo.email?.split('@')[0],
          groups: userInfo.groups || []
        }
      };
    } catch (error) {
      console.error('❌ Error intercambiando código por tokens:', error);
      throw error;
    }
  }

  // Obtener información del usuario actual
  async getCurrentUser(): Promise<any> {
    const savedSession = localStorage.getItem('midwaySession');
    if (!savedSession) {
      throw new Error('No hay sesión activa');
    }

    try {
      const session = JSON.parse(savedSession);
      
      // Verificar si el token no ha expirado
      const tokenPayload = this.decodeJWT(session.tokens.id_token);
      const now = Math.floor(Date.now() / 1000);
      
      if (tokenPayload.exp < now) {
        throw new Error('Token expirado');
      }

      return session.user;
    } catch (error) {
      localStorage.removeItem('midwaySession');
      throw new Error('Sesión inválida');
    }
  }

  // Cerrar sesión
  logout(): void {
    localStorage.removeItem('midwaySession');
    
    // Redirigir a logout de Midway
    const logoutUrl = `${this.config.midwayUrl}/oauth2/logout?redirect_uri=${encodeURIComponent(this.config.redirectUri)}`;
    window.location.href = logoutUrl;
  }

  // Decodificar JWT
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

  // Verificar si hay callback de Midway
  isCallback(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('code') || urlParams.has('error');
  }
}
