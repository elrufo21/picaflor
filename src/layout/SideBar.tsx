import {
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { NavLink, useLocation } from "react-router";
import { X } from "lucide-react";
import { navigationItems } from "./navigation";

type SideBarProps = {
  open: boolean;
  onClose: () => void;
  isDesktop: boolean;
  drawerWidth: number;
};

const SideBar = ({ open, onClose, isDesktop, drawerWidth }: SideBarProps) => {
  const location = useLocation();

  const content = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            component="div"
            sx={{ fontWeight: 700, letterSpacing: 0.4 }}
          >
            Picaflor
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Navega tus espacios
          </Typography>
        </Box>
        <IconButton
          size="small"
          edge="end"
          aria-label="Cerrar menú"
          onClick={onClose}
          sx={{ display: isDesktop || open ? "inline-flex" : "none" }}
        >
          <X size={18} />
        </IconButton>
      </Box>
      <Divider />

      <List sx={{ px: 1, py: 1, flex: 1 }}>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.to ||
            location.pathname.startsWith(`${item.to}/`);

          return (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              selected={isActive}
              onClick={!isDesktop ? onClose : undefined}
              sx={{
                borderRadius: 1.5,
                mb: 0.5,
                alignItems: "flex-start",
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "& .MuiListItemIcon-root": {
                    color: "primary.contrastText",
                  },
                  "& .MuiListItemText-secondary": {
                    color: "primary.contrastText",
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 34, color: "text.secondary" }}>
                <Icon size={18} />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: 600 }}
                secondary={item.description}
                secondaryTypographyProps={{ noWrap: true }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Divider />
      <Box sx={{ px: 3, py: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Version
        </Typography>
        <Typography variant="body2" fontWeight={700}>
          Sprint 1
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={isDesktop ? "persistent" : "temporary"}
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          borderRight: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        },
      }}
    >
      {content}
    </Drawer>
  );
};

export default SideBar;
