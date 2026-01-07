import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { Menu, X, LogOut } from "lucide-react";
import BreadCrumb from "./BreadCrumb";
import { useLayoutStore } from "../app/store/layoutStore";
import Dialog from "../components/ui/Dialog";
import { navigationItems } from "./navigation";
import { useAuthStore } from "@/store/auth/auth.store";

const MainLayout = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  const { isSidebarOpen, setSidebarOpen, toggleSidebar, closeSidebar } =
    useLayoutStore();
  const navigate = useNavigate();
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

  const desktopNav = (
    <aside
      className={`hidden md:flex sticky top-0 h-screen flex-shrink-0 flex-col bg-white border-r border-slate-200 shadow-sm transition-all duration-300 ${
        isSidebarOpen ? "w-64" : "w-16"
      }`}
    >
      <div className="relative flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div
          className={`text-base font-semibold text-slate-900 transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          Picaflor
        </div>
        <button
          onClick={toggleSidebar}
          className={`p-2 rounded hover:bg-slate-100 transition-colors ${
            !isSidebarOpen ? "absolute right-2 top-1/2 -translate-y-1/2" : ""
          }`}
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>
      </div>

      <nav className="mt-4 flex flex-col gap-1 px-2 flex-1 text-slate-700">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "hover:bg-slate-100",
                ].join(" ")
              }
            >
              <Icon size={18} />
              <div
                className={`flex flex-col leading-tight transition-opacity duration-200 ${
                  isSidebarOpen ? "opacity-100" : "opacity-0"
                }`}
              >
                <span>{item.label}</span>
                {item.description && (
                  <span className="text-xs text-slate-500">
                    {item.description}
                  </span>
                )}
              </div>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 text-center text-xs text-slate-500">
        {isSidebarOpen && (
          <>
            <div>Versión</div>
            <div className="font-semibold text-slate-800">Sprint 1</div>
          </>
        )}
      </div>
    </aside>
  );

  const mobileNav = (
    <aside
      className={`fixed z-40 top-0 left-0 h-screen bg-white shadow-xl text-slate-900 transition-transform duration-300 md:hidden w-64 flex flex-col ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="text-base font-semibold">Picaflor</div>
        <button
          onClick={closeSidebar}
          className="p-2 rounded hover:bg-slate-100 transition-colors"
          aria-label="Cerrar menú"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="mt-4 flex flex-col gap-1 px-2 flex-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeSidebar}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "hover:bg-slate-100",
                ].join(" ")
              }
            >
              <Icon size={18} />
              <div className="flex flex-col leading-tight">
                <span>{item.label}</span>
                {item.description && (
                  <span className="text-xs text-slate-500">
                    {item.description}
                  </span>
                )}
              </div>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );

  return (
    <div className="flex min-h-screen h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {desktopNav}

      {isSidebarOpen && !isDesktop && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {mobileNav}

      <div className="flex flex-col flex-1 min-h-screen overflow-hidden">
        <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-slate-200 bg-white shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded hover:bg-slate-100 transition-colors"
              onClick={toggleSidebar}
              aria-label="Abrir menú"
            >
              <Menu size={18} />
            </button>
            <h1 className="text-lg font-semibold">Picaflor</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right">
              <span className="text-sm text-slate-600">Bienvenido</span>
              <span className="text-xs text-slate-500">
                {user?.username ?? "Usuario"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
              className="p-2 rounded hover:bg-slate-100 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-4">
            <BreadCrumb />
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
