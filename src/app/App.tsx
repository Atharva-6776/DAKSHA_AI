import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AppProvider } from "./context/AppProvider";

export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}