import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/config";
import { apiRequest } from "@/shared/helpers/apiRequest";
import { useAuthStore } from "@/store/auth/auth.store";

type CompanyApi = {
  companiaId?: number | string | null;
  companiaRUC?: string | null;
  companiaRuc?: string | null;
};

export const useCompanyRuc = () => {
  const companyId = useAuthStore((state) => state.user?.companyId ?? "");
  const [companyRuc, setCompanyRuc] = useState("");

  useEffect(() => {
    let active = true;

    const loadCompanyRuc = async () => {
      if (!companyId) {
        setCompanyRuc("");
        return;
      }

      const response = await apiRequest<CompanyApi[] | null>({
        url: `${API_BASE_URL}/Compania/list`,
        method: "GET",
        fallback: null,
      });
      const company = response?.find(
        (item) => String(item.companiaId ?? "") === String(companyId),
      );

      if (active) {
        setCompanyRuc(
          String(company?.companiaRUC ?? company?.companiaRuc ?? "").trim(),
        );
      }
    };

    void loadCompanyRuc();
    return () => {
      active = false;
    };
  }, [companyId]);

  return companyRuc;
};
