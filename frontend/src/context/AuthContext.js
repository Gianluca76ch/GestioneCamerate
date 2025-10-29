import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulazione autenticazione automatica da Active Directory
    // In produzione, questa chiamata recupererebbe l'utente da AD
    const authenticateFromAD = () => {
      // Simula il recupero dell'utente autenticato da AD
      const adUser = {
        username: 'Luigi',
        displayName: 'Luigi Scurnakk',
        role: 'admin',
        email: 'luigi.rossi@caserma.it',
        authenticated: true
      };
      
      setUser(adUser);
      setLoading(false);
    };

    // Simula un breve delay per l'autenticazione AD
    setTimeout(authenticateFromAD, 500);
  }, []);

  const logout = () => {
    // In produzione, questo farebbe il logout da AD
    window.location.href = '/logout-ad'; // Redirect a pagina logout AD
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Autenticazione in corso...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
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