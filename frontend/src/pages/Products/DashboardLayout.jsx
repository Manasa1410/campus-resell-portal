import { Outlet } from "react-router-dom";
import AppLayout from "../../components/AppLayout";

const DashboardLayout = () => (
  <AppLayout>
    <Outlet />
  </AppLayout>
);

export default DashboardLayout;
