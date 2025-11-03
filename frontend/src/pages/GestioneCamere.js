import React, { useState, useEffect } from 'react';
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
  FormControlLabel,
  Switch,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import {
  getAllCamere,
  createCamera,
  updateCamera,
  deleteCamera
} from '../services/camereService';
import { getAllCategorie } from '../services/categorieService';

const GestioneCamere = () => {
  const [camere, setCamere] = useState([]);
  const [categorie, setCategorie] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCamera, setCurrentCamera] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    numero_camera: '',
    piano: '',
    ala: '',
    edificio: 'nuovo',
    nr_posti: '',
    genere: '',
    id_categoria: '',
    note: '',
    agibile: true,
    manutenzione: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [camereRes, categorieRes] = await Promise.all([
        getAllCamere(),
        getAllCategorie()
      ]);
      setCamere(camereRes.data || []);
      setCategorie(categorieRes.data || []);
    } catch (err) {
      console.error('Errore caricamento dati:', err);
      setError('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (camera = null) => {
    if (camera) {
      setEditMode(true);
      setCurrentCamera(camera);
      setFormData({
        numero_camera: camera.numero_camera,
        piano: camera.piano,
        ala: camera.ala || '',
        edificio: camera.edificio,
        nr_posti: camera.nr_posti,
        genere: camera.genere,
        id_categoria: camera.id_categoria || '',
        note: camera.note || '',
        agibile: camera.agibile !== undefined ? camera.agibile : true,
        manutenzione: camera.manutenzione !== undefined ? camera.manutenzione : false
      });
    } else {
      setEditMode(false);
      setCurrentCamera(null);
      setFormData({
        numero_camera: '',
        piano: '',
        ala: '',
        edificio: 'nuovo',
        nr_posti: '',
        genere: '',
        id_categoria: '',
        note: '',
        agibile: true,
        manutenzione: false
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setCurrentCamera(null);
    setError(null);
    setSuccess(null);
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const dataToSend = {
        ...formData,
        piano: parseInt(formData.piano),
        nr_posti: parseInt(formData.nr_posti),
        id_categoria: formData.id_categoria ? parseInt(formData.id_categoria) : null,
        ala: formData.ala || null
      };

      if (editMode) {
        await updateCamera(currentCamera.id, dataToSend);
        setSuccess('Camera aggiornata con successo!');
      } else {
        await createCamera(dataToSend);
        setSuccess('Camera creata con successo!');
      }

      setTimeout(() => {
        handleCloseDialog();
        loadData();
      }, 1500);
    } catch (err) {
      console.error('Errore salvataggio camera:', err);
      setError(err.response?.data?.error || 'Errore nel salvataggio della camera');
    }
  };

  const handleDelete = async (id, numeroCamera) => {
    if (!window.confirm(`Sei sicuro di voler eliminare la camera ${numeroCamera}?`)) {
      return;
    }

    try {
      await deleteCamera(id);
      setSuccess('Camera eliminata con successo!');
      loadData();
    } catch (err) {
      console.error('Errore eliminazione camera:', err);
      setError(err.response?.data?.error || 'Errore nell\'eliminazione della camera');
    }
  };

  const getStatoColor = (stato) => {
    switch (stato) {
      case 'Libera': return 'success';
      case 'Parziale': return 'warning';
      case 'Completa': return 'error';
      default: return 'default';
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
        <Typography variant="h4" component="h1">
          Gestione Camere
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadData}
            sx={{ mr: 1 }}
          >
            Aggiorna
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nuova Camera
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

      {/* Tabella Camere */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Numero</strong></TableCell>
              <TableCell><strong>Edificio</strong></TableCell>
              <TableCell><strong>Piano</strong></TableCell>
              <TableCell><strong>Ala</strong></TableCell>
              <TableCell><strong>Posti</strong></TableCell>
              <TableCell><strong>Genere</strong></TableCell>
              <TableCell><strong>Categoria</strong></TableCell>
              <TableCell><strong>Stato</strong></TableCell>
              <TableCell><strong>Condizione</strong></TableCell>
              <TableCell align="center"><strong>Azioni</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!camere || camere.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography variant="body2" color="textSecondary">
                    Nessuna camera disponibile
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              camere.map((camera) => (
                <TableRow key={camera.id} hover>
                  <TableCell>{camera.numero_camera}</TableCell>
                  <TableCell>{camera.edificio}</TableCell>
                  <TableCell>{camera.piano}</TableCell>
                  <TableCell>{camera.ala || '-'}</TableCell>
                  <TableCell>
                    {camera.posti_occupati || 0}/{camera.nr_posti}
                  </TableCell>
                  <TableCell>{camera.genere}</TableCell>
                  <TableCell>{camera.categoria?.descrizione || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={camera.stato || 'N/A'}
                      color={getStatoColor(camera.stato)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {camera.agibile === false && (
                        <Tooltip title="Camera non agibile - Non è possibile assegnare militari">
                          <Chip
                            icon={<CancelIcon />}
                            label="Non Agibile"
                            size="small"
                            color="error"
                          />
                        </Tooltip>
                      )}
                      {camera.manutenzione === true && (
                        <Tooltip title="Camera in manutenzione - Solo informativo">
                          <Chip
                            icon={<BuildIcon />}
                            label="Manutenzione"
                            size="small"
                            color="warning"
                          />
                        </Tooltip>
                      )}
                      {camera.agibile !== false && camera.manutenzione !== true && (
                        <Tooltip title="Camera operativa">
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Operativa"
                            size="small"
                            color="success"
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(camera)}
                      title="Modifica"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(camera.id, camera.numero_camera)}
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

      {/* Dialog Crea/Modifica Camera */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editMode ? 'Modifica Camera' : 'Nuova Camera'}
          </DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Numero Camera */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Numero Camera"
                  name="numero_camera"
                  value={formData.numero_camera}
                  onChange={handleChange}
                  disabled={editMode}
                />
              </Grid>

              {/* Categoria */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Categoria"
                  name="id_categoria"
                  value={formData.id_categoria}
                  onChange={handleChange}
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        style: {
                          maxHeight: 300
                        }
                      }
                    }
                  }}
                >
                  <MenuItem value="">Seleziona categoria</MenuItem>
                  {categorie.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.descrizione}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Edificio */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Edificio"
                  name="edificio"
                  value={formData.edificio}
                  onChange={handleChange}
                >
                  <MenuItem value="nuovo">Nuovo</MenuItem>
                  <MenuItem value="vecchio">Vecchio</MenuItem>
                </TextField>
              </Grid>

              {/* Piano */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Piano"
                  name="piano"
                  value={formData.piano}
                  onChange={handleChange}
                  inputProps={{ min: 0, max: 20 }}
                />
              </Grid>

              {/* Ala */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  select
                  label="Ala"
                  name="ala"
                  value={formData.ala}
                  onChange={handleChange}
                  SelectProps={{
                    displayEmpty: true
                  }}
                >
                  <MenuItem value="">Nessuna</MenuItem>
                  <MenuItem value="levante">Levante</MenuItem>
                  <MenuItem value="ponente">Ponente</MenuItem>
                </TextField>
              </Grid>

              {/* Numero Posti */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Numero Posti"
                  name="nr_posti"
                  value={formData.nr_posti}
                  onChange={handleChange}
                  inputProps={{ min: 1, max: 10 }}
                />
              </Grid>

              {/* Genere */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Genere"
                  name="genere"
                  value={formData.genere}
                  onChange={handleChange}
                >
                  <MenuItem value="">Seleziona genere</MenuItem>
                  <MenuItem value="maschile">Maschile</MenuItem>
                  <MenuItem value="femminile">Femminile</MenuItem>
                </TextField>
              </Grid>

              {/* NUOVI CAMPI: Agibile e Manutenzione */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="subtitle2" gutterBottom color="primary">
                    Stato Camera
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Tooltip title="Se disattivato, NON sarà possibile assegnare militari a questa camera">
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.agibile}
                              onChange={handleChange}
                              name="agibile"
                              color="success"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                Camera Agibile
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formData.agibile 
                                  ? 'La camera è disponibile per assegnazioni' 
                                  : 'ATTENZIONE: Non è possibile assegnare militari'}
                              </Typography>
                            </Box>
                          }
                        />
                      </Tooltip>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Tooltip title="Flag informativo - Non impedisce le assegnazioni">
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.manutenzione}
                              onChange={handleChange}
                              name="manutenzione"
                              color="warning"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                In Manutenzione
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formData.manutenzione 
                                  ? 'Camera segnalata in manutenzione' 
                                  : 'Nessuna manutenzione in corso'}
                              </Typography>
                            </Box>
                          }
                        />
                      </Tooltip>
                    </Grid>
                  </Grid>

                  {!formData.agibile && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      <strong>Attenzione!</strong> Disattivando l'agibilità, questa camera non potrà ricevere nuove assegnazioni.
                    </Alert>
                  )}
                </Paper>
              </Grid>

              {/* Note */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
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
              {editMode ? 'Salva Modifiche' : 'Crea Camera'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default GestioneCamere;