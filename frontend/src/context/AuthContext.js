// frontend/src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';  // ← USA api.js centralizzato

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

      // 1. Ottieni utente corrente da Windows Authentication
      const userResponse = await api.get('/auth/user');
      
      if (!userResponse.data.success) {
        throw new Error('Autenticazione fallita');
      }

      const userData = userResponse.data.data;

      // 2. Verifica se l'utente è admin (OBBLIGATORIO)
      let isAdmin = false;
      try {
        const adminResponse = await api.get('/auth/isAdmin');
        isAdmin = adminResponse.data.success && adminResponse.data.data.isAdmin;
      } catch (err) {
        console.error('Errore verifica admin:', err);
        throw new Error('Impossibile verificare i permessi di amministratore');
      }

      // 3. BLOCCO: Se non è admin, nega l'accesso
      if (!isAdmin) {
        throw new Error('ACCESSO NEGATO: Solo gli amministratori possono accedere a questa applicazione');
      }

      // 4. Costruisci oggetto utente completo (solo per admin)
      const fullUser = {
        username: userData.username,
        displayName: userData.username,
        domain: userData.domain,
        authenticated: userData.isAuthenticated,
        isAdmin: true,
        role: 'admin'
      };

      setUser(fullUser);

    } catch (err) {
      console.error('Errore autenticazione:', err);
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
              <div className="alert alert-danger mb-4" role="alert">
                <p className="mb-0" style={{ fontSize: '16px' }}>
                  {error || 'Impossibile autenticare l\'utente'}
                </p>
              </div>
              
              {/* Informazioni */}
              {error?.includes('ACCESSO NEGATO') && (
                <div className="alert alert-info" role="alert">
                  <strong>ℹ️ Informazioni:</strong>
                  <p className="mb-0 mt-2">
                    Questa applicazione è riservata esclusivamente ai gestori del COmando Provinciale.
                    Se ritieni di dover avere accesso, contatta il Fin. Catalano per essere aggiunto alla lista degli autorizzati.
                  </p>
                </div>
              )}
              
              {/* Dettagli tecnici in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="alert alert-warning mt-3" role="alert">
                  <small>
                    <strong>⚙️ Development Mode:</strong><br />
                    Assicurati che la matricola sia presente nella tabella <code>tbl_admin</code>
                  </small>
                </div>
              )}
              
              {/* Pulsanti */}
              <div className="mt-4">
                <button 
                  className="btn btn-primary btn-lg me-2" 
                  onClick={() => window.location.reload()}
                >
                  🔄 Riprova
                </button>
                {process.env.NODE_ENV === 'production' && (
                  <button 
                    className="btn btn-outline-secondary btn-lg" 
                    onClick={() => window.location.href = '/logout-ad'}
                  >
                    🚪 Esci
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="text-center mt-4 text-muted">
            <small>Sistema Gestione Camerate - Accesso Riservato</small>
          </div>
        </div>
      </div>
    );
  }

  // Utente autenticato correttamente (solo admin arrivano qui)
  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error,
      logout,
      refreshAuth: authenticateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;