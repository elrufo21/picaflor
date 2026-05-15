import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { showToast } from "@/components/ui/AppToast";
import { useDialogStore } from "@/store/app/dialog.store";
import UserFormBase from "@/modules/maintenance/users/components/UserFormBase";
import type { User } from "@/store/employees/employees.store";
import { useUsersStore } from "@/store/users/users.store";

const UserEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const openDialog = useDialogStore((s) => s.openDialog);

  const { users, updateUser, fetchUsers, deleteUser } = useUsersStore();

  const [form, setForm] = useState<Omit<User, "id"> | null>(null);

  useEffect(() => {
    if (users.length === 0) fetchUsers();
  }, [users, fetchUsers]);

  useEffect(() => {
    const user = users.find((e) => e.UsuarioID === Number(id));
    if (user) {
      const { id: _, ...rest } = user;
      setForm(rest);
    }
  }, [users, id]);

  if (!form) return <div>Cargando empleado...</div>;

  const handleSave = async (data: Omit<User, "id">) => {
    const updated = await updateUser(Number(id), data);
    if (!updated) {
      showToast({ title: "Error", description: "No se pudo guardar el usuario.", type: "error" });
      return false;
    }

    showToast({ title: "Exito", description: "Empleado guardado correctamente", type: "success" });
    navigate("/maintenance/users");
    return true;
  };

  const handleDelete = () => {
    if (!id) return;
    openDialog({
      title: "Eliminar",
      content: <p>Seguro que deseas eliminar este usuario?</p>,
      onConfirm: async () => {
        try {
          const result = await deleteUser(Number(id));
          if (result === false) {
            showToast({ title: "Error", description: "No se pudo eliminar el usuario.", type: "error" });
            return;
          }
          showToast({ title: "Exito", description: "Empleado eliminado correctamente", type: "success" });
          navigate("/maintenance/users");
        } catch (error) {
          console.error("Error eliminando usuario", error);
          showToast({ title: "Error", description: "Ocurrio un error al eliminar el usuario.", type: "error" });
        }
      },
    });
  };

  const handleNew = () => navigate("/maintenance/users/create");

  return (
    <UserFormBase
      mode="edit"
      initialData={form}
      onSave={handleSave}
      onDelete={handleDelete}
      onNew={handleNew}
    />
  );
};

export default UserEdit;
