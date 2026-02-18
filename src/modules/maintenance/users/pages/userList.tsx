import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import DndTable from "@/components/dataTabla/DndTable";
import UserFormBase from "@/modules/maintenance/users/components/UserFormBase";
import { useDialogStore } from "@/app/store/dialogStore";
import { useUsersStore, type User } from "@/store/users/users.store";
import MaintenancePageFrame from "../../components/MaintenancePageFrame";

const resolveUserId = (user?: Partial<User>) => Number(user?.UsuarioID ?? 0);

const UserList = () => {
  const openDialog = useDialogStore((s) => s.openDialog);
  const { users, fetchUsers, addUser, updateUser, deleteUser } =
    useUsersStore();
  const submitUserRef = useRef<(() => Promise<boolean>) | null>(null);
  const [usersEstado, setUsersEstado] = useState<"ACTIVO" | "INACTIVO">(
    "ACTIVO",
  );

  useEffect(() => {
    fetchUsers(usersEstado);
  }, [fetchUsers, usersEstado]);

  const openUserModal = useCallback(
    (mode: "create" | "edit", user?: User) => {
      openDialog({
        title: mode === "create" ? "Crear usuario" : "Editar usuario",
        description:
          mode === "create"
            ? "Registra un nuevo usuario desde este formulario."
            : "Actualiza la información del usuario seleccionado.",
        size: "xxl",
        confirmLabel: mode === "create" ? "Crear" : "Guardar",
        cancelLabel: "Cancelar",
        dangerLabel: mode === "edit" ? "Eliminar" : undefined,
        onConfirm: async () => {
          const submitForm = submitUserRef.current;
          if (typeof submitForm !== "function") return false;
          return submitForm();
        },
        onDanger:
          mode === "edit"
            ? async () => {
                const id = resolveUserId(user);
                if (!id) return false;
                openDialog({
                  title: "Eliminar usuario",
                  size: "sm",
                  confirmLabel: "Eliminar",
                  cancelLabel: "Cancelar",
                  onConfirm: async () => {
                    const ok = await deleteUser(id);
                    if (!ok) {
                      toast.error("No se pudo eliminar el usuario");
                      return false;
                    }
                    toast.success("Usuario eliminado");
                    await fetchUsers(usersEstado);
                    return true;
                  },
                  content: () => (
                    <p className="text-sm text-slate-700">
                      ¿Estás seguro de eliminar este usuario?
                      <br />
                      Esta acción no se puede deshacer.
                    </p>
                  ),
                });
                return false;
              }
            : undefined,
        content: () => (
          <UserFormBase
            mode={mode}
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
                  toast.error("No se pudo crear el usuario");
                  return false;
                }
                toast.success("Usuario creado correctamente");
                await fetchUsers(usersEstado);
                return true;
              }

              const id = resolveUserId(user);
              if (!id) return false;
              const ok = await updateUser(id, payload);
              if (!ok) {
                toast.error("No se pudo actualizar el usuario");
                return false;
              }
              toast.success("Usuario actualizado");
              await fetchUsers(usersEstado);
              return true;
            }}
            onNew={() => {}}
          />
        ),
      });
    },
    [openDialog, addUser, updateUser, deleteUser, fetchUsers, usersEstado],
  );

  const handleDeleteUser = useCallback(
    (user: User) => {
      const id = resolveUserId(user);
      if (!id) return;

      openDialog({
        title: "Eliminar usuario",
        size: "sm",
        confirmLabel: "Eliminar",
        cancelLabel: "Cancelar",
        onConfirm: async () => {
          const ok = await deleteUser(id);
          if (!ok) {
            toast.error("No se pudo eliminar el usuario");
            return false;
          }
          toast.success("Usuario eliminado");
          await fetchUsers(usersEstado);
          return true;
        },
        content: () => (
          <p className="text-sm text-slate-700">
            ¿Deseas eliminar el usuario {user.UsuarioAlias}?
            <br />
            Esta acción no se puede deshacer.
          </p>
        ),
      });
    },
    [openDialog, deleteUser, fetchUsers, usersEstado],
  );

  const columnHelper = createColumnHelper<User>();
  const columns = useMemo(
    () => [
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
              onClick={() => openUserModal("edit", row.original)}
              className="text-blue-600 hover:text-blue-800"
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteUser(row.original)}
              className="text-red-600 hover:text-red-800"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      }),
    ],
    [columnHelper, openUserModal, handleDeleteUser],
  );

  return (
    <MaintenancePageFrame
      title="Usuarios"
      description="Gestiona usuarios del sistema desde un único listado."
    >
      <DndTable
        data={users}
        columns={columns}
        enableDateFilter={false}
        headerAction={
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8612A] text-white shadow-sm transition-colors hover:bg-[#d55320]"
            onClick={() => openUserModal("create")}
            title="Nuevo usuario"
            aria-label="Nuevo usuario"
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
