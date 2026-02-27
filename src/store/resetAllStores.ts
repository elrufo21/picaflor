import { useLayoutStore } from "@/app/store/layoutStore";
import { useDialogStore } from "@/app/store/dialogStore";
import { usePackageStore } from "@/modules/fullday/store/fulldayStore";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import { useUsersStore } from "@/store/users/users.store";
import { useEmployeesStore } from "@/store/employees/employees.store";
import { useClientsStore } from "@/store/clients/clients.store";
import { useModulePermissionsStore } from "@/store/permissions/modulePermissions.store";
import { useSubmodulePermissionsStore } from "@/store/permissions/submodulePermissions.store";
import { resolveUserModuleActionPermissions } from "@/app/auth/moduleActionPermissions";
import { queryClient } from "@/shared/queryClient";
import { getTodayDateInputValue } from "@/shared/helpers/formatDate";

const getDefaultPackageDate = () => getTodayDateInputValue();

export const resetAllStores = () => {
  useLayoutStore.setState({ isSidebarOpen: false });
  useDialogStore.setState({ isOpen: false, payload: {}, config: null });
  usePackageStore.setState({
    packages: [],
    listado: [],
    selectedFullDayName: "",
    servicios: null,
    loading: false,
    listadoLoading: false,
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
  useClientsStore.setState({ clients: [], loading: false });
  useModulePermissionsStore.setState({
    allowedModules: [],
    moduleActions: resolveUserModuleActionPermissions(null, []),
    loaded: false,
  });
  useSubmodulePermissionsStore.setState({
    allowedSubmodules: [],
    permissionsVersion: null,
    loaded: false,
  });
  queryClient.clear();
};
