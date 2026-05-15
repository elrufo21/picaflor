import { useState } from "react";
import { useNavigate } from "react-router";
import { showToast } from "@/components/ui/AppToast";
import UserFormBase from "@/modules/maintenance/users/components/UserFormBase";
import { useUsersStore } from "@/store/users/users.store";
import type { User } from "@/store/users/users.store";

const UserCreate = () => {
  const { addUser } = useUsersStore();
  const navigate = useNavigate();

  const [form, setForm] = useState<Omit<User, "UsuarioID">>({
    PersonalId: 0,
    TipoUsuario: "INTERNO",
    CanalVentaId: "",
    CanalVentaNombre: "",
    Nombres: "",
    Apellidos: "",
    UsuarioAlias: "",
    UsuarioClave: "",
    UsuarioFechaReg: new Date().toISOString(),
    UsuarioEstado: "ACTIVO",
    UsuarioSerie: "B001",
    EnviaBoleta: 0,
    EnviarFactura: 0,
    EnviaNC: 0,
    EnviaND: 0,
    Administrador: 0,
  });

  const handleSave = async (data: Omit<User, "UsuarioID">) => {
    const created = await addUser(data);

    if (!created) {
      //  showToast({ title: "Error", description: "No se pudo crear el usuario.", type: "error" });
      return false;
    }

    showToast({ title: "Exito", description: "Usuario creado correctamente", type: "success" });
    setForm({
      PersonalId: 0,
      TipoUsuario: "INTERNO",
      CanalVentaId: "",
      CanalVentaNombre: "",
      Nombres: "",
      Apellidos: "",
      UsuarioAlias: "",
      UsuarioClave: "",
      UsuarioFechaReg: new Date().toISOString(),
      UsuarioEstado: "ACTIVO",
      UsuarioSerie: "B001",
      EnviaBoleta: 0,
      EnviarFactura: 0,
      EnviaNC: 0,
      EnviaND: 0,
      Administrador: 0,
    });
    return true;
  };

  const handleNew = () => {
    setForm({
      PersonalId: 0,
      TipoUsuario: "INTERNO",
      CanalVentaId: "",
      CanalVentaNombre: "",
      Nombres: "",
      Apellidos: "",
      UsuarioAlias: "",
      UsuarioClave: "",
      UsuarioFechaReg: new Date().toISOString(),
      UsuarioEstado: "ACTIVO",
      UsuarioSerie: "B001",
      EnviaBoleta: 0,
      EnviarFactura: 0,
      EnviaNC: 0,
      EnviaND: 0,
      Administrador: 0,
    });
  };

  return (
    <UserFormBase
      mode="create"
      initialData={form}
      onSave={handleSave}
      onNew={handleNew}
    />
  );
};

export default UserCreate;
