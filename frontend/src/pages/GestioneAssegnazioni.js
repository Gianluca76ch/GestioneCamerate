import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  TableSortLabel,
  Tooltip
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  SwapHoriz as SwapIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from "@mui/icons-material";
import {
  getAllAssegnazioni,
  createAssegnazione,
  spostaAlloggiato,
} from "../services/assegnazioniService";
import { getAllCamere } from "../services/camereService";
import { getAllAlloggiati } from "../services/alloggiatiService";
import { DialogEliminazioneCamera } from "../components/StoricoAssegnazioniComponents";
import storicoAssegnazioniService from "../services/storicoAssegnazioniService";

const GestioneAssegnazioni = () => {
  const [assegnazioni, setAssegnazioni] = useState([]);
  const [assegnazioniFiltrate, setAssegnazioniFiltrate] = useState([]);
  const [camere, setCamere] = useState([]);
  const [camereDisponibili, setCamereDisponibili] = useState([]);
  const [alloggiatiSenzaCamera, setAlloggiatiSenzaCamera] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSpostaDialog, setOpenSpostaDialog] = useState(false);
  const [currentAssegnazione, setCurrentAssegnazione] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dialogEliminazioneOpen, setDialogEliminazioneOpen] = useState(false);
  const [militareSelezionato, setMilitareSelezionato] = useState(null);
  const [cameraSelezionata, setCameraSelezionata] = useState(null);
  const [assegnazioneIdDaEliminare, setAssegnazioneIdDaEliminare] = useState(null);

  // Filtri
  const [filtri, setFiltri] = useState({
    cognome: '',
    numeroCamera: '',
    edificio: ''
  });

  // Ordinamento
  const [orderBy, setOrderBy] = useState('cognome');
  const [order, setOrder] = useState('asc');

  const [formData, setFormData] = useState({
    matricola_alloggiato: "",
    id_camera: "",
    note: "",
  });

  const [spostaData, setSpostaData] = useState({
    matricola_alloggiato: "",
    id_camera_destinazione: "",
    note: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applicaFiltri();
  }, [filtri, assegnazioni, order, orderBy]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [assegnazioniRes, camereRes, alloggiatiRes] = await Promise.all([
        getAllAssegnazioni({ attive: true }),
        getAllCamere(),
        getAllAlloggiati({ senza_camera: true }),
      ]);

      setAssegnazioni(assegnazioniRes.data || []);
      setCamere(camereRes.data || []);
      setAlloggiatiSenzaCamera(alloggiatiRes.data || []);

      // Filtra camere disponibili
      const disponibili = (camereRes.data || []).filter(
        (c) => c.posti_occupati < c.nr_posti
      );
      setCamereDisponibili(disponibili);
    } catch (err) {
      console.error("Errore caricamento dati:", err);
      setError("Errore nel caricamento dei dati");
    } finally {
      setLoading(false);
    }
  };

  const applicaFiltri = () => {
    let risultato = [...assegnazioni];

    // Applica filtri
    if (filtri.cognome) {
      risultato = risultato.filter((a) =>
        a.alloggiato.cognome.toLowerCase().includes(filtri.cognome.toLowerCase())
      );
    }

    if (filtri.numeroCamera) {
      risultato = risultato.filter((a) =>
        a.camera.numero_camera.toLowerCase().includes(filtri.numeroCamera.toLowerCase())
      );
    }

    if (filtri.edificio) {
      risultato = risultato.filter((a) =>
        a.camera.edificio.toLowerCase().includes(filtri.edificio.toLowerCase())
      );
    }

    // Applica ordinamento
    risultato.sort((a, b) => {
      let valoreA, valoreB;

      switch (orderBy) {
        case 'matricola':
          valoreA = a.alloggiato.matricola;
          valoreB = b.alloggiato.matricola;
          break;
        case 'cognome':
          valoreA = a.alloggiato.cognome;
          valoreB = b.alloggiato.cognome;
          break;
        case 'grado':
          valoreA = a.alloggiato.grado?.descrizione || '';
          valoreB = b.alloggiato.grado?.descrizione || '';
          break;
        case 'camera':
          valoreA = a.camera.numero_camera;
          valoreB = b.camera.numero_camera;
          break;
        case 'edificio':
          valoreA = a.camera.edificio;
          valoreB = b.camera.edificio;
          break;
        case 'piano':
          valoreA = a.camera.piano;
          valoreB = b.camera.piano;
          break;
        case 'data_assegnazione':
          valoreA = new Date(a.data_assegnazione);
          valoreB = new Date(b.data_assegnazione);
          break;
        default:
          valoreA = '';
          valoreB = '';
      }

      if (valoreA < valoreB) {
        return order === 'asc' ? -1 : 1;
      }
      if (valoreA > valoreB) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setAssegnazioniFiltrate(risultato);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltri(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleResetFiltri = () => {
    setFiltri({
      cognome: '',
      numeroCamera: '',
      edificio: ''
    });
  };

  const handleOpenDialog = () => {
    setFormData({
      matricola_alloggiato: "",
      id_camera: "",
      note: "",
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError(null);
    setSuccess(null);
  };

  const handleOpenSpostaDialog = (assegnazione) => {
    setCurrentAssegnazione(assegnazione);
    setSpostaData({
      matricola_alloggiato: assegnazione.alloggiato.matricola,
      id_camera_destinazione: "",
      note: "",
    });
    setOpenSpostaDialog(true);
  };

  const handleCloseSpostaDialog = () => {
    setOpenSpostaDialog(false);
    setCurrentAssegnazione(null);
    setError(null);
    setSuccess(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSpostaChange = (e) => {
    const { name, value } = e.target;
    setSpostaData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await createAssegnazione(formData);
      setSuccess("Alloggiato assegnato con successo!");

      setTimeout(() => {
        handleCloseDialog();
        loadData();
      }, 1500);
    } catch (err) {
      console.error("Errore creazione assegnazione:", err);
      setError(err.response?.data?.error || "Errore nell'assegnazione");
    }
  };

  const handleSposta = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await spostaAlloggiato(spostaData);
      setSuccess("Alloggiato spostato con successo!");

      setTimeout(() => {
        handleCloseSpostaDialog();
        loadData();
      }, 1500);
    } catch (err) {
      console.error("Errore spostamento:", err);
      setError(err.response?.data?.error || "Errore nello spostamento");
    }
  };

  const handleDelete = (assegnazione) => {
    const militare = {
      matricola: assegnazione.alloggiato.matricola,
      grado: assegnazione.alloggiato.grado?.descrizione || "N/A",
      cognome: assegnazione.alloggiato.cognome,
      nome: assegnazione.alloggiato.nome,
    };

    const camera = {
      numero_camera: assegnazione.camera.numero_camera,
      edificio: assegnazione.camera.edificio,
    };

    setMilitareSelezionato(militare);
    setCameraSelezionata(camera);
    setAssegnazioneIdDaEliminare(assegnazione.id);
    setDialogEliminazioneOpen(true);
  };

  const handleConfirmEliminazione = async ({ dataUscita, note }) => {
    try {
      setError(null);
      const username = "admin";

      const response = await storicoAssegnazioniService.spostaInStorico(
        assegnazioneIdDaEliminare,
        dataUscita,
        note,
        username
      );

      if (response.data.success) {
        setSuccess("Militare rimosso dalla camera e spostato nello storico!");
        setDialogEliminazioneOpen(false);
        loadData();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error("Errore rimozione assegnazione:", err);
      setError(
        err.response?.data?.error ||
          "Errore nella rimozione dell'assegnazione"
      );
      setTimeout(() => setError(null), 5000);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Gestione Assegnazioni</Typography>
        <Box>
          <Tooltip title="Ricarica dati">
            <IconButton onClick={loadData} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Nuova Assegnazione
          </Button>
        </Box>
      </Box>

      {/* Alert messaggi */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
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
              label="Cognome"
              name="cognome"
              value={filtri.cognome}
              onChange={handleFiltroChange}
              size="small"
              placeholder="es. Rossi"
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
              select
              label="Edificio"
              name="edificio"
              value={filtri.edificio}
              onChange={handleFiltroChange}
              size="small"
              SelectProps={{
                displayEmpty: true
              }}
            >
              <MenuItem value="">Tutti</MenuItem>
              <MenuItem value="nuovo">Nuovo</MenuItem>
              <MenuItem value="vecchio">Vecchio</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3} display="flex" alignItems="center" gap={1}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleResetFiltri}
            >
              Reimposta
            </Button>
          </Grid>
        </Grid>

        {/* Info risultati */}
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            Visualizzati <strong>{assegnazioniFiltrate.length}</strong> di <strong>{assegnazioni.length}</strong> assegnazioni
          </Typography>
        </Box>
      </Paper>

      {/* Tabella Assegnazioni */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'matricola'}
                  direction={orderBy === 'matricola' ? order : 'asc'}
                  onClick={() => handleRequestSort('matricola')}
                >
                  <strong>Matricola</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'cognome'}
                  direction={orderBy === 'cognome' ? order : 'asc'}
                  onClick={() => handleRequestSort('cognome')}
                >
                  <strong>Cognome Nome</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'grado'}
                  direction={orderBy === 'grado' ? order : 'asc'}
                  onClick={() => handleRequestSort('grado')}
                >
                  <strong>Grado</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'camera'}
                  direction={orderBy === 'camera' ? order : 'asc'}
                  onClick={() => handleRequestSort('camera')}
                >
                  <strong>Camera</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'edificio'}
                  direction={orderBy === 'edificio' ? order : 'asc'}
                  onClick={() => handleRequestSort('edificio')}
                >
                  <strong>Edificio</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'piano'}
                  direction={orderBy === 'piano' ? order : 'asc'}
                  onClick={() => handleRequestSort('piano')}
                >
                  <strong>Piano</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'data_assegnazione'}
                  direction={orderBy === 'data_assegnazione' ? order : 'asc'}
                  onClick={() => handleRequestSort('data_assegnazione')}
                >
                  <strong>Data Assegnazione</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <strong>Azioni</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assegnazioniFiltrate.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="textSecondary">
                    {filtri.cognome || filtri.numeroCamera || filtri.edificio
                      ? 'Nessuna assegnazione trovata con i filtri applicati'
                      : 'Nessuna assegnazione attiva'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              assegnazioniFiltrate.map((assegnazione) => (
                <TableRow key={assegnazione.id} hover>
                  <TableCell>{assegnazione.alloggiato.matricola}</TableCell>
                  <TableCell>
                    {assegnazione.alloggiato.cognome}{" "}
                    {assegnazione.alloggiato.nome}
                  </TableCell>
                  <TableCell>
                    {assegnazione.alloggiato.grado?.descrizione}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={assegnazione.camera.numero_camera}
                      color="primary"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{assegnazione.camera.edificio}</TableCell>
                  <TableCell>{assegnazione.camera.piano}</TableCell>
                  <TableCell>
                    {new Date(
                      assegnazione.data_assegnazione
                    ).toLocaleDateString("it-IT")}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Sposta alloggiato">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenSpostaDialog(assegnazione)}
                      >
                        <SwapIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Rimuovi dalla camera">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(assegnazione)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Nuova Assegnazione */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>Nuova Assegnazione</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            {alloggiatiSenzaCamera.length === 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Non ci sono alloggiati senza camera disponibile
              </Alert>
            )}

            {camereDisponibili.length === 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Non ci sono camere con posti disponibili
              </Alert>
            )}

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Alloggiato"
                  name="matricola_alloggiato"
                  value={formData.matricola_alloggiato}
                  onChange={handleChange}
                  disabled={alloggiatiSenzaCamera.length === 0}
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        style: {
                          maxHeight: 400,
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="">Seleziona alloggiato</MenuItem>
                  {alloggiatiSenzaCamera.map((alloggiato) => (
                    <MenuItem
                      key={alloggiato.matricola}
                      value={alloggiato.matricola}
                    >
                      {alloggiato.matricola} - {alloggiato.cognome}{" "}
                      {alloggiato.nome} ({alloggiato.grado?.descrizione})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Camera"
                  name="id_camera"
                  value={formData.id_camera}
                  onChange={handleChange}
                  disabled={camereDisponibili.length === 0}
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        style: {
                          maxHeight: 400,
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="">Seleziona camera</MenuItem>
                  {camereDisponibili.map((camera) => (
                    <MenuItem key={camera.id} value={camera.id}>
                      {camera.numero_camera} - {camera.edificio} (Piano{" "}
                      {camera.piano}) - Posti: {camera.posti_occupati || 0}/
                      {camera.nr_posti}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Note"
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Annulla</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={!!success || alloggiatiSenzaCamera.length === 0 || camereDisponibili.length === 0}
            >
              Assegna
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog Sposta Alloggiato */}
      <Dialog
        open={openSpostaDialog}
        onClose={handleCloseSpostaDialog}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSposta}>
          <DialogTitle>Sposta Alloggiato</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            {currentAssegnazione && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Stai spostando:{" "}
                <strong>
                  {currentAssegnazione.alloggiato.cognome}{" "}
                  {currentAssegnazione.alloggiato.nome}
                </strong>
                <br />
                Camera attuale:{" "}
                <strong>{currentAssegnazione.camera.numero_camera}</strong>
              </Alert>
            )}

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Camera Destinazione"
                  name="id_camera_destinazione"
                  value={spostaData.id_camera_destinazione}
                  onChange={handleSpostaChange}
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        style: {
                          maxHeight: 400,
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="">Seleziona camera</MenuItem>
                  {camereDisponibili
                    .filter((c) => c.id !== currentAssegnazione?.camera.id)
                    .map((camera) => (
                      <MenuItem key={camera.id} value={camera.id}>
                        {camera.numero_camera} - {camera.edificio} (Piano{" "}
                        {camera.piano}) - Posti: {camera.posti_occupati || 0}/
                        {camera.nr_posti}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Note"
                  name="note"
                  value={spostaData.note}
                  onChange={handleSpostaChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSpostaDialog}>Annulla</Button>
            <Button type="submit" variant="contained" disabled={!!success}>
              Sposta
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog Eliminazione */}
      <DialogEliminazioneCamera
        open={dialogEliminazioneOpen}
        onClose={() => setDialogEliminazioneOpen(false)}
        onConfirm={handleConfirmEliminazione}
        militare={militareSelezionato}
        camera={cameraSelezionata}
      />
    </Box>
  );
};

export default GestioneAssegnazioni;