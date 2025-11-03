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
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  getAllAlloggiati,
  createAlloggiato,
  updateAlloggiato,
  deleteAlloggiato,
} from "../services/alloggiatiService";
import { getAllGradi } from "../services/gradiService";

const GestioneAlloggiati = () => {
  const [alloggiati, setAlloggiati] = useState([]);
  const [gradi, setGradi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentAlloggiato, setCurrentAlloggiato] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    matricola: "",
    id_grado: "",
    cognome: "",
    nome: "",
    telefono: "",
    codice_reparto: "",
    descrizione_reparto: "",
    tipo_ferma: "FV",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [alloggiatiRes, gradiRes] = await Promise.all([
        getAllAlloggiati(),
        getAllGradi(),
      ]);
      setAlloggiati(alloggiatiRes.data || []);
      setGradi(gradiRes.data || []);
    } catch (err) {
      console.error("Errore caricamento dati:", err);
      setError("Errore nel caricamento dei dati");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (alloggiato = null) => {
    if (alloggiato) {
      setEditMode(true);
      setCurrentAlloggiato(alloggiato);
      setFormData({
        matricola: alloggiato.matricola,
        id_grado: alloggiato.id_grado,
        cognome: alloggiato.cognome,
        nome: alloggiato.nome,
        telefono: alloggiato.telefono || "",
        codice_reparto: alloggiato.codice_reparto || "",
        descrizione_reparto: alloggiato.descrizione_reparto || "",
        tipo_ferma: alloggiato.tipo_ferma || "FV",
      });
    } else {
      setEditMode(false);
      setCurrentAlloggiato(null);
      setFormData({
        matricola: "",
        id_grado: "",
        cognome: "",
        nome: "",
        telefono: "",
        codice_reparto: "",
        descrizione_reparto: "",
        tipo_ferma: "FV",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setCurrentAlloggiato(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const dataToSend = {
        ...formData,
        id_grado: parseInt(formData.id_grado),
      };

      if (editMode) {
        await updateAlloggiato(currentAlloggiato.matricola, dataToSend);
        setSuccess("Alloggiato aggiornato con successo!");
      } else {
        await createAlloggiato(dataToSend);
        setSuccess("Alloggiato creato con successo!");
      }

      setTimeout(() => {
        handleCloseDialog();
        loadData();
      }, 1500);
    } catch (err) {
      console.error("Errore salvataggio alloggiato:", err);
      setError(
        err.response?.data?.error || "Errore nel salvataggio dell'alloggiato"
      );
    }
  };

  const handleDelete = async (matricola, cognome, nome) => {
    if (!window.confirm(`Sei sicuro di voler eliminare ${cognome} ${nome}?`)) {
      return;
    }

    try {
      await deleteAlloggiato(matricola);
      setSuccess("Alloggiato eliminato con successo!");
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Errore eliminazione alloggiato:", err);
      setError(
        err.response?.data?.error || "Errore nell'eliminazione dell'alloggiato"
      );
      setTimeout(() => setError(null), 5000);
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
        <Typography variant="h4">Gestione Alloggiati</Typography>
        <Box>
          <IconButton onClick={loadData} sx={{ mr: 1 }}>
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nuovo Alloggiato
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Matricola</strong>
              </TableCell>
              <TableCell>
                <strong>Cognome</strong>
              </TableCell>
              <TableCell>
                <strong>Nome</strong>
              </TableCell>
              <TableCell>
                <strong>Grado</strong>
              </TableCell>
              <TableCell>
                <strong>Categoria</strong>
              </TableCell>
              <TableCell>
                <strong>Tipo Ferma</strong>
              </TableCell>
              <TableCell>
                <strong>Telefono</strong>
              </TableCell>
              <TableCell>
                <strong>Reparto</strong>
              </TableCell>
              <TableCell>
                <strong>Camera</strong>
              </TableCell>
              <TableCell>
                <strong>Azioni</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alloggiati.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography variant="body2" color="textSecondary">
                    Nessun alloggiato disponibile
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              alloggiati.map((alloggiato) => (
                <TableRow key={alloggiato.matricola} hover>
                  <TableCell>{alloggiato.matricola}</TableCell>
                  <TableCell>{alloggiato.cognome}</TableCell>
                  <TableCell>{alloggiato.nome}</TableCell>
                  <TableCell>{alloggiato.grado?.descrizione}</TableCell>
                  <TableCell>
                    {alloggiato.grado?.categoria?.descrizione}
                  </TableCell>
                  <TableCell>{alloggiato.tipo_ferma}</TableCell>
                  <TableCell>{alloggiato.telefono || "-"}</TableCell>
                  <TableCell>{alloggiato.codice_reparto || "-"}</TableCell>
                  <TableCell>
                    {alloggiato.ha_camera ? (
                      <Chip
                        label={alloggiato.camera_corrente?.numero_camera}
                        color="primary"
                        size="small"
                      />
                    ) : (
                      <Chip label="Senza camera" color="default" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(alloggiato)}
                      title="Modifica"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() =>
                        handleDelete(
                          alloggiato.matricola,
                          alloggiato.cognome,
                          alloggiato.nome
                        )
                      }
                      title="Elimina"
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

      {/* Dialog Crea/Modifica Alloggiato */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editMode ? "Modifica Alloggiato" : "Nuovo Alloggiato"}
          </DialogTitle>
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
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  required
                  label="Matricola"
                  name="matricola"
                  value={formData.matricola}
                  onChange={handleChange}
                  disabled={editMode}
                  inputProps={{ maxLength: 20 }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Grado"
                  name="id_grado"
                  value={formData.id_grado}
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
                  <MenuItem value="">Seleziona grado</MenuItem>
                  {gradi.map((grado) => (
                    <MenuItem key={grado.id} value={grado.id}>
                      {grado.descrizione} ({grado.categoria?.descrizione})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Tipo Ferma"
                  name="tipo_ferma"
                  value={formData.tipo_ferma}
                  onChange={handleChange}
                >
                  <MenuItem value="FV">Ferma volontaria</MenuItem>
                  <MenuItem value="SPE">SPE</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Cognome"
                  name="cognome"
                  value={formData.cognome}
                  onChange={handleChange}
                  inputProps={{ maxLength: 100 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  inputProps={{ maxLength: 100 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  inputProps={{ maxLength: 20 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Codice Reparto"
                  name="codice_reparto"
                  value={formData.codice_reparto}
                  onChange={handleChange}
                  inputProps={{ maxLength: 50 }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrizione Reparto"
                  name="descrizione_reparto"
                  value={formData.descrizione_reparto}
                  onChange={handleChange}
                  inputProps={{ maxLength: 200 }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Annulla</Button>
            <Button type="submit" variant="contained" disabled={!!success}>
              {editMode ? "Salva Modifiche" : "Crea Alloggiato"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default GestioneAlloggiati;
