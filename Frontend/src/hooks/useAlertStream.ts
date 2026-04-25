import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.VITE_API_URL;

export function useAlertStream(onAlert?: (alert: any) => void) {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || user.role === "CUSTOMER") return;

    const es = new EventSource(`${BASE}/api/alerts/stream`, {
      // EventSource doesn't support custom headers natively;
      // the JWT filter reads it from the Authorization header.
      // We work around this by appending the token as a query param.
    });

    // Reconnect with token in query string (required since EventSource has no header support)
    es.close();

    const url = `${BASE}/api/alerts/stream?token=${encodeURIComponent(user.token)}`;
    const source = new EventSource(url);

    source.addEventListener("alert", (e: MessageEvent) => {
      try {
        const alert = JSON.parse(e.data);
        toast({
          title: `🚨 New Alert: ${alert.alertType?.replace(/_/g, " ")}`,
          description: `${alert.severity} — ${alert.message ?? alert.meter?.serialNumber ?? ""}`,
          variant: alert.severity === "CRITICAL" || alert.severity === "HIGH" ? "destructive" : "default",
        });
        onAlert?.(alert);
      } catch { /* ignore */ }
    });

    source.onerror = () => source.close();

    return () => source.close();
  }, [user?.token]);
}
