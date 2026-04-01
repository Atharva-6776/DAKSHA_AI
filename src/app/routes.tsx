import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Intro } from "./components/pages/Intro";
import { Home } from "./components/pages/Home";
import { Citizen } from "./components/pages/Citizen";
import { Worker } from "./components/pages/Worker";
import { Admin } from "./components/pages/Admin";
import { Summary } from "./components/pages/Summary";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Intro },
      { path: "home", Component: Home },
      { path: "citizen", Component: Citizen },
      { path: "worker", Component: Worker },
      { path: "admin", Component: Admin },
      { path: "summary", Component: Summary },
    ],
  },
]);