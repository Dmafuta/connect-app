import { useAuth } from "@/context/AuthContext";
import SuperAdminOverview   from "./overview/SuperAdminOverview";
import AdminOverview        from "./overview/AdminOverview";
import TechnicianOverview   from "./overview/TechnicianOverview";
import CustomerOverview     from "./overview/CustomerOverview";

export default function Overview() {
  const { user } = useAuth();
  if (!user) return null;

  switch (user.role) {
    case "SUPER_ADMIN": return <SuperAdminOverview />;
    case "ADMIN":       return <AdminOverview />;
    case "TECHNICIAN":  return <TechnicianOverview />;
    case "CUSTOMER":    return <CustomerOverview />;
  }
}
