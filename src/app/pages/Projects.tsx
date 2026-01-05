import {
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { CalendarRange, Clock } from "lucide-react";

const projects = [
  {
    name: "Nuevo onboarding",
    status: "En progreso",
    owner: "Ana Rivas",
    due: "20 Feb",
    progress: 68,
  },
  {
    name: "Portal clientes",
    status: "Descubrimiento",
    owner: "Luis Ortega",
    due: "12 Mar",
    progress: 34,
  },
  {
    name: "Infraestructura cloud",
    status: "Ejecución",
    owner: "Equipo DevOps",
    due: "05 Abr",
    progress: 82,
  },
];

const Projects = () => {
  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h4" fontWeight={700}>
          Proyectos
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitorea avances y responsables.
        </Typography>
      </Stack>

      <Grid container spacing={2}>
        {projects.map((project) => (
          <Grid size={{ xs: 12, md: 4 }} key={project.name}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="h6" fontWeight={700}>
                      {project.name}
                    </Typography>
                    <Chip
                      label={project.status}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    Responsable: {project.owner}
                  </Typography>

                  <Stack direction="row" spacing={1.5} color="text.secondary">
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Clock size={14} />
                      <Typography variant="body2">Progreso</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <CalendarRange size={14} />
                      <Typography variant="body2">{project.due}</Typography>
                    </Stack>
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={project.progress}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="right"
                  >
                    {project.progress}% completado
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
};

export default Projects;
