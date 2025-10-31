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
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  SwapHoriz as SwapIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  getAllAssegnazioni,
  createAssegnazione,
  deleteAssegnazione,
  spostaAlloggiato,
} from "../services/assegnazioniService";
import { getAllCamere } from "../services/camereService";
import { getAllAlloggiati } from "../services/alloggiatiService";
import { DialogEliminazioneCamera } from "../components/StoricoAssegnazioniComponents";
import storicoAssegnazioniService from "../services/storicoAssegnazioniService";

const GestioneAssegnazioni = () => {
  const [assegnazioni, setAssegnazioni] = useState([]);
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
  const [assegnazioneIdDaEliminare, setAssegnazioneIdDaEliminare] =
    useState(null);

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
    // Prepara i dati del militare e della camera
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

    // Imposta gli state e apri il dialogo
    setMilitareSelezionato(militare);
    setCameraSelezionata(camera);
    setAssegnazioneIdDaEliminare(assegnazione.id);
    setDialogEliminazioneOpen(true);
  };

  const handleConfirmEliminazione = async ({ dataUscita, note }) => {
    try {
      setError(null);

      // Ottieni lo username dell'utente corrente
      // Se hai un AuthContext usa: const { currentUser } = useAuth();
      // const username = currentUser?.username || 'admin';
      const username = "admin"; // Modifica questo con il vero username

      // Chiama il service per spostare in storico
      const response = await storicoAssegnazioniService.spostaInStorico(
        assegnazioneIdDaEliminare,
        dataUscita,
        note,
        username
      );

      if (response.data.success) {
        setSuccess("Militare rimosso dalla camera e spostato nello storico!");

        // Ricarica i dati
        loadData();

        // Chiudi il dialogo dopo un breve delay
        setTimeout(() => {
          setDialogEliminazioneOpen(false);
          setSuccess(null);
        }, 2000);
      } else {
        setError(response.data.error || "Errore nella rimozione");
      }
    } catch (error) {
      console.error("Errore nell'eliminazione:", error);
      setError(
        error.response?.data?.error ||
          "Errore nella rimozione del militare dalla camera"
      );
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Gestione Assegnazioni</Typography>
        <Box>
          <IconButton onClick={loadData} sx={{ mr: 1 }}>
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            disabled={
              alloggiatiSenzaCamera.length === 0 ||
              camereDisponibili.length === 0
            }
          >
            Nuova Assegnazione
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {alloggiatiSenzaCamera.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Non ci sono alloggiati senza camera da assegnare
        </Alert>
      )}

      {camereDisponibili.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Nessuna camera disponibile
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Matricola</strong>
              </TableCell>
              <TableCell>
                <strong>Cognome Nome</strong>
              </TableCell>
              <TableCell>
                <strong>Grado</strong>
              </TableCell>
              <TableCell>
                <strong>Camera</strong>
              </TableCell>
              <TableCell>
                <strong>Edificio</strong>
              </TableCell>
              <TableCell>
                <strong>Piano</strong>
              </TableCell>
              <TableCell>
                <strong>Data Assegnazione</strong>
              </TableCell>
              <TableCell>
                <strong>Azioni</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assegnazioni.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="textSecondary">
                    Nessuna assegnazione attiva
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              assegnazioni.map((assegnazione) => (
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
                  <TableCell>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenSpostaDialog(assegnazione)}
                      title="Sposta alloggiato"
                    >
                      <SwapIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(assegnazione)}
                      title="Rimuovi dalla camera"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
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
            <Button type="submit" variant="contained" disabled={!!success}>
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
