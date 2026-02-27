import { useNavigate } from "react-router";

const Forbidden = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto mt-20 max-w-xl rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <h1 className="text-xl font-semibold text-slate-800">Acceso denegado</h1>
      <p className="mt-2 text-sm text-slate-600">
        No tienes permisos para acceder a este módulo.
      </p>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Volver
      </button>
    </div>
  );
};

export default Forbidden;

