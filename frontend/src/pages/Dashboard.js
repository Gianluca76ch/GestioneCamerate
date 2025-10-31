import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  ButtonGroup,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  Man as ManIcon,
  Woman as WomanIcon,
  People as PeopleIcon,
  Hotel as HotelIcon,
  Build as BuildIcon, // <-- AGGIUNGI QUESTA (icona manutenzione)
  DoNotDisturb as DoNotDisturbIcon,
} from "@mui/icons-material";
import { getAllCamere } from "../services/camereService";
import { getOccupazioneCamera } from "../services/assegnazioniService";

const Dashboard = () => {
  const [camere, setCamere] = useState([]);
  const [camereFiltrate, setCamereFiltrate] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtri
  const [edificioSelezionato, setEdificioSelezionato] = useState("nuovo");
  const [pianoSelezionato, setPianoSelezionato] = useState(null);
  const [alaSelezionata, setAlaSelezionata] = useState("tutte");

  // Piani e ale disponibili
  const [pianiDisponibili, setPianiDisponibili] = useState([]);
  const [aleDisponibili, setAleDisponibili] = useState([]);

  // Modal dettaglio
  const [openModal, setOpenModal] = useState(false);
  const [cameraSelezionata, setCameraSelezionata] = useState(null);
  const [dettaglioCamera, setDettaglioCamera] = useState(null);
  const [loadingDettaglio, setLoadingDettaglio] = useState(false);

  // Statistiche
  const [stats, setStats] = useState({
    totale: 0,
    libere: 0,
    parziali: 0,
    complete: 0,
  });

  useEffect(() => {
    loadCamere();
  }, []);

  useEffect(() => {
    filtraCamere();
  }, [camere, edificioSelezionato, pianoSelezionato, alaSelezionata]);

  const loadCamere = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllCamere();
      setCamere(response.data || []);
    } catch (err) {
      console.error("Errore caricamento camere:", err);
      setError("Errore nel caricamento delle camere");
    } finally {
      setLoading(false);
    }
  };

  const filtraCamere = () => {
    let filtrate = camere.filter((c) => c.edificio === edificioSelezionato);

    // Estrai piani disponibili per l'edificio selezionato
    const piani = [...new Set(filtrate.map((c) => c.piano))].sort(
      (a, b) => a - b
    );
    setPianiDisponibili(piani);

    // Se nessun piano selezionato, seleziona il primo
    if (pianoSelezionato === null && piani.length > 0) {
      setPianoSelezionato(piani[0]);
    }

    // Filtra per piano
    if (pianoSelezionato !== null) {
      filtrate = filtrate.filter((c) => c.piano === pianoSelezionato);
    }

    // Estrai ale disponibili per piano selezionato
    const ale = [...new Set(filtrate.map((c) => c.ala).filter(Boolean))];
    setAleDisponibili(ale);

    // Filtra per ala
    if (alaSelezionata !== "tutte") {
      filtrate = filtrate.filter((c) => c.ala === alaSelezionata);
    }

    // Ordina per numero camera
    filtrate.sort((a, b) => {
      const numA = parseInt(a.numero_camera.replace(/\D/g, ""));
      const numB = parseInt(b.numero_camera.replace(/\D/g, ""));
      return numA - numB;
    });

    setCamereFiltrate(filtrate);
    calcolaStatistiche(filtrate);
  };

  const calcolaStatistiche = (camere) => {
    const totale = camere.length;
    const libere = camere.filter((c) => c.stato === "Libera").length;
    const parziali = camere.filter((c) => c.stato === "Parziale").length;
    const complete = camere.filter((c) => c.stato === "Completa").length;

    setStats({ totale, libere, parziali, complete });
  };

  const handleEdificioChange = (edificio) => {
    setEdificioSelezionato(edificio);
    setPianoSelezionato(null);
    setAlaSelezionata("tutte");
  };

  const handlePianoChange = (piano) => {
    setPianoSelezionato(piano);
    setAlaSelezionata("tutte");
  };

  const handleCardClick = async (camera) => {
    setCameraSelezionata(camera);
    setOpenModal(true);
    setLoadingDettaglio(true);

    try {
      const response = await getOccupazioneCamera(camera.id);
      setDettaglioCamera(response.data);
    } catch (err) {
      console.error("Errore caricamento dettaglio:", err);
    } finally {
      setLoadingDettaglio(false);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setCameraSelezionata(null);
    setDettaglioCamera(null);
  };

  const getBordoColorByOccupazione = (camera) => {
    const occupati = camera.posti_occupati || 0;
    const totali = camera.nr_posti;

    if (occupati === 0) return "#4caf50"; // Verde - Libera
    if (occupati === totali) return "#f44336"; // Rosso - Completa
    return "#ff9800"; // Arancione - Parziale
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
      {/* Header */}
      <Typography variant="h4" gutterBottom>
        Dashboard Camere
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filtri */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Filtro Edificio */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" gutterBottom>
              Edificio
            </Typography>
            <ButtonGroup fullWidth variant="outlined">
              <Button
                variant={
                  edificioSelezionato === "nuovo" ? "contained" : "outlined"
                }
                onClick={() => handleEdificioChange("nuovo")}
              >
                Nuovo
              </Button>
              <Button
                variant={
                  edificioSelezionato === "vecchio" ? "contained" : "outlined"
                }
                onClick={() => handleEdificioChange("vecchio")}
              >
                Vecchio
              </Button>
            </ButtonGroup>
          </Grid>

          {/* Filtro Piano */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Piano
            </Typography>
            <ButtonGroup
              fullWidth
              variant="outlined"
              sx={{ flexWrap: "nowrap" }}
            >
              {pianiDisponibili.map((piano) => (
                <Button
                  key={piano}
                  variant={
                    pianoSelezionato === piano ? "contained" : "outlined"
                  }
                  onClick={() => handlePianoChange(piano)}
                  sx={{
                    whiteSpace: "nowrap",
                    minWidth: "auto",
                    px: 2,
                  }}
                >
                  P{piano}
                </Button>
              ))}
            </ButtonGroup>
          </Grid>

          {/* Filtro Ala */}
          {aleDisponibili.length > 0 && (
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" gutterBottom>
                Ala
              </Typography>
              <ButtonGroup
                fullWidth
                variant="outlined"
                sx={{ flexWrap: "nowrap" }}
              >
                <Button
                  variant={
                    alaSelezionata === "tutte" ? "contained" : "outlined"
                  }
                  onClick={() => setAlaSelezionata("tutte")}
                  sx={{ whiteSpace: "nowrap", px: 2 }}
                >
                  Tutte
                </Button>
                {aleDisponibili.includes("levante") && (
                  <Button
                    variant={
                      alaSelezionata === "levante" ? "contained" : "outlined"
                    }
                    onClick={() => setAlaSelezionata("levante")}
                    sx={{ whiteSpace: "nowrap", px: 2 }}
                  >
                    Lev.
                  </Button>
                )}
                {aleDisponibili.includes("ponente") && (
                  <Button
                    variant={
                      alaSelezionata === "ponente" ? "contained" : "outlined"
                    }
                    onClick={() => setAlaSelezionata("ponente")}
                    sx={{ whiteSpace: "nowrap", px: 2 }}
                  >
                    Pon.
                  </Button>
                )}
              </ButtonGroup>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Statistiche */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <HotelIcon sx={{ fontSize: 40, color: "primary.main" }} />
            <Typography variant="h4">{stats.totale}</Typography>
            <Typography variant="body2" color="textSecondary">
              Totale Camere
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#e8f5e9" }}>
            <Typography variant="h4" color="success.main">
              {stats.libere}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Libere
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#fff3e0" }}>
            <Typography variant="h4" color="warning.main">
              {stats.parziali}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Parziali
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#ffebee" }}>
            <Typography variant="h4" color="error.main">
              {stats.complete}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Complete
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Griglia Camere */}
      <Grid container spacing={2}>
        {camereFiltrate.length === 0 ? (
          <Grid item xs={12}>
            <Alert severity="info">
              Nessuna camera trovata con i filtri selezionati
            </Alert>
          </Grid>
        ) : (
          camereFiltrate.map((camera) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={camera.id}>
              <Card
                sx={{
                  cursor: "pointer",
                  transition: "all 0.3s",
                  bgcolor: "#fafafa",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                    bgcolor: "#f5f5f5",
                  },
                  borderLeft: `6px solid ${getBordoColorByOccupazione(camera)}`,
                }}
                onClick={() => handleCardClick(camera)}
              >
                <CardContent>
                  {/* Numero Camera */}
                  <Typography
                    variant="h5"
                    gutterBottom
                    fontWeight="bold"
                    color="text.primary"
                  >
                    {camera.numero_camera}
                  </Typography>

                  {/* Categoria */}
                  <Chip
                    label={camera.categoria?.descrizione || "N/A"}
                    size="small"
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />

                  {/* Genere */}
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    {camera.genere === "maschile" ? (
                      <ManIcon color="primary" fontSize="small" />
                    ) : (
                      <WomanIcon color="secondary" fontSize="small" />
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {camera.genere === "maschile" ? "Maschile" : "Femminile"}
                    </Typography>
                  </Box>

                  {/* Occupazione */}
                  <Box display="flex" alignItems="center" gap={1}>
                    <PeopleIcon fontSize="small" color="action" />
                    <Typography variant="body1" fontWeight="bold">
                      {camera.posti_occupati || 0}/{camera.nr_posti} posti
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                    {camera.agibile === false && (
                      <Chip
                        icon={<DoNotDisturbIcon />}
                        label="Non Agibile"
                        size="small"
                        color="error"
                        variant="filled"
                      />
                    )}
                    {camera.manutenzione === true && (
                      <Chip
                        icon={<BuildIcon />}
                        label="Manutenzione"
                        size="small"
                        color="warning"
                        variant="filled"
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Modal Dettaglio Camera */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {cameraSelezionata && (
            <>
              Camera {cameraSelezionata.numero_camera}
              <Typography variant="body2" color="textSecondary">
                {cameraSelezionata.edificio} - Piano {cameraSelezionata.piano}
                {cameraSelezionata.ala && ` - Ala ${cameraSelezionata.ala}`}
              </Typography>
            </>
          )}
        </DialogTitle>
        <DialogContent>
          {loadingDettaglio ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : dettaglioCamera ? (
            <>
              <Typography variant="h6" gutterBottom>
                Occupazione
              </Typography>
              <Grid container spacing={2} mb={2}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">
                    Totale Posti
                  </Typography>
                  <Typography variant="h5">
                    {dettaglioCamera.posti_totali}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">
                    Occupati
                  </Typography>
                  <Typography variant="h5" color="error.main">
                    {dettaglioCamera.posti_occupati}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">
                    Liberi
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {dettaglioCamera.posti_liberi}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Alloggiati ({dettaglioCamera.alloggiati.length})
              </Typography>
              {dettaglioCamera.alloggiati.length === 0 ? (
                <Alert severity="info">Camera vuota</Alert>
              ) : (
                <List>
                  {dettaglioCamera.alloggiati.map((alloggiato, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={`${alloggiato.cognome} ${alloggiato.nome}`}
                        secondary={`${alloggiato.grado} - ${alloggiato.categoria} - Mat. ${alloggiato.matricola}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </>
          ) : (
            <Alert severity="error">Errore nel caricamento dei dettagli</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Chiudi</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
