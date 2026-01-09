import { toast } from "sonner";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  title: string;
  description?: string;
  type?: ToastType;
}

const AppToast = ({ title, description, type = "info" }: ToastProps) => {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-rose-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "info":
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case "success":
        return "border-emerald-200 bg-emerald-50/50";
      case "error":
        return "border-rose-200 bg-rose-50/50";
      case "warning":
        return "border-amber-200 bg-amber-50/50";
      case "info":
      default:
        return "border-blue-200 bg-blue-50/50";
    }
  };

  return (
    <div
      className={`flex items-start gap-3 w-full p-4 rounded-xl border shadow-lg backdrop-blur-md ${getBorderColor()}`}
    >
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {description && (
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export const showToast = ({ title, description, type = "info" }: ToastProps) => {
  toast.custom((t) => <AppToast title={title} description={description} type={type} />, {
    duration: 4000,
  });
};

export default AppToast;
