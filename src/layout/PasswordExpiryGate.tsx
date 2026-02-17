import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";

import UserFormBase from "@/modules/maintenance/users/components/UserFormBase";
import { useDialogStore } from "@/app/store/dialogStore";
import { useAuthStore } from "@/store/auth/auth.store";
import { useUsersStore } from "@/store/users/users.store";

const PasswordExpiryGate = () => {
  const navigate = useNavigate();
  const { user, passwordMustChange, passwordExpiryDate, logout } = useAuthStore();
  const { users, fetchUsers, updateUser } = useUsersStore();
  const openDialog = useDialogStore((s) => s.openDialog);
  const closeDialog = useDialogStore((s) => s.closeDialog);

  const [loadingUser, setLoadingUser] = useState(false);
  const isDialogOpenedRef = useRef(false);
  const fallbackLogoutRef = useRef(false);
  const submitForcedPasswordRef = useRef<(() => Promise<boolean>) | null>(null);

  const currentUserId = Number(user?.id ?? 0);
  const currentUserRecord = useMemo(() => {
    if (!currentUserId) return null;

    const byId = users.find((u) => Number(u.UsuarioID) === currentUserId);
    if (byId) return byId;

    const normalizedUsername = String(user?.username ?? "").trim().toUpperCase();
    if (!normalizedUsername) return null;
    return (
      users.find(
        (u) => String(u.UsuarioAlias ?? "").trim().toUpperCase() === normalizedUsername,
      ) ?? null
    );
  }, [users, currentUserId, user?.username]);

  useEffect(() => {
    if (!passwordMustChange || !currentUserId) return;

    let active = true;
    const loadCurrentUser = async () => {
      setLoadingUser(true);
      try {
        await fetchUsers("ACTIVO");
        if (!active) return;

        const usersAfterActive = useUsersStore.getState().users;
        const hasCurrentUser = usersAfterActive.some(
          (u) => Number(u.UsuarioID) === currentUserId,
        );

        if (!hasCurrentUser) {
          await fetchUsers("");
        }
      } finally {
        if (active) setLoadingUser(false);
      }
    };

    void loadCurrentUser();
    return () => {
      active = false;
    };
  }, [passwordMustChange, currentUserId, fetchUsers]);

  const handleSaveForcedPassword = useCallback(
    async (values: Record<string, unknown>) => {
      if (!currentUserRecord) {
        toast.error("No se pudo identificar el usuario actual para actualizar la clave.");
        return false;
      }

      const ok = await updateUser(Number(currentUserRecord.UsuarioID), {
        ...values,
        UsuarioFechaReg: currentUserRecord.UsuarioFechaReg,
      });

      if (!ok) {
        toast.error("No se pudo actualizar la contrasena.");
        return false;
      }

      toast.success("Contrasena actualizada. Inicia sesion nuevamente.");
      logout();
      navigate("/login", { replace: true });
      return true;
    },
    [currentUserRecord, updateUser, logout, navigate],
  );

  useEffect(() => {
    if (!passwordMustChange) {
      fallbackLogoutRef.current = false;
      if (isDialogOpenedRef.current) {
        closeDialog();
        isDialogOpenedRef.current = false;
      }
      return;
    }

    if (loadingUser || currentUserRecord || fallbackLogoutRef.current) return;

    fallbackLogoutRef.current = true;
    toast.error("No se pudo cargar tu usuario. Inicia sesion nuevamente.");
    logout();
    navigate("/login", { replace: true });
  }, [
    passwordMustChange,
    loadingUser,
    currentUserRecord,
    closeDialog,
    logout,
    navigate,
  ]);

  useEffect(() => {
    if (!passwordMustChange || loadingUser || !currentUserRecord) return;
    if (isDialogOpenedRef.current) return;

    openDialog({
      title: `Tu contrasena vencio el ${passwordExpiryDate ?? "sin fecha"}.`,
      description:
        "Debes actualizar tu contrasena para continuar. La aplicacion permanecera bloqueada hasta completar este cambio.",
      size: "xl",
      showCancel: false,
      disableClose: true,
      confirmLabel: "Actualizar clave",
      onConfirm: async () => {
        const submitForcedPassword = submitForcedPasswordRef.current;
        if (typeof submitForcedPassword !== "function") {
          toast.error("No se pudo preparar el formulario para actualizar la clave.");
          return false;
        }

        const ok = await submitForcedPassword();
        return ok;
      },
      content: () => (
        <div className="space-y-3">
          <UserFormBase
            mode="edit"
            initialData={currentUserRecord}
            onSave={handleSaveForcedPassword}
            passwordChangeOnly
            hideHeaderActions
            onRegisterSubmit={(submit) => {
              submitForcedPasswordRef.current = submit;
            }}
          />
        </div>
      ),
      onClose: () => {
        submitForcedPasswordRef.current = null;
        isDialogOpenedRef.current = false;
      },
    });

    isDialogOpenedRef.current = true;
  }, [
    passwordMustChange,
    loadingUser,
    currentUserRecord,
    openDialog,
    passwordExpiryDate,
  ]);

  return null;
};

export default PasswordExpiryGate;
