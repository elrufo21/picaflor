import {
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

const Settings = () => {
  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h4" fontWeight={700}>
          Ajustes
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configura las preferencias de tu espacio de trabajo.
        </Typography>
      </Stack>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <TextField label="Nombre del equipo" defaultValue="Equipo Picaflor" />
            <TextField
              label="Correo de notificaciones"
              type="email"
              defaultValue="equipo@picaflor.dev"
            />
            <FormControlLabel
              control={<Switch defaultChecked color="primary" />}
              label="Recibir notificaciones semanales"
            />
            <FormControlLabel
              control={<Switch color="primary" />}
              label="Habilitar modo enfocada"
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="outlined" color="inherit">
                Cancelar
              </Button>
              <Button variant="contained">Guardar cambios</Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default Settings;
