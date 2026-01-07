import { RouterProvider } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import "../App.css";
import router from "./routes";
import { queryClient } from "../shared/queryClient";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
