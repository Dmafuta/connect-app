import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ScrollToTop from "@/components/ScrollToTop";

const Landing       = lazy(() => import("./pages/Landing"));
const Auth          = lazy(() => import("./pages/Auth"));
const VerifyEmail   = lazy(() => import("./pages/VerifyEmail"));
const NotFound      = lazy(() => import("./pages/NotFound"));
const Forbidden     = lazy(() => import("./pages/Forbidden"));
const ComingSoon    = lazy(() => import("./pages/ComingSoon"));
const ServerError   = lazy(() => import("./pages/ServerError"));
const Careers       = lazy(() => import("./pages/Careers"));
const About         = lazy(() => import("./pages/About"));
const FAQ           = lazy(() => import("./pages/FAQ"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// Dashboard pages
const Overview         = lazy(() => import("./pages/dashboard/Overview"));
const Users            = lazy(() => import("./pages/dashboard/Users"));
const Customers        = lazy(() => import("./pages/dashboard/Customers"));
const Technicians      = lazy(() => import("./pages/dashboard/Technicians"));
const Meters           = lazy(() => import("./pages/dashboard/Meters"));
const Readings         = lazy(() => import("./pages/dashboard/Readings"));
const Alerts           = lazy(() => import("./pages/dashboard/Alerts"));
const Transactions     = lazy(() => import("./pages/dashboard/Transactions"));
const MyMeters         = lazy(() => import("./pages/dashboard/MyMeters"));
const TechnicianMeters = lazy(() => import("./pages/dashboard/TechnicianMeters"));
const Settings         = lazy(() => import("./pages/dashboard/Settings"));
const Tenants          = lazy(() => import("./pages/dashboard/Tenants"));
const Inventory        = lazy(() => import("./pages/dashboard/Inventory"));
const AuditLog         = lazy(() => import("./pages/dashboard/AuditLog"));
const Reports          = lazy(() => import("./pages/dashboard/Reports"));
const Invoices         = lazy(() => import("./pages/dashboard/Invoices"));

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
          <ScrollToTop />
          <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>}>
          <Routes>
            {/* Public */}
            <Route path="/"              element={<Landing />} />
            <Route path="/auth"          element={<Auth />} />
            <Route path="/verify-email"   element={<VerifyEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/403"           element={<Forbidden />} />
            <Route path="/500"           element={<ServerError />} />
            <Route path="/coming-soon"   element={<ComingSoon />} />
            <Route path="/careers"       element={<Careers />} />
            <Route path="/about"         element={<About />} />
            <Route path="/faq"           element={<FAQ />} />

            {/* Dashboard — all authenticated */}
            <Route path="/dashboard" element={<DashboardLayout><Overview /></DashboardLayout>} />
            <Route path="/dashboard/readings"     element={<DashboardLayout><Readings /></DashboardLayout>} />
            <Route path="/dashboard/invoices"     element={<DashboardLayout><ProtectedRoute allowedRoles={["ADMIN","CUSTOMER"]}><Invoices /></ProtectedRoute></DashboardLayout>} />
            <Route path="/dashboard/transactions" element={<DashboardLayout><Transactions /></DashboardLayout>} />
            <Route path="/dashboard/my-meters"    element={<DashboardLayout><MyMeters /></DashboardLayout>} />

            {/* ADMIN + TECHNICIAN */}
            <Route path="/dashboard/meters"      element={<DashboardLayout><ProtectedRoute allowedRoles={["ADMIN","TECHNICIAN"]}><Meters /></ProtectedRoute></DashboardLayout>} />
            <Route path="/dashboard/alerts"      element={<DashboardLayout><ProtectedRoute allowedRoles={["ADMIN","TECHNICIAN"]}><Alerts /></ProtectedRoute></DashboardLayout>} />
            <Route path="/dashboard/my-assignments" element={<DashboardLayout><ProtectedRoute allowedRoles={["TECHNICIAN"]}><TechnicianMeters /></ProtectedRoute></DashboardLayout>} />

            {/* ADMIN only */}
            <Route path="/dashboard/reports"     element={<DashboardLayout><ProtectedRoute allowedRoles={["ADMIN"]}><Reports /></ProtectedRoute></DashboardLayout>} />
            <Route path="/dashboard/customers"   element={<DashboardLayout><ProtectedRoute allowedRoles={["ADMIN"]}><Customers /></ProtectedRoute></DashboardLayout>} />
            <Route path="/dashboard/technicians" element={<DashboardLayout><ProtectedRoute allowedRoles={["ADMIN"]}><Technicians /></ProtectedRoute></DashboardLayout>} />
            <Route path="/dashboard/users"       element={<DashboardLayout><ProtectedRoute allowedRoles={["ADMIN"]}><Users /></ProtectedRoute></DashboardLayout>} />

            {/* SUPER_ADMIN only */}
            <Route path="/dashboard/tenants"     element={<DashboardLayout><ProtectedRoute allowedRoles={["SUPER_ADMIN"]}><Tenants /></ProtectedRoute></DashboardLayout>} />
            <Route path="/dashboard/inventory"   element={<DashboardLayout><ProtectedRoute allowedRoles={["SUPER_ADMIN"]}><Inventory /></ProtectedRoute></DashboardLayout>} />

            {/* SUPER_ADMIN + ADMIN */}
            <Route path="/dashboard/settings"    element={<DashboardLayout><ProtectedRoute allowedRoles={["SUPER_ADMIN","ADMIN"]}><Settings /></ProtectedRoute></DashboardLayout>} />
            <Route path="/dashboard/audit"       element={<DashboardLayout><ProtectedRoute allowedRoles={["SUPER_ADMIN","ADMIN"]}><AuditLog /></ProtectedRoute></DashboardLayout>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
