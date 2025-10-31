import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  History as HistoryIcon,
  Info as InfoIcon 
} from '@mui/icons-material';

// Componente modale per confermare l'eliminazione dalla camera
const DialogEliminazioneCamera = ({ 
  open, 
  onClose, 
  onConfirm, 
  militare, 
  camera 
}) => {
  const [dataUscita, setDataUscita] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      // Imposta la data odierna come default
      const oggi = new Date().toISOString().split('T')[0];
      setDataUscita(oggi);
      setNote('');
      setError('');
    }
  }, [open]);

  const handleConfirm = () => {
    if (!dataUscita) {
      setError('La data di uscita è obbligatoria');
      return;
    }

    // Verifica che la data non sia futura
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    const dataSelezionata = new Date(dataUscita);
    
    if (dataSelezionata > oggi) {
      setError('La data di uscita non può essere futura');
      return;
    }

    onConfirm({ dataUscita, note });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Conferma Rimozione dalla Camera
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            <strong>Militare:</strong> {militare?.grado} {militare?.cognome} {militare?.nome}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Matricola:</strong> {militare?.matricola}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Camera:</strong> {camera?.numero_camera}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Il militare verrà rimosso dalla camera e l'assegnazione sarà spostata nello storico.
          </Typography>
        </Box>

        <TextField
          fullWidth
          type="date"
          label="Data di Uscita"
          value={dataUscita}
          onChange={(e) => setDataUscita(e.target.value)}
          InputLabelProps={{ shrink: true }}
          required
          sx={{ mb: 2 }}
          helperText="Inserisci la data in cui il militare ha lasciato la camera"
        />

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Note (opzionale)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Eventuali note aggiuntive..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          color="error"
        >
          Conferma Rimozione
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Componente principale per visualizzare lo storico
const StoricoAssegnazioni = ({ matricola, idCamera }) => {
  const [storico, setStorico] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStorico();
  }, [matricola, idCamera]);

  const loadStorico = async () => {
    try {
      setLoading(true);
      let url = '/api/storico-assegnazioni';
      
      if (matricola) {
        url = `/api/storico-assegnazioni/militare/${matricola}`;
      } else if (idCamera) {
        url = `/api/storico-assegnazioni/camera/${idCamera}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setStorico(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('Errore nel caricamento dello storico:', err);
      setError('Errore nel caricamento dello storico');
    } finally {
      setLoading(false);
    }
  };

  const calcolaDurata = (dataEntrata, dataUscita) => {
    const entrata = new Date(dataEntrata);
    const uscita = new Date(dataUscita);
    const diffGiorni = Math.floor((uscita - entrata) / (1000 * 60 * 60 * 24));
    return diffGiorni;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT');
  };

  if (loading) {
    return <Typography>Caricamento storico...</Typography>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (storico.length === 0) {
    return (
      <Alert severity="info">
        <Typography>Nessun dato nello storico</Typography>
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <HistoryIcon sx={{ mr: 1 }} />
        <Typography variant="h6">
          Storico Assegnazioni
        </Typography>
        <Chip 
          label={`${storico.length} record`} 
          size="small" 
          sx={{ ml: 2 }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {!matricola && (
                <>
                  <TableCell>Matricola</TableCell>
                  <TableCell>Grado</TableCell>
                  <TableCell>Cognome</TableCell>
                  <TableCell>Nome</TableCell>
                </>
              )}
              {!idCamera && (
                <>
                  <TableCell>Camera</TableCell>
                  <TableCell>Edificio</TableCell>
                  <TableCell>Piano</TableCell>
                </>
              )}
              <TableCell>Data Entrata</TableCell>
              <TableCell>Data Uscita</TableCell>
              <TableCell>Durata (gg)</TableCell>
              <TableCell>Note</TableCell>
              <TableCell>Inserito da</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {storico.map((record) => (
              <TableRow key={record.id}>
                {!matricola && (
                  <>
                    <TableCell>{record.matricola_alloggiato}</TableCell>
                    <TableCell>{record.grado}</TableCell>
                    <TableCell>{record.cognome}</TableCell>
                    <TableCell>{record.nome}</TableCell>
                  </>
                )}
                {!idCamera && (
                  <>
                    <TableCell>{record.numero_camera}</TableCell>
                    <TableCell>{record.edificio}</TableCell>
                    <TableCell>{record.piano}</TableCell>
                  </>
                )}
                <TableCell>{formatDate(record.data_entrata)}</TableCell>
                <TableCell>{formatDate(record.data_uscita)}</TableCell>
                <TableCell>
                  <Chip 
                    label={calcolaDurata(record.data_entrata, record.data_uscita)} 
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  {record.note && (
                    <Tooltip title={record.note}>
                      <InfoIcon fontSize="small" color="action" />
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell>{record.inserito_da || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export { DialogEliminazioneCamera, StoricoAssegnazioni };