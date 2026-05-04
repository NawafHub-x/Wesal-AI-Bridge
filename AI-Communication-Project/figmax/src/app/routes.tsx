import { createBrowserRouter } from "react-router";
import { LoginPage } from "@/app/components/LoginPage";
import { BlindDashboard } from "@/app/components/BlindDashboard";
import { DeafDashboard } from "@/app/components/DeafDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginPage,
  },
  {
    path: "/blind",
    Component: BlindDashboard,
  },
  {
    path: "/deaf",
    Component: DeafDashboard,
  },
]);
