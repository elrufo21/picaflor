import { useCallback, useState, type ReactNode } from "react";
import { useEmployeesStore } from "@/store/employees/employees.store";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import { useCategoriesQuery } from "@/modules/maintenance/categories/useCategoriesQuery";
import { useAreasQuery } from "@/modules/maintenance/areas/useAreasQuery";
import { useProvidersQuery } from "@/modules/maintenance/providers/useProvidersQuery";
import { useHolidaysQuery } from "@/modules/maintenance/holidays/useHolidaysQuery";
import { useClientsStore } from "@/store/clients/clients.store";
import { employeeListConfig } from "@/modules/maintenance/employees/employee.list.config";
import { categoryListConfig } from "@/modules/maintenance/categories/category.list.config";
import { areaListConfig } from "@/modules/maintenance/areas/area.list.config";
import { providerListConfig } from "@/modules/maintenance/providers/provider.list.config";
import { holidaysListConfig } from "@/modules/maintenance/holidays/holidays.list.config";
import { clientListConfig } from "@/modules/maintenance/clients/client.list.config";
import type { ModuleListConfig } from "@/shared/config/listConfig";

const useEmployeeListDeps = () => {
  const { employees, fetchEmployees, deleteEmployee } = useEmployeesStore();
  return {
    data: employees,
    fetchData: fetchEmployees,
    deleteItem: deleteEmployee,
  };
};

const useCategoryListDeps = () => {
  const { deleteCategory } = useMaintenanceStore();
  const { data = [], refetch } = useCategoriesQuery();
  return {
    data,
    fetchData: refetch,
    deleteItem: deleteCategory,
  };
};

const useAreaListDeps = () => {
  const { deleteArea } = useMaintenanceStore();
  const { data = [], refetch } = useAreasQuery();
  return {
    data,
    fetchData: refetch,
    deleteItem: deleteArea,
  };
};

const useProviderListDeps = () => {
  const { deleteProvider } = useMaintenanceStore();
  const [estado, setEstado] = useState<"ACTIVO" | "INACTIVO">("ACTIVO");
  const { data = [], refetch } = useProvidersQuery(estado);
  const fetchData = useCallback(() => refetch(), [refetch]);
  return {
    data,
    fetchData,
    deleteItem: deleteProvider,
    renderFilters: (
      <div className="flex items-center gap-2">
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value as "ACTIVO" | "INACTIVO")}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        >
          <option value="ACTIVO">Activos</option>
          <option value="INACTIVO">Inactivos</option>
        </select>
      </div>
    ),
  };
};

const useHolidayListDeps = () => {
  const { deleteHoliday } = useMaintenanceStore();
  const { data = [], refetch } = useHolidaysQuery();
  return {
    data,
    fetchData: refetch,
    deleteItem: deleteHoliday,
  };
};

const useClientListDeps = () => {
  const { clients, fetchClients, deleteClient } = useClientsStore();
  return {
    data: clients,
    fetchData: fetchClients,
    deleteItem: deleteClient,
  };
};

type ListDeps<T> = {
  data: T[];
  fetchData: () => Promise<unknown> | void;
  deleteItem: (id: number) => Promise<boolean | void> | boolean | void;
  renderFilters?: ReactNode;
};

type ListModuleEntry<T> = {
  config: ModuleListConfig<T>;
  useDeps: () => ListDeps<T>;
};

export const listRegistry = {
  employees: {
    config: employeeListConfig,
    useDeps: useEmployeeListDeps,
  } satisfies ListModuleEntry<any>,

  categories: {
    config: categoryListConfig,
    useDeps: useCategoryListDeps,
  } satisfies ListModuleEntry<any>,

  areas: {
    config: areaListConfig,
    useDeps: useAreaListDeps,
  } satisfies ListModuleEntry<any>,

  providers: {
    config: providerListConfig,
    useDeps: useProviderListDeps,
  } satisfies ListModuleEntry<any>,

  holidays: {
    config: holidaysListConfig,
    useDeps: useHolidayListDeps,
  } satisfies ListModuleEntry<any>,

  clients: {
    config: clientListConfig,
    useDeps: useClientListDeps,
  } satisfies ListModuleEntry<any>,
} as const;

export type ListModuleKey = keyof typeof listRegistry;
