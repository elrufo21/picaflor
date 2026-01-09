import { useLayoutStore } from "@/app/store/layoutStore";
import { useDialogStore } from "@/app/store/dialogStore";
import { usePackageStore } from "@/modules/package/store/packageStore";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import { useUsersStore } from "@/store/users/users.store";
import { useEmployeesStore } from "@/store/employees/employees.store";
import { queryClient } from "@/shared/queryClient";

const getDefaultPackageDate = () => new Date().toISOString().slice(0, 10);

export const resetAllStores = () => {
  useLayoutStore.setState({ isSidebarOpen: false });
  useDialogStore.setState({ isOpen: false, payload: {}, config: null });
  usePackageStore.setState({
    packages: [],
    servicios: null,
    loading: false,
    error: null,
    date: getDefaultPackageDate(),
  });
  useMaintenanceStore.setState({
    categories: [],
    areas: [],
    computers: [],
    providers: [],
    holidays: [],
    bankEntities: [],
    loading: false,
  });
  useUsersStore.setState({ users: [], loading: false });
  useEmployeesStore.setState({ employees: [], loading: false });
  queryClient.clear();
};
