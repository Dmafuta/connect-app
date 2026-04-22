import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedEmail = localStorage.getItem("email");
    if (token && storedEmail) {
      setEmail(storedEmail);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!email) {
    navigate("/auth");
    return null;
  }

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    navigate("/auth");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <h1 className="text-2xl font-semibold text-foreground">Welcome</h1>
      <p className="mt-2 text-sm text-muted-foreground">{email}</p>
      <button
        onClick={handleSignOut}
        className="mt-6 text-sm text-muted-foreground hover:text-foreground"
      >
        Sign out
      </button>
    </div>
  );
};

export default Index;
