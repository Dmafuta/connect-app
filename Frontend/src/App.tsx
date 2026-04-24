import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardShell from "@/components/dashboard/DashboardShell";

import Landing      from "./pages/Landing.tsx";
import Auth         from "./pages/Auth.tsx";
import VerifyEmail  from "./pages/VerifyEmail.tsx";
import NotFound     from "./pages/NotFound.tsx";
import Forbidden    from "./pages/Forbidden.tsx";

// Dashboard pages
import Overview      from "./pages/dashboard/Overview.tsx";
import Users         from "./pages/dashboard/Users.tsx";
import Customers     from "./pages/dashboard/Customers.tsx";
import Technicians   from "./pages/dashboard/Technicians.tsx";
import Meters        from "./pages/dashboard/Meters.tsx";
import Readings      from "./pages/dashboard/Readings.tsx";
import Alerts        from "./pages/dashboard/Alerts.tsx";
import Transactions  from "./pages/dashboard/Transactions.tsx";
import MyMeters      from "./pages/dashboard/MyMeters.tsx";
import Settings      from "./pages/dashboard/Settings.tsx";

const queryClient = new QueryClient();

const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <DashboardShell>{children}</DashboardShell>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/"              element={<Landing />} />
            <Route path="/auth"          element={<Auth />} />
            <Route path="/verify-email"  element={<VerifyEmail />} />
            <Route path="/403"           element={<Forbidden />} />

            {/* Dashboard — all authenticated */}
            <Route path="/dashboard" element={<DashboardLayout><Overview /></DashboardLayout>} />
            <Route path="/dashboard/readings"     element={<DashboardLayout><Readings /></DashboardLayout>} />
            <Route path="/dashboard/transactions" element={<DashboardLayout><Transactions /></DashboardLayout>} />
            <Route path="/dashboard/my-meters"    element={<DashboardLayout><MyMeters /></DashboardLayout>} />

            {/* Admin + SUPER_ADMIN */}
            <Route path="/dashboard/customers"   element={<DashboardLayout><ProtectedRoute allowedRoles={["SUPER_ADMIN","ADMIN"]}><Customers /></ProtectedRoute></DashboardLayout>} />
            <Route path="/dashboard/technicians" element={<DashboardLayout><ProtectedRoute allowedRoles={["SUPER_ADMIN","ADMIN"]}><Technicians /></ProtectedRoute></DashboardLayout>} />
            <Route path="/dashboard/meters"      element={<DashboardLayout><ProtectedRoute allowedRoles={["SUPER_ADMIN","ADMIN","TECHNICIAN"]}><Meters /></ProtectedRoute></DashboardLayout>} />
            <Route path="/dashboard/alerts"      element={<DashboardLayout><ProtectedRoute allowedRoles={["SUPER_ADMIN","ADMIN","TECHNICIAN"]}><Alerts /></ProtectedRoute></DashboardLayout>} />
            <Route path="/dashboard/settings"    element={<DashboardLayout><ProtectedRoute allowedRoles={["SUPER_ADMIN","ADMIN"]}><Settings /></ProtectedRoute></DashboardLayout>} />

            {/* SUPER_ADMIN only */}
            <Route path="/dashboard/users" element={<DashboardLayout><ProtectedRoute allowedRoles={["SUPER_ADMIN"]}><Users /></ProtectedRoute></DashboardLayout>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
