import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { showToast } from "@/components/ui/AppToast";
import DndTable from "@/components/dataTabla/DndTable";
import UserFormBase from "@/modules/maintenance/users/components/UserFormBase";
import { useDialogStore } from "@/app/store/dialogStore";
import { useUsersStore, type User } from "@/store/users/users.store";
import MaintenancePageFrame from "../../components/MaintenancePageFrame";
import { useModulePermissionsStore } from "@/store/permissions/modulePermissions.store";
import type { ModuleCode } from "@/app/auth/mockModulePermissions";
import { useMaintenanceAccessResolver } from "../../permissions/useMaintenanceAccessResolver";

const resolveUserId = (user?: Partial<User>) => Number(user?.UsuarioID ?? 0);

type UserListProps = { userType?: "INTERNO" | "EXTERNO" };

const UserList = ({ userType = "INTERNO" }: UserListProps) => {
  const location = useLocation();
  const isAssociateList = userType === "EXTERNO";
  const isSecurityRoute = location.pathname.startsWith("/seguridad");
  const openDialog = useDialogStore((s) => s.openDialog);
  const canAccessAction = useModulePermissionsStore((s) => s.canAccessAction);
  const resolveAccess = useMaintenanceAccessResolver();
  const { users, fetchUsers, addUser, updateUser, deleteUser } =
    useUsersStore();
  const submitUserRef = useRef<(() => Promise<boolean>) | null>(null);
  const [usersEstado, setUsersEstado] = useState<"ACTIVO" | "INACTIVO">(
    "ACTIVO",
  );
  const permissionModule: ModuleCode = isSecurityRoute
    ? "security"
    : "maintenance";
  const maintenanceAccess = resolveAccess(
    isAssociateList ? "maintenance.associates" : "maintenance.users",
  );
  const canCreate = isSecurityRoute
    ? canAccessAction(permissionModule, "create")
    : maintenanceAccess.create;
  const canEdit = isSecurityRoute
    ? canAccessAction(permissionModule, "edit")
    : maintenanceAccess.edit;
  const canDelete = isSecurityRoute
    ? canAccessAction(permissionModule, "delete")
    : maintenanceAccess.delete;

  useEffect(() => {
    fetchUsers(usersEstado);
  }, [fetchUsers, usersEstado]);

  const openUserModal = useCallback(
    (mode: "create" | "edit", user?: User) => {
      openDialog({
        title: isAssociateList
          ? mode === "create"
            ? "Registrar asociado"
            : "Editar asociado"
          : mode === "create"
            ? "Crear usuario"
            : "Editar usuario",
        description:
          mode === "create"
            ? isAssociateList
              ? "Registra una nueva cuenta externa como asociado."
              : "Registra un nuevo usuario desde este formulario."
            : isAssociateList
              ? "Actualiza la información del asociado seleccionado."
              : "Actualiza la información del usuario seleccionado.",
        size: "xxl",
        confirmLabel: mode === "create" ? "Crear" : "Guardar",
        cancelLabel: "Cancelar",
        dangerLabel:
          mode === "edit" && canDelete && user?.UsuarioEstado === "ACTIVO"
            ? "Desactivar"
            : undefined,
        onConfirm: async () => {
          const submitForm = submitUserRef.current;
          if (typeof submitForm !== "function") return false;
          return submitForm();
        },
        onDanger:
          mode === "edit" && canDelete && user?.UsuarioEstado === "ACTIVO"
            ? async () => {
                const id = resolveUserId(user);
                if (!id) return false;
                openDialog({
                  title: isAssociateList
                    ? "Desactivar asociado"
                    : "Desactivar usuario",
                  size: "sm",
                  confirmLabel: "Desactivar",
                  cancelLabel: "Cancelar",
                  onConfirm: async () => {
                    const ok = await deleteUser(id);
                    if (!ok) {
                      showToast({
                        title: "Error",
                        description: `No se pudo desactivar el ${isAssociateList ? "asociado" : "usuario"}`,
                        type: "error",
                      });
                      return false;
                    }
                    showToast({
                      title: "Exito",
                      description: `${isAssociateList ? "Asociado" : "Usuario"} desactivado`,
                      type: "success",
                    });
                    await fetchUsers(usersEstado);
                    return true;
                  },
                  content: () => (
                    <p className="text-sm text-slate-700">
                      ¿Deseas desactivar {isAssociateList ? "este asociado" : "este usuario"}? Podrás reactivarlo desde Inactivos.
                      <br />
                      La cuenta quedará en la lista de Inactivos.
                    </p>
                  ),
                });
                return false;
              }
            : undefined,
        content: () => (
          <UserFormBase
            mode={mode}
            forcedUserType={userType}
            initialData={user}
            hideHeaderActions
            showUsersTable={false}
            onRegisterSubmit={(submit) => {
              submitUserRef.current = submit;
            }}
            onSave={async (payload) => {
              if (mode === "create") {
                const ok = await addUser(payload);
                if (!ok) {
                  showToast({
                    title: "Error",
                    description: `No se pudo crear el ${isAssociateList ? "asociado" : "usuario"}`,
                    type: "error",
                  });
                  return false;
                }
                showToast({
                  title: "Exito",
                  description: `${isAssociateList ? "Asociado" : "Usuario"} creado correctamente`,
                  type: "success",
                });
                await fetchUsers(usersEstado);
                return true;
              }

              const id = resolveUserId(user);
              if (!id) return false;
              const ok = await updateUser(id, payload);
              if (!ok) {
                showToast({
                  title: "Error",
                  description: `No se pudo actualizar el ${isAssociateList ? "asociado" : "usuario"}`,
                  type: "error",
                });
                return false;
              }
              showToast({
                title: "Exito",
                description: `${isAssociateList ? "Asociado" : "Usuario"} actualizado`,
                type: "success",
              });
              await fetchUsers(usersEstado);
              return true;
            }}
            onNew={() => {}}
          />
        ),
      });
    },
    [
      canDelete,
      openDialog,
      addUser,
      updateUser,
      deleteUser,
      fetchUsers,
      usersEstado,
      userType,
      isAssociateList,
    ],
  );

  const handleDeleteUser = useCallback(
    (user: User) => {
      if (!canDelete) return;
      const id = resolveUserId(user);
      if (!id) return;

      openDialog({
        title: isAssociateList ? "Desactivar asociado" : "Desactivar usuario",
        size: "sm",
        confirmLabel: "Desactivar",
        cancelLabel: "Cancelar",
        onConfirm: async () => {
          const ok = await deleteUser(id);
          if (!ok) {
            showToast({
              title: "Error",
              description: `No se pudo desactivar el ${isAssociateList ? "asociado" : "usuario"}`,
              type: "error",
            });
            return false;
          }
          showToast({
            title: "Exito",
            description: `${isAssociateList ? "Asociado" : "Usuario"} desactivado`,
            type: "success",
          });
          await fetchUsers(usersEstado);
          return true;
        },
        content: () => (
          <p className="text-sm text-slate-700">
            ¿Deseas desactivar {isAssociateList ? "al asociado" : "al usuario"} {user.UsuarioAlias}? Podrás reactivarlo desde Inactivos.
            <br />
            La cuenta quedará en la lista de Inactivos.
          </p>
        ),
      });
    },
    [canDelete, openDialog, deleteUser, fetchUsers, usersEstado, isAssociateList],
  );

  const columnHelper = createColumnHelper<User>();
  const columns = useMemo(
    () => [
      ...(isAssociateList
        ? [
            columnHelper.accessor("Nombres", {
              header: "Nombres",
              cell: (info) => info.getValue() ?? "-",
            }),
            columnHelper.accessor("Apellidos", {
              header: "Apellidos",
              cell: (info) => info.getValue() ?? "-",
            }),
            columnHelper.accessor("CanalVentaNombre", {
              header: "Canal de venta",
              cell: (info) => info.getValue() ?? "-",
            }),
          ]
        : []),
      columnHelper.accessor("UsuarioAlias", {
        header: "Usuario",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("area", {
        header: "Área",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("UsuarioEstado", {
        header: "Estado",
        cell: (info) => info.getValue(),
      }),
      columnHelper.display({
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => openUserModal("edit", row.original)}
              className="text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={!canDelete || row.original.UsuarioEstado !== "ACTIVO"}
              onClick={() => handleDeleteUser(row.original)}
              className="text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-40"
              title={row.original.UsuarioEstado === "ACTIVO" ? "Desactivar" : "Usuario inactivo"}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      }),
    ],
    [
      canDelete,
      canEdit,
      columnHelper,
      openUserModal,
      handleDeleteUser,
      isAssociateList,
    ],
  );

  const visibleUsers = useMemo(
    () =>
      users
        .filter((user) => user.TipoUsuario === userType)
        .sort((a, b) =>
          a.UsuarioAlias.localeCompare(b.UsuarioAlias, "es", {
            sensitivity: "base",
          }),
        ),
    [users, userType],
  );

  return (
    <MaintenancePageFrame
      title={isAssociateList ? "Asociados" : "Usuarios"}
      description={
        isAssociateList
          ? "Gestiona las cuentas externas asociadas a los canales de venta."
          : "Gestiona los usuarios internos del sistema."
      }
    >
      <DndTable
        data={visibleUsers}
        columns={columns}
        enableDateFilter={false}
        headerAction={
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8612A] text-white shadow-sm transition-colors hover:bg-[#d55320]"
            disabled={!canCreate}
            onClick={() => openUserModal("create")}
            title={isAssociateList ? "Nuevo asociado" : "Nuevo usuario"}
            aria-label={isAssociateList ? "Nuevo asociado" : "Nuevo usuario"}
          >
            <Plus className="h-5 w-5" />
          </button>
        }
        dateFilterComponent={() => (
          <select
            value={usersEstado}
            onChange={(e) => setUsersEstado(e.target.value as "ACTIVO" | "INACTIVO")}
            className="w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </select>
        )}
      />
    </MaintenancePageFrame>
  );
};

export default UserList;
