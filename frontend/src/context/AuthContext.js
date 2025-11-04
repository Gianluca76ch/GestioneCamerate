// frontend/src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    authenticateUser();
  }, []);

  const authenticateUser = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔐 Inizio autenticazione...');

      // 1. OTTIENI USERNAME DA IIS (whoami.aspx)
      let windowsUsername = null;
      
      try {
        // In produzione, chiama whoami.aspx (gestito da IIS)
        const whoamiResponse = await fetch('/whoami.ashx', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (whoamiResponse.ok) {
          const whoamiData = await whoamiResponse.json();
          console.log('✅ Risposta da whoami.aspx:', whoamiData);
          
          if (whoamiData.success && whoamiData.username) {
            windowsUsername = whoamiData.username;
            console.log('✅ Username Windows ottenuto:', windowsUsername);
          }
        }
      } catch (err) {
        console.warn('⚠️ Errore chiamata whoami.aspx (probabile development):', err.message);
      }

      // 2. PASSA USERNAME AL BACKEND
      // Imposta l'header per tutte le chiamate successive
      if (windowsUsername) {
        api.defaults.headers.common['X-Authenticated-User'] = windowsUsername;
        console.log('✅ Header X-Authenticated-User impostato:', windowsUsername);
      }

      // 3. VERIFICA UTENTE CON BACKEND
      const userResponse = await api.get('/auth/user');
      
      if (!userResponse.data.success) {
        throw new Error('Autenticazione fallita');
      }

      const userData = userResponse.data.data;
      console.log('✅ Utente verificato dal backend:', userData);

      // 4. VERIFICA SE È ADMIN
      let isAdmin = false;
      try {
        const adminResponse = await api.get('/auth/isAdmin');
        isAdmin = adminResponse.data.success && adminResponse.data.data.isAdmin;
        console.log('🔍 Verifica admin:', isAdmin);
      } catch (err) {
        console.error('❌ Errore verifica admin:', err);
        throw new Error('Impossibile verificare i permessi di amministratore');
      }

      // 5. BLOCCO: Se non è admin, nega l'accesso
      if (!isAdmin) {
        throw new Error('ACCESSO NEGATO: Solo gli amministratori possono accedere a questa applicazione');
      }

      // 6. COSTRUISCI OGGETTO UTENTE
      const fullUser = {
        username: userData.username,
        displayName: userData.username,
        domain: userData.domain,
        authenticated: userData.isAuthenticated,
        isAdmin: true,
        role: 'admin'
      };

      console.log('✅ Autenticazione completata:', fullUser);
      setUser(fullUser);

    } catch (err) {
      console.error('❌ Errore autenticazione:', err);
      const errorMessage = err.message || 'Errore durante l\'autenticazione';
      setError(errorMessage);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // In produzione, redirect a pagina logout Windows
    if (process.env.NODE_ENV === 'production') {
      window.location.href = '/logout-ad';
    } else {
      // In development, semplice reload
      window.location.reload();
    }
  };

  // Schermata di caricamento
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666',
        gap: '20px',
        backgroundColor: '#f5f5f5'
      }}>
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Caricamento...</span>
        </div>
        <div style={{ fontSize: '20px', fontWeight: '500' }}>
          Verifica autenticazione in corso...
        </div>
      </div>
    );
  }

  // Schermata di errore / Accesso negato
  if (error || !user) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ maxWidth: '600px', width: '100%' }}>
          <div className="card shadow-lg border-0">
            <div className="card-body p-5 text-center">
              {/* Icona */}
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>
                {error?.includes('ACCESSO NEGATO') ? '🚫' : '⚠️'}
              </div>
              
              {/* Titolo */}
              <h2 className="card-title mb-4" style={{ color: '#dc3545', fontWeight: 'bold' }}>
                {error?.includes('ACCESSO NEGATO') ? 'Accesso Negato' : 'Errore di Autenticazione'}
              </h2>
              
              {/* Messaggio */}
              <p className="card-text mb-4" style={{ fontSize: '16px', color: '#666' }}>
                {error}
              </p>
              
              {/* Info aggiuntive solo per errori non-admin */}
              {error?.includes('ACCESSO NEGATO') && (
                <div className="alert alert-info" role="alert">
                  <strong>ℹ️ Informazione:</strong><br/>
                  Questa applicazione è riservata agli amministratori del sistema.<br/>
                  Se ritieni di dover avere accesso, contatta l'amministratore di sistema.
                </div>
              )}
              
              {/* Pulsante riprova */}
              {!error?.includes('ACCESSO NEGATO') && (
                <button 
                  className="btn btn-primary btn-lg"
                  onClick={() => window.location.reload()}
                  style={{ marginTop: '20px' }}
                >
                  🔄 Riprova
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere usato all\'interno di AuthProvider');
  }
  return context;
};