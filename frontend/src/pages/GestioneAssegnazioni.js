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
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  SwapHoriz as SwapIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Info as InfoIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/it";
import {
  getAllAssegnazioni,
  createAssegnazione,
  spostaAlloggiato,
  updateAssegnazione
} from "../services/assegnazioniService";
import { getAllCamere } from "../services/camereService";
import { getAllAlloggiati } from "../services/alloggiatiService";
import { DialogEliminazioneCamera } from "../components/StoricoAssegnazioniComponents";
import storicoAssegnazioniService from "../services/storicoAssegnazioniService";

// Imposta italiano come locale di default
dayjs.locale("it");

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
  const [assegnazioneIdDaEliminare, setAssegnazioneIdDaEliminare] =
    useState(null);

  // Stato per ordinamento
  const [orderBy, setOrderBy] = useState("cognome");
  const [order, setOrder] = useState("asc");

  // Stato per filtri
  const [filtri, setFiltri] = useState({
    cognome: "",
    numeroCamera: "",
    edificio: "",
  });

  const [formData, setFormData] = useState({
    matricola_alloggiato: "",
    id_camera: "",
    data_assegnazione: dayjs(), // Data di ingresso default oggi
    note: "",
  });

  const [spostaData, setSpostaData] = useState({
    matricola_alloggiato: "",
    id_camera_destinazione: "",
    note: "",
  });

  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [assegnazioneToEdit, setAssegnazioneToEdit] = useState(null);
  const [editData, setEditData] = useState({
    data_assegnazione: "",
    note: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applicaFiltri();
  }, [assegnazioni, filtri, orderBy, order]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [assegnazioniRes, camereRes, alloggiatiRes] = await Promise.all([
        getAllAssegnazioni(),
        getAllCamere(),
        getAllAlloggiati({ senza_camera: true }),
      ]);

      setAssegnazioni(assegnazioniRes.data || []);
      setCamere(camereRes.data || []);
      setAlloggiatiSenzaCamera(alloggiatiRes.data || []);

      const disponibili = (camereRes.data || []).filter(
        (c) => c.posti_liberi > 0 && c.agibile !== false
      );
      setCamereDisponibili(disponibili);
    } catch (err) {
      console.error("Errore caricamento dati:", err);
      setError("Errore nel caricamento dei dati");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const applicaFiltri = () => {
    let risultato = [...assegnazioni];

    // Applica filtri
    if (filtri.cognome) {
      risultato = risultato.filter((a) =>
        a.alloggiato.cognome
          .toLowerCase()
          .includes(filtri.cognome.toLowerCase())
      );
    }
    if (filtri.numeroCamera) {
      risultato = risultato.filter((a) =>
        a.camera.numero_camera
          .toLowerCase()
          .includes(filtri.numeroCamera.toLowerCase())
      );
    }
    if (filtri.edificio) {
      risultato = risultato.filter(
        (a) => a.camera.edificio === filtri.edificio
      );
    }

    // Applica ordinamento
    risultato.sort((a, b) => {
      let valoreA, valoreB;

      switch (orderBy) {
        case "cognome":
          valoreA = a.alloggiato.cognome.toLowerCase();
          valoreB = b.alloggiato.cognome.toLowerCase();
          break;
        case "grado":
          valoreA = a.alloggiato.grado?.descrizione || "";
          valoreB = b.alloggiato.grado?.descrizione || "";
          break;
        case "camera":
          valoreA = a.camera.numero_camera;
          valoreB = b.camera.numero_camera;
          break;
        case "edificio":
          valoreA = a.camera.edificio;
          valoreB = b.camera.edificio;
          break;
        case "data_assegnazione":
          valoreA = new Date(a.data_assegnazione);
          valoreB = new Date(b.data_assegnazione);
          break;
        default:
          return 0;
      }

      if (valoreA < valoreB) return order === "asc" ? -1 : 1;
      if (valoreA > valoreB) return order === "asc" ? 1 : -1;
      return 0;
    });

    setAssegnazioniFiltrate(risultato);
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltri((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const pulisciFiltri = () => {
    setFiltri({
      cognome: "",
      numeroCamera: "",
      edificio: "",
    });
  };

  const handleOpenDialog = () => {
    setFormData({
      matricola_alloggiato: "",
      id_camera: "",
      data_assegnazione: dayjs(), // Reset a data odierna
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
      matricola_alloggiato: assegnazione.matricola_alloggiato,
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

  const handleDateChange = (newDate) => {
    setFormData((prev) => ({
      ...prev,
      data_assegnazione: newDate,
    }));
  };

  const handleSpostaChange = (e) => {
    const { name, value } = e.target;
    setSpostaData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOpenEditDialog = (assegnazione) => {
    setAssegnazioneToEdit(assegnazione);
    setEditData({
      data_assegnazione: assegnazione.data_assegnazione,
      note: assegnazione.note || "",
    });
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setAssegnazioneToEdit(null);
    setError(null);
    setSuccess(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await updateAssegnazione(assegnazioneToEdit.id, editData);
      setSuccess("Assegnazione modificata con successo!");

      setTimeout(() => {
        handleCloseEditDialog();
        loadData();
      }, 1500);
    } catch (err) {
      console.error("Errore modifica assegnazione:", err);
      setError(err.response?.data?.error || "Errore nella modifica");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Converti la data in formato YYYY-MM-DD
      const dataFormatted = formData.data_assegnazione.format("YYYY-MM-DD");

      await createAssegnazione({
        ...formData,
        data_assegnazione: dataFormatted,
      });

      setSuccess("Assegnazione creata con successo!");

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
        setTimeout(() => {
          setDialogEliminazioneOpen(false);
          loadData();
        }, 1500);
      }
    } catch (err) {
      console.error("Errore eliminazione:", err);
      setError(err.response?.data?.error || "Errore nell'eliminazione");
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
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
      <Box sx={{ p: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4">Gestione Assegnazioni</Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
              sx={{ mr: 2 }}
            >
              Ricarica
            </Button>
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
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Filtri */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            <SearchIcon sx={{ verticalAlign: "middle", mr: 1 }} />
            Filtri di Ricerca
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Cognome"
                name="cognome"
                value={filtri.cognome}
                onChange={handleFiltroChange}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Numero Camera"
                name="numeroCamera"
                value={filtri.numeroCamera}
                onChange={handleFiltroChange}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                select
                label="Edificio"
                name="edificio"
                value={filtri.edificio}
                onChange={handleFiltroChange}
              >
                <MenuItem value="">Tutti</MenuItem>
                <MenuItem value="nuovo">Nuovo</MenuItem>
                <MenuItem value="vecchio">Vecchio</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={pulisciFiltri}
              >
                Pulisci
              </Button>
            </Grid>
          </Grid>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {assegnazioniFiltrate.length} assegnazioni trovate
          </Typography>
        </Paper>

        {/* Tabella Assegnazioni */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "cognome"}
                    direction={orderBy === "cognome" ? order : "asc"}
                    onClick={() => handleRequestSort("cognome")}
                  >
                    Cognome
                  </TableSortLabel>
                </TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "grado"}
                    direction={orderBy === "grado" ? order : "asc"}
                    onClick={() => handleRequestSort("grado")}
                  >
                    Grado
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "camera"}
                    direction={orderBy === "camera" ? order : "asc"}
                    onClick={() => handleRequestSort("camera")}
                  >
                    Camera
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "edificio"}
                    direction={orderBy === "edificio" ? order : "asc"}
                    onClick={() => handleRequestSort("edificio")}
                  >
                    Edificio
                  </TableSortLabel>
                </TableCell>
                <TableCell>Piano</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "data_assegnazione"}
                    direction={orderBy === "data_assegnazione" ? order : "asc"}
                    onClick={() => handleRequestSort("data_assegnazione")}
                  >
                    Data Ingresso
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">Note</TableCell>
                <TableCell align="center">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assegnazioniFiltrate.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary">
                      Nessuna assegnazione trovata
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                assegnazioniFiltrate.map((assegnazione) => (
                  <TableRow key={assegnazione.id} hover>
                    <TableCell>{assegnazione.alloggiato.cognome}</TableCell>
                    <TableCell>{assegnazione.alloggiato.nome}</TableCell>
                    <TableCell>{assegnazione.alloggiato.grado?.codice}</TableCell>
                    <TableCell>{assegnazione.camera.numero_camera}</TableCell>
                    <TableCell>
                      <Chip
                        label={assegnazione.camera.edificio}
                        size="small"
                        color={
                          assegnazione.camera.edificio === "nuovo"
                            ? "success"
                            : "default"
                        }
                      />
                    </TableCell>
                    <TableCell>{assegnazione.camera.piano}</TableCell>
                    <TableCell>
                      {new Date(
                        assegnazione.data_assegnazione
                      ).toLocaleDateString("it-IT")}
                    </TableCell>
                    <TableCell align="center">
                      {assegnazione.note ? (
                        <Tooltip title={assegnazione.note} arrow>
                          <IconButton size="small" color="info">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Modifica assegnazione">
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleOpenEditDialog(assegnazione)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
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
                  Non ci sono camere disponibili
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
                        {alloggiato.cognome} {alloggiato.nome} -{" "}
                        {alloggiato.grado?.descrizione} (
                        {alloggiato.grado?.categoria?.descrizione})
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
                  <DatePicker
                    label="Data Ingresso"
                    value={formData.data_assegnazione}
                    onChange={handleDateChange}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                      },
                    }}
                  />
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
                disabled={
                  !!success ||
                  alloggiatiSenzaCamera.length === 0 ||
                  camereDisponibili.length === 0
                }
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

        {/* Dialog Modifica Assegnazione */}
        <Dialog
          open={openEditDialog}
          onClose={handleCloseEditDialog}
          maxWidth="sm"
          fullWidth
        >
          <form onSubmit={handleEditSubmit}>
            <DialogTitle>Modifica Assegnazione</DialogTitle>
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

              {assegnazioneToEdit && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <strong>
                    {assegnazioneToEdit.alloggiato.cognome}{" "}
                    {assegnazioneToEdit.alloggiato.nome}
                  </strong>
                  {" - "}
                  Camera:{" "}
                  <strong>{assegnazioneToEdit.camera.numero_camera}</strong>
                </Alert>
              )}

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    type="date"
                    label="Data Ingresso"
                    name="data_assegnazione"
                    value={editData.data_assegnazione}
                    onChange={handleEditChange}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Note"
                    name="note"
                    value={editData.note}
                    onChange={handleEditChange}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseEditDialog}>Annulla</Button>
              <Button type="submit" variant="contained" disabled={!!success}>
                Salva Modifiche
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
    </LocalizationProvider>
  );
};

export default GestioneAssegnazioni;
