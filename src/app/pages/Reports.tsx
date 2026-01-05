import {
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const reports = [
  { name: "Tráfico orgánico", period: "Últimos 7 días", delta: "+12%", status: "OK" },
  { name: "Costo adquisición", period: "Últimos 30 días", delta: "-4%", status: "Revisar" },
  { name: "NPS clientes", period: "Q1", delta: "+6 pts", status: "OK" },
];

const Reports = () => {
  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h4" fontWeight={700}>
          Reportes
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Métricas claves para decisiones rápidas.
        </Typography>
      </Stack>

      <Card variant="outlined">
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Periodo</TableCell>
                <TableCell>Variación</TableCell>
                <TableCell align="right">Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.name} hover>
                  <TableCell>{report.name}</TableCell>
                  <TableCell>{report.period}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {report.delta.startsWith("-") ? (
                        <ArrowDownRight size={14} color="#ef4444" />
                      ) : (
                        <ArrowUpRight size={14} color="#22c55e" />
                      )}
                      <Typography variant="body2" color="text.secondary">
                        {report.delta}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      size="small"
                      label={report.status}
                      color={report.status === "OK" ? "success" : "warning"}
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default Reports;
