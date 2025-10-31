import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { StoricoAssegnazioni } from '../components/StoricoAssegnazioniComponents';
import storicoAssegnazioniService from '../services/storicoAssegnazioniService';

const StoricoAssegnazioniPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [storicoData, setStoricoData] = useState([]);
  
  // Filtri
  const [filtri, setFiltri] = useState({
    matricola: '',
    numeroCamera: '',
    grado: '',
    edificio: '',
    dataEntrataDa: '',
    dataEntrataA: '',
    dataUscitaDa: '',
    dataUscitaA: ''
  });

  useEffect(() => {
    loadStorico();
  }, []);

  const loadStorico = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Filtra solo i campi non vuoti
      const filtriAttivi = Object.keys(filtri).reduce((acc, key) => {
        if (filtri[key]) {
          acc[key] = filtri[key];
        }
        return acc;
      }, {});
      
      const response = await storicoAssegnazioniService.getStorico(filtriAttivi);
      if (response.data.success) {
        setStoricoData(response.data.data);
      }
    } catch (err) {
      console.error('Errore caricamento storico:', err);
      setError('Errore nel caricamento dello storico');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltri(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCercaConFiltri = () => {
    loadStorico();
  };

  const handleResetFiltri = () => {
    setFiltri({
      matricola: '',
      numeroCamera: '',
      grado: '',
      edificio: '',
      dataEntrataDa: '',
      dataEntrataA: '',
      dataUscitaDa: '',
      dataUscitaA: ''
    });
  };

  const handleExportCSV = () => {
    if (storicoData.length === 0) {
      setError('Nessun dato da esportare');
      setTimeout(() => setError(null), 3000);
      return;
    }
    storicoAssegnazioniService.exportToCSV(storicoData);
  };

  if (loading && storicoData.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Storico Assegnazioni</Typography>
        <Box>
          <Tooltip title="Ricarica dati">
            <IconButton onClick={loadStorico} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Esporta in CSV">
            <IconButton onClick={handleExportCSV} disabled={storicoData.length === 0}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filtri */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filtri di Ricerca
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Matricola"
              name="matricola"
              value={filtri.matricola}
              onChange={handleFiltroChange}
              size="small"
              placeholder="es. 12345A"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Numero Camera"
              name="numeroCamera"
              value={filtri.numeroCamera}
              onChange={handleFiltroChange}
              size="small"
              placeholder="es. 101"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Grado"
              name="grado"
              value={filtri.grado}
              onChange={handleFiltroChange}
              size="small"
              placeholder="es. CAP"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Edificio"
              name="edificio"
              value={filtri.edificio}
              onChange={handleFiltroChange}
              size="small"
              placeholder="es. Edificio A"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Data Entrata Da"
              name="dataEntrataDa"
              value={filtri.dataEntrataDa}
              onChange={handleFiltroChange}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Data Entrata A"
              name="dataEntrataA"
              value={filtri.dataEntrataA}
              onChange={handleFiltroChange}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Data Uscita Da"
              name="dataUscitaDa"
              value={filtri.dataUscitaDa}
              onChange={handleFiltroChange}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Data Uscita A"
              name="dataUscitaA"
              value={filtri.dataUscitaA}
              onChange={handleFiltroChange}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} display="flex" justifyContent="flex-end" gap={1}>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleResetFiltri}
            >
              Reimposta Filtri
            </Button>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleCercaConFiltri}
              disabled={loading}
            >
              Cerca
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabella Storico */}
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <StoricoAssegnazioni />
      )}
    </Box>
  );
};

export default StoricoAssegnazioniPage;