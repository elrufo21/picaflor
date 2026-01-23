import { Fragment, useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router";
import { X, LogOutIcon, MenuIcon } from "lucide-react";
import BreadCrumb from "./BreadCrumb";
import { useLayoutStore } from "../app/store/layoutStore";
import Dialog from "../components/ui/Dialog";
import { navigationItems } from "./navigation";
import { useAuthStore } from "@/store/auth/auth.store";
import { ButtonBase, ListItemIcon, Menu, MenuItem } from "@mui/material";

const MainLayout = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  const { isSidebarOpen, setSidebarOpen, toggleSidebar, closeSidebar } =
    useLayoutStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [navFilter, setNavFilter] = useState("");
  const open = Boolean(anchorEl);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const updateMatch = () => setIsDesktop(media.matches);
    updateMatch();
    media.addEventListener("change", updateMatch);
    return () => media.removeEventListener("change", updateMatch);
  }, []);

  useEffect(() => {
    setSidebarOpen(isDesktop);
  }, [isDesktop, setSidebarOpen]);

  const normalizedNavFilter = navFilter.trim().toLowerCase();
  const filteredNavigationItems = navigationItems.filter((item) => {
    if (!normalizedNavFilter) return true;
    const label = item.label.toLowerCase();
    const description = item.description?.toLowerCase() ?? "";
    return (
      label.includes(normalizedNavFilter) ||
      description.includes(normalizedNavFilter)
    );
  });

  const desktopNav = (
    <aside
      className={`hidden md:flex sticky top-0 h-screen  flex-col
  bg-[#0F0F0F] shadow-xl transition-all duration-300 ${
    isSidebarOpen ? "w-64" : "w-16"
  }`}
    >
      <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div
          className={`font-semibold text-white transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          Picaflor
        </div>

        <button
          onClick={toggleSidebar}
          className={`p-2 rounded-lg text-white  transition-colors ${
            !isSidebarOpen ? "absolute right-2 top-1/2 -translate-y-1/2" : ""
          }`}
          aria-label="Toggle sidebar"
        >
          <MenuIcon size={18} className="text-white" />
        </button>
      </div>

      <nav className="mt-4 flex flex-col gap-2 px-2 flex-1">
        {isSidebarOpen && (
          <div>
            <input
              type="text"
              value={navFilter}
              onChange={(e) => setNavFilter(e.target.value)}
              placeholder="Buscar"
              aria-label="Buscar en navegacion"
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#E8612A]/60"
            />
          </div>
        )}
        {filteredNavigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.to} className="flex flex-col gap-1">
              <NavLink
                to={item.to}
                end={item.end ?? false}
                className={({ isActive }) =>
                  [
                    "group relative flex items-center px-3 py-2 text-sm transition-all rounded-lg",
                    isSidebarOpen ? "gap-3" : "gap-0 justify-center px-2",
                    isActive
                      ? isSidebarOpen
                        ? "bg-white/10 text-white border-l-4 border-[#E8612A]"
                        : "text-[#E8612A]"
                      : "text-white/80 hover:bg-[#E8612A]/10 hover:text-white",
                  ].join(" ")
                }
              >
                <Icon
                  size={18}
                  className={`shrink-0 transition-all text-white ${
                    !isSidebarOpen ? "scale-110" : ""
                  }`}
                />

                <div
                  className={`flex flex-col leading-tight transition-opacity text-white duration-200 ${
                    isSidebarOpen
                      ? "opacity-100"
                      : "opacity-0 pointer-events-none w-0 overflow-hidden"
                  }`}
                >
                  <span className="font-medium">{item.label}</span>
                  {item.description && (
                    <span className="text-xs text-white/60">
                      {item.description}
                    </span>
                  )}
                </div>

                {!isSidebarOpen && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-[#E8612A] opacity-0 group-[.active]:opacity-100" />
                )}
              </NavLink>
              {isSidebarOpen &&
                item.children?.map((child) => {
                  const ChildIcon = child.icon;
                  return (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      end={child.end ?? false}
                      className={({ isActive }) =>
                        [
                          "group relative flex items-center px-3 py-2 text-sm transition-all rounded-lg ml-6 gap-2",
                          isActive
                            ? "bg-white/10 text-white border-l-4 border-[#E8612A]"
                            : "text-white/80 hover:bg-[#E8612A]/10 hover:text-white",
                        ].join(" ")
                      }
                    >
                      <ChildIcon size={16} className="text-white/80" />
                      <div className="flex flex-col leading-tight text-white">
                        <span className="font-medium">{child.label}</span>
                        {child.description && (
                          <span className="text-[11px] text-white/60">
                            {child.description}
                          </span>
                        )}
                      </div>
                    </NavLink>
                  );
                })}
            </div>
          );
        })}
      </nav>
    </aside>
  );

  const mobileNav = (
    <aside
      className={`fixed z-40 top-0 left-0 h-screen w-64 bg-brand text-paper
      shadow-xl transition-transform duration-300 md:hidden flex flex-col ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-paper/15">
        <div className="text-base font-semibold">Picaflor</div>
        <button
          onClick={closeSidebar}
          className="p-2 rounded-lg hover:bg-paper/15 transition-colors"
          aria-label="Cerrar menú"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="mt-4 flex flex-col gap-2 px-2 flex-1">
        <div>
          <input
            type="text"
            value={navFilter}
            onChange={(e) => setNavFilter(e.target.value)}
            placeholder="Buscar"
            aria-label="Buscar en navegacion"
            className="w-full rounded-md border border-paper/20 bg-paper/10 px-3 py-2 text-xs text-paper placeholder:text-paper/70 focus:outline-none focus:ring-2 focus:ring-paper/40"
          />
        </div>
        {filteredNavigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Fragment key={item.to}>
              <NavLink
                to={item.to}
                end={item.end ?? false}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                    isActive
                      ? "bg-paper/15 text-paper border-l-4 border-paper"
                      : "text-paper/90 hover:bg-paper/10",
                  ].join(" ")
                }
              >
                <Icon size={18} />
                <div className="flex flex-col leading-tight">
                  <span className="font-medium">{item.label}</span>
                  {item.description && (
                    <span className="text-xs text-paper/70">
                      {item.description}
                    </span>
                  )}
                </div>
              </NavLink>
              {item.children?.map((child) => {
                const ChildIcon = child.icon;
                return (
                  <NavLink
                    key={child.to}
                    to={child.to}
                    end={child.end ?? false}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all ml-4",
                        isActive
                          ? "bg-paper/15 text-paper border-l-4 border-paper"
                          : "text-paper/90 hover:bg-paper/10",
                      ].join(" ")
                    }
                  >
                    <ChildIcon size={16} />
                    <div className="flex flex-col leading-tight">
                      <span className="font-medium">{child.label}</span>
                      {child.description && (
                        <span className="text-xs text-paper/70">
                          {child.description}
                        </span>
                      )}
                    </div>
                  </NavLink>
                );
              })}
            </Fragment>
          );
        })}
      </nav>
    </aside>
  );
  return (
    <div className="flex min-h-screen h-screen text-ink overflow-hidden">
      {desktopNav}

      {isSidebarOpen && !isDesktop && (
        <div
          className="fixed inset-0 z-30 bg-ink/30 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {mobileNav}

      <div className="flex flex-col flex-1 min-h-screen overflow-hidden ">
        <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b bg-[#E8612A] border-ink/10 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-lg text-white hover:bg-brand/10 transition-colors"
              onClick={toggleSidebar}
              aria-label="Abrir menú"
            >
              <Menu size={18} className="text-white" />
            </button>
            <h1 className="text-lg font-semibold text-white">Picaflor</h1>
          </div>

          <div className="flex items-center gap-2">
            <ButtonBase
              onClick={handleOpenMenu}
              className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/10 transition-colors"
            >
              <div className="flex flex-col text-right leading-tight">
                <span className="text-xs text-white/70">Bienvenido</span>
                <span className="text-sm font-medium text-white">
                  {user?.displayName ?? "Usuario"}
                </span>
              </div>

              <MenuIcon className="text-white opacity-80" fontSize="small" />
            </ButtonBase>

            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleCloseMenu}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              PaperProps={{
                elevation: 6,
                sx: {
                  mt: 1,
                  minWidth: 180,
                  borderRadius: 2,
                  backgroundColor: "#0F0F0F",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.08)",
                },
              }}
            >
              <MenuItem
                onClick={() => {
                  handleCloseMenu();
                  logout();
                  navigate("/login", { replace: true });
                }}
                sx={{
                  fontSize: 14,
                  "&:hover": {
                    backgroundColor: "rgba(232,97,42,0.15)",
                  },
                }}
              >
                <ListItemIcon sx={{ color: "#E8612A", minWidth: 32 }}>
                  <LogOutIcon fontSize="small" />
                </ListItemIcon>
                Cerrar sesión
              </MenuItem>
            </Menu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-paper">
          <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-4">
            {location.pathname.startsWith("/maintenance") && <BreadCrumb />}
            <div className="mt-2 w-full">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      <Dialog />
    </div>
  );
};

export default MainLayout;
