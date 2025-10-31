// frontend/src/components/ADSearch.jsx
import React, { useState, useEffect } from 'react';
import { 
  Form, 
  InputGroup, 
  ListGroup, 
  Badge, 
  Spinner,
  Alert
} from 'react-bootstrap';
import { Search } from 'react-bootstrap-icons';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Componente per la ricerca in Active Directory
 * 
 * Props:
 * - onSelect: function(user) - chiamata quando un utente viene selezionato
 * - placeholder: string - placeholder del campo di ricerca
 * - autoFocus: boolean - focus automatico al mount
 */
const ADSearch = ({ onSelect, placeholder = "Cerca in Active Directory...", autoFocus = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [adStatus, setAdStatus] = useState(null);
  const [error, setError] = useState(null);

  // Verifica connessione AD al mount
  useEffect(() => {
    checkADConnection();
  }, []);

  const checkADConnection = async () => {
    try {
      const response = await axios.get(`${API_URL}/ad/testConnection`, {
        withCredentials: true
      });
      
      setAdStatus({
        connected: response.data.success,
        message: response.data.message
      });
    } catch (err) {
      console.error('Errore connessione AD:', err);
      setAdStatus({
        connected: false,
        message: 'Impossibile connettersi ad Active Directory'
      });
    }
  };

  const handleSearch = async (term) => {
    setSearchTerm(term);
    setError(null);

    // Reset se term troppo corto
    if (term.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      setSearching(true);
      const response = await axios.get(`${API_URL}/ad/search`, {
        params: { term },
        withCredentials: true
      });

      if (response.data.success) {
        setSearchResults(response.data.data || []);
        setShowResults(true);
      } else {
        setError(response.data.error || 'Errore nella ricerca');
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Errore ricerca AD:', err);
      setError(err.response?.data?.error || 'Errore durante la ricerca');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = (user) => {
    setShowResults(false);
    setSearchTerm('');
    setSearchResults([]);
    
    if (onSelect) {
      onSelect(user);
    }
  };

  return (
    <div className="ad-search-container">
      {/* Alert stato connessione AD */}
      {adStatus && !adStatus.connected && (
        <Alert variant="warning" className="mb-3">
          <small>⚠️ {adStatus.message}</small>
        </Alert>
      )}

      {/* Campo ricerca */}
      <InputGroup className="mb-2">
        <InputGroup.Text>
          {searching ? (
            <Spinner animation="border" size="sm" />
          ) : (
            <Search />
          )}
        </InputGroup.Text>
        <Form.Control
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          autoFocus={autoFocus}
        />
      </InputGroup>

      {/* Errore */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Risultati ricerca */}
      {showResults && searchResults.length > 0 && (
        <ListGroup className="position-absolute w-100" style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}>
          {searchResults.map((user, index) => (
            <ListGroup.Item
              key={index}
              action
              onClick={() => handleSelectUser(user)}
              style={{ cursor: 'pointer' }}
            >
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <div className="fw-bold">
                    {user.displayName || `${user.givenName} ${user.sn}`}
                  </div>
                  <div className="text-muted small">
                    <Badge bg="secondary" className="me-2">
                      {user.samAccountName}
                    </Badge>
                    {user.title && (
                      <Badge bg="info" className="me-2">
                        {user.title}
                      </Badge>
                    )}
                    {user.physicalDeliveryOfficeName && (
                      <span className="text-muted">
                        {user.physicalDeliveryOfficeName}
                      </span>
                    )}
                  </div>
                  {user.telephoneNumber && (
                    <div className="text-muted small">
                      📞 {user.telephoneNumber}
                    </div>
                  )}
                </div>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      {/* Nessun risultato */}
      {showResults && searchTerm.length >= 3 && searchResults.length === 0 && !searching && (
        <Alert variant="info">
          Nessun risultato trovato per "{searchTerm}"
        </Alert>
      )}
    </div>
  );
};

export default ADSearch;