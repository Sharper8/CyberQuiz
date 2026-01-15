"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import CyberButton from "@/components/CyberButton";
import CyberBackground from "@/components/CyberBackground";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.login(email, password);
      if (response.token) {
        localStorage.setItem('adminToken', response.token);
      }
      toast.success("Connexion réussie");
      router.push("/admin");
    } catch (error: any) {
      toast.error(error.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6">
      <CyberBackground />
      <div className="w-full max-w-md relative z-20">
        <div className="bg-card border border-border rounded-lg p-8 shadow-[0_0_30px_hsl(var(--primary)/0.2)]">
          <div className="flex items-center justify-center mb-6">
            <Shield className="h-12 w-12 text-primary" />
          </div>

          <h1 className="text-3xl font-bold text-center text-gradient mb-2">
            Espace Administrateur
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Connectez-vous pour gérer les questions
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@cyberquiz.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <button
                  type="button"
                  onClick={() => router.push("/admin-login/recover")}
                  className="text-xs text-primary hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <CyberButton
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </CyberButton>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
