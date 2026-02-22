import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";

import UserFormBase from "@/modules/maintenance/users/components/UserFormBase";
import { useDialogStore } from "@/app/store/dialogStore";
import { useAuthStore } from "@/store/auth/auth.store";
import { useUsersStore } from "@/store/users/users.store";

const PasswordExpiryGate = () => {
  const navigate = useNavigate();
  const {
    user,
    passwordMustChange,
    passwordExpiryDate,
    someExpiryDate,
    someMustRenew,
    logout,
  } = useAuthStore();
  const { users, fetchUsers, updateUser } = useUsersStore();
  const openDialog = useDialogStore((s) => s.openDialog);
  const closeDialog = useDialogStore((s) => s.closeDialog);

  const [loadingUser, setLoadingUser] = useState(false);
  const [hasResolvedCurrentUser, setHasResolvedCurrentUser] = useState(false);
  const activeDialogRef = useRef<"password" | "some" | null>(null);
  const fallbackLogoutRef = useRef(false);
  const submitForcedPasswordRef = useRef<(() => Promise<boolean>) | null>(null);

  const currentUserId = Number(user?.id ?? 0);
  const normalizedUsername = String(user?.username ?? "")
    .trim()
    .toUpperCase();

  const currentUserRecord = useMemo(() => {
    const byId =
      currentUserId > 0
        ? users.find((u) => Number(u.UsuarioID) === currentUserId)
        : null;
    if (byId) return byId;

    if (!normalizedUsername) return null;

    return (
      users.find(
        (u) =>
          String(u.UsuarioAlias ?? "")
            .trim()
            .toUpperCase() === normalizedUsername,
      ) ?? null
    );
  }, [users, currentUserId, normalizedUsername]);

  const logoutAndRedirect = useCallback(() => {
    submitForcedPasswordRef.current = null;
    activeDialogRef.current = null;
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  useEffect(() => {
    if (!someMustRenew) {
      if (activeDialogRef.current === "some") {
        closeDialog();
        activeDialogRef.current = null;
      }
      return;
    }

    if (activeDialogRef.current === "some") return;

    if (activeDialogRef.current === "password") {
      closeDialog();
      activeDialogRef.current = null;
      submitForcedPasswordRef.current = null;
    }

    openDialog({
      title: "Licencia SOME vencida",
      description: "Tu licencia de SOME vencio y la aplicacion quedara bloqueada.",
      size: "md",
      showCancel: false,
      disableClose: true,
      confirmLabel: "Cerrar sesion",
      onConfirm: async () => {
        logoutAndRedirect();
        return true;
      },
      content: () => (
        <div className="rounded-xl border border-blue-200 bg-gradient-to-b from-blue-50 to-white p-5">
          <p className="text-lg font-semibold tracking-tight text-slate-900">
            Renovacion de Hosting SOME
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Fecha de vencimiento:{" "}
            <span className="font-semibold text-red-600">
              {someExpiryDate ?? "sin fecha"}
            </span>
            .
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Debes comunicarte con soporte para renovar tu plan anual. Mientras
            no se renueve la licencia, no podras continuar en el sistema.
          </p>
        </div>
      ),
      onClose: () => {
        activeDialogRef.current = null;
      },
    });

    activeDialogRef.current = "some";
  }, [someMustRenew, someExpiryDate, closeDialog, openDialog, logoutAndRedirect]);

  useEffect(() => {
    if (!passwordMustChange || someMustRenew) {
      setHasResolvedCurrentUser(false);
      return;
    }

    let active = true;
    const loadCurrentUser = async () => {
      setHasResolvedCurrentUser(false);
      setLoadingUser(true);
      try {
        await fetchUsers("ACTIVO");
        if (!active) return;

        const usersAfterActive = useUsersStore.getState().users;
        const hasCurrentUser = usersAfterActive.some((u) => {
          const matchesId =
            currentUserId > 0 && Number(u.UsuarioID) === currentUserId;
          const matchesAlias =
            normalizedUsername.length > 0 &&
            String(u.UsuarioAlias ?? "").trim().toUpperCase() ===
              normalizedUsername;
          return matchesId || matchesAlias;
        });

        if (!hasCurrentUser) {
          await fetchUsers("");
        }
      } finally {
        if (active) {
          setLoadingUser(false);
          setHasResolvedCurrentUser(true);
        }
      }
    };

    void loadCurrentUser();
    return () => {
      active = false;
    };
  }, [
    passwordMustChange,
    someMustRenew,
    currentUserId,
    normalizedUsername,
    fetchUsers,
  ]);

  const handleSaveForcedPassword = useCallback(
    async (values: Record<string, unknown>) => {
      if (!currentUserRecord) {
        toast.error(
          "No se pudo identificar el usuario actual para actualizar la clave.",
        );
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
      logoutAndRedirect();
      return true;
    },
    [currentUserRecord, updateUser, logoutAndRedirect],
  );

  useEffect(() => {
    if (!passwordMustChange || someMustRenew) {
      fallbackLogoutRef.current = false;
      if (activeDialogRef.current === "password") {
        submitForcedPasswordRef.current = null;
        closeDialog();
        activeDialogRef.current = null;
      }
      return;
    }

    if (
      loadingUser ||
      !hasResolvedCurrentUser ||
      currentUserRecord ||
      fallbackLogoutRef.current
    ) {
      return;
    }

    fallbackLogoutRef.current = true;
    toast.error("No se pudo cargar tu usuario. Inicia sesion nuevamente.");
    logoutAndRedirect();
  }, [
    passwordMustChange,
    someMustRenew,
    loadingUser,
    hasResolvedCurrentUser,
    currentUserRecord,
    closeDialog,
    logoutAndRedirect,
  ]);

  useEffect(() => {
    if (
      someMustRenew ||
      !passwordMustChange ||
      loadingUser ||
      !currentUserRecord
    ) {
      return;
    }
    if (activeDialogRef.current) return;

    openDialog({
      title: `Tu contrasena vencio (${passwordExpiryDate ?? "sin fecha"}).`,
      description:
        "Debes actualizar tu contrasena para continuar. La aplicacion permanecera bloqueada hasta completar este cambio.",
      size: "xl",
      showCancel: false,
      disableClose: true,
      confirmLabel: "Actualizar clave",
      dangerLabel: "Cerrar sesion",
      onDanger: async () => {
        logoutAndRedirect();
        return true;
      },
      onConfirm: async () => {
        const submitForcedPassword = submitForcedPasswordRef.current;
        if (typeof submitForcedPassword !== "function") {
          toast.error(
            "No se pudo preparar el formulario para actualizar la clave.",
          );
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
        activeDialogRef.current = null;
      },
    });

    activeDialogRef.current = "password";
  }, [
    someMustRenew,
    passwordMustChange,
    passwordExpiryDate,
    loadingUser,
    currentUserRecord,
    openDialog,
    handleSaveForcedPassword,
    logoutAndRedirect,
  ]);

  return null;
};

export default PasswordExpiryGate;
