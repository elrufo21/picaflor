import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";

import UserFormBase from "@/modules/maintenance/users/components/UserFormBase";
import { useDialogStore } from "@/app/store/dialogStore";
import { useAuthStore } from "@/store/auth/auth.store";
import { useUsersStore } from "@/store/users/users.store";

const DB_RENEWAL_WARNING_MESSAGE =
  "LA SUSCRIPCION A LA BASE DE DATOS ESTA POR VENCER, CONTACTE CON EL SOPORTE";
const SOME_RENEWAL_WARNING_MESSAGE =
  "LA SUSCRIPCION DE SOME ESTA POR VENCER, CONTACTE CON EL SOPORTE";
const DB_RENEWAL_SUSPENDED_MESSAGE =
  "La cuenta se encuentra suspendida temporalmente, por favor comunicarse con soporte y cerrar sesion.";

const formatModalDate = (value?: string | null) => {
  const raw = String(value ?? "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return raw || "sin fecha";
  return `${match[3]}/${match[2]}/${match[1]}`;
};

const PasswordExpiryGate = () => {
  const navigate = useNavigate();
  const {
    user,
    passwordMustChange,
    passwordExpiryDate,
    someExpiryDate,
    someMustRenew,
    someShouldWarn,
    dbRenewalDate,
    dbMustRenew,
    dbShouldWarn,
    logout,
  } = useAuthStore();
  const { users, fetchUsers, updateUser } = useUsersStore();
  const openDialog = useDialogStore((s) => s.openDialog);
  const closeDialog = useDialogStore((s) => s.closeDialog);

  const [loadingUser, setLoadingUser] = useState(false);
  const [hasResolvedCurrentUser, setHasResolvedCurrentUser] = useState(false);
  const activeDialogRef = useRef<
    "password" | "some" | "db" | "dbWarning" | "someWarning" | null
  >(null);
  const fallbackLogoutRef = useRef(false);
  const submitForcedPasswordRef = useRef<(() => Promise<boolean>) | null>(null);

  const currentUserId = Number(user?.id ?? 0);
  const normalizedUsername = String(user?.username ?? "")
    .trim()
    .toUpperCase();
  const isExternalUser = useMemo(() => {
    const tipoUsuario = String(user?.tipoUsuario ?? "")
      .trim()
      .toUpperCase();
    return Boolean(user?.isExternal) || tipoUsuario === "EXTERNO";
  }, [user?.isExternal, user?.tipoUsuario]);

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
    if (!dbShouldWarn || dbMustRenew || !dbRenewalDate || isExternalUser) {
      if (activeDialogRef.current === "dbWarning") {
        closeDialog();
        activeDialogRef.current = null;
      }
      return;
    }
    if (activeDialogRef.current) return;

    openDialog({
      title: "Aviso de suscripcion",
      description: DB_RENEWAL_WARNING_MESSAGE,
      size: "md",
      showCancel: false,
      disableClose: false,
      confirmLabel: "Cerrar",
      onConfirm: async () => {
        closeDialog();
        activeDialogRef.current = null;
        return true;
      },
      content: () => (
        <div className="rounded-xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white p-5">
          <p className="text-lg font-semibold tracking-tight text-slate-900">
            Renovacion de base de datos
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {DB_RENEWAL_WARNING_MESSAGE}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Fecha de renovacion:{" "}
            <span className="font-semibold text-amber-700">
              {formatModalDate(dbRenewalDate)}
            </span>
            .
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Puedes continuar usando el sistema.
          </p>
        </div>
      ),
      onClose: () => {
        activeDialogRef.current = null;
      },
    });

    activeDialogRef.current = "dbWarning";
  }, [
    dbShouldWarn,
    dbMustRenew,
    dbRenewalDate,
    isExternalUser,
    closeDialog,
    openDialog,
  ]);

  useEffect(() => {
    if (
      dbMustRenew ||
      someMustRenew ||
      !someShouldWarn ||
      !someExpiryDate ||
      isExternalUser
    ) {
      if (activeDialogRef.current === "someWarning") {
        closeDialog();
        activeDialogRef.current = null;
      }
      return;
    }
    if (activeDialogRef.current) return;

    openDialog({
      title: "Aviso de suscripcion",
      description: SOME_RENEWAL_WARNING_MESSAGE,
      size: "md",
      showCancel: false,
      disableClose: false,
      confirmLabel: "Cerrar",
      onConfirm: async () => {
        closeDialog();
        activeDialogRef.current = null;
        return true;
      },
      content: () => (
        <div className="rounded-xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white p-5">
          <p className="text-lg font-semibold tracking-tight text-slate-900">
            Renovacion de Hosting SOME
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {SOME_RENEWAL_WARNING_MESSAGE}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Fecha de renovacion:{" "}
            <span className="font-semibold text-amber-700">
              {formatModalDate(someExpiryDate)}
            </span>
            .
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Puedes continuar usando el sistema.
          </p>
        </div>
      ),
      onClose: () => {
        activeDialogRef.current = null;
      },
    });

    activeDialogRef.current = "someWarning";
  }, [
    dbMustRenew,
    someMustRenew,
    someShouldWarn,
    someExpiryDate,
    isExternalUser,
    closeDialog,
    openDialog,
  ]);

  useEffect(() => {
    if (!dbMustRenew) {
      if (activeDialogRef.current === "db") {
        closeDialog();
        activeDialogRef.current = null;
      }
      return;
    }

    if (activeDialogRef.current === "db") return;

    if (activeDialogRef.current === "password") {
      closeDialog();
      activeDialogRef.current = null;
      submitForcedPasswordRef.current = null;
    }

    if (activeDialogRef.current === "some") {
      closeDialog();
      activeDialogRef.current = null;
    }

    if (activeDialogRef.current === "dbWarning") {
      closeDialog();
      activeDialogRef.current = null;
    }

    if (activeDialogRef.current === "someWarning") {
      closeDialog();
      activeDialogRef.current = null;
    }

    openDialog({
      title: "Suscripcion de base de datos vencida",
      description: DB_RENEWAL_SUSPENDED_MESSAGE,
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
            Renovacion de base de datos
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Fecha de renovacion:{" "}
            <span className="font-semibold text-red-600">
              {formatModalDate(dbRenewalDate)}
            </span>
            .
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {DB_RENEWAL_SUSPENDED_MESSAGE}
          </p>
        </div>
      ),
      onClose: () => {
        activeDialogRef.current = null;
      },
    });

    activeDialogRef.current = "db";
  }, [dbMustRenew, dbRenewalDate, closeDialog, openDialog, logoutAndRedirect]);

  useEffect(() => {
    if (dbMustRenew || !someMustRenew) {
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

    if (activeDialogRef.current === "someWarning") {
      closeDialog();
      activeDialogRef.current = null;
    }

    openDialog({
      title: "Suscripcion de SOME vencida",
      description: DB_RENEWAL_SUSPENDED_MESSAGE,
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
            Fecha de renovacion:{" "}
            <span className="font-semibold text-red-600">
              {formatModalDate(someExpiryDate)}
            </span>
            .
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {DB_RENEWAL_SUSPENDED_MESSAGE}
          </p>
        </div>
      ),
      onClose: () => {
        activeDialogRef.current = null;
      },
    });

    activeDialogRef.current = "some";
  }, [
    dbMustRenew,
    someMustRenew,
    someExpiryDate,
    closeDialog,
    openDialog,
    logoutAndRedirect,
  ]);

  useEffect(() => {
    if (!passwordMustChange || someMustRenew || dbMustRenew) {
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
    dbMustRenew,
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
    if (!passwordMustChange || someMustRenew || dbMustRenew) {
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
    dbMustRenew,
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
      dbMustRenew ||
      someMustRenew ||
      !passwordMustChange ||
      loadingUser ||
      !currentUserRecord
    ) {
      return;
    }
    if (activeDialogRef.current) return;

    openDialog({
      title: `Tu contrasena vencio (${formatModalDate(passwordExpiryDate)}).`,
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
    dbMustRenew,
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
