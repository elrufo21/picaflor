import {
  AppBar,
  Avatar,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { Bell, Menu } from "lucide-react";

type HeaderProps = {
  onMenuClick: () => void;
  showMenuButton: boolean;
};

const Header = ({ onMenuClick, showMenuButton }: HeaderProps) => {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: "1px solid",
        borderColor: "divider",
        backgroundColor: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(6px)",
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        {(showMenuButton || !isDesktop) && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="Abrir menú"
            onClick={onMenuClick}
          >
            <Menu size={20} />
          </IconButton>
        )}

        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Picaflor
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: "auto" }}>
          <IconButton color="inherit" size="small" aria-label="Notificaciones">
            <Bell size={18} />
          </IconButton>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            RV
          </Avatar>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
