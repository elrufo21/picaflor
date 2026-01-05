import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { TrendingUp, Users, CheckCircle } from "lucide-react";
import { PDFViewer } from "@react-pdf/renderer";
import PdfDocument from "../../components/invoice/Invoice";
import MyPDFDocument from "../../components/invoice/Invoice2";

const stats = [
  {
    label: "Proyectos activos",
    value: "12",
    change: "+8%",
    icon: <TrendingUp size={18} />,
  },
  {
    label: "Colaboradores",
    value: "34",
    change: "Equipo",
    icon: <Users size={18} />,
  },
  {
    label: "Entregas del mes",
    value: "18",
    change: "92% a tiempo",
    icon: <CheckCircle size={18} />,
  },
];

const Dashboard = () => {
  return (
    <Stack spacing={3}>
      <div className="h-[500px]">
        {" "}
        <PDFViewer style={{ width: "100%", height: "100%" }}>
          <MyPDFDocument />
        </PDFViewer>
      </div>
      <Stack spacing={0.5}>
        <Typography variant="h4" fontWeight={700}>
          Panel
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Visión general de tu operación.
        </Typography>
      </Stack>

      <Grid container spacing={2}>
        {stats.map((item) => (
          <Grid size={{ xs: 12, sm: 4 }} key={item.label}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Chip
                    icon={item.icon}
                    label={item.change}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {item.label}
                  </Typography>
                </Stack>
                <Typography variant="h4" sx={{ mt: 1.5 }} fontWeight={700}>
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card variant="outlined">
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Progreso de entregas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Seguimiento consolidado de tus proyectos activos.
              </Typography>
            </Box>
            <Chip label="En curso" color="primary" variant="outlined" />
          </Stack>

          <Box sx={{ mt: 3 }}>
            <LinearProgress
              variant="determinate"
              value={72}
              sx={{ height: 10, borderRadius: 5 }}
            />
            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{ mt: 1 }}
              color="text.secondary"
            >
              <Typography variant="body2">72% completado</Typography>
              <Typography variant="body2">Meta: 30 entregas</Typography>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default Dashboard;
