
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CyberButton from "@/components/CyberButton";
import CyberBackground from "@/components/CyberBackground";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, KeyRound, ArrowLeft } from "lucide-react";

export default function AdminRecoverPage() {
    const [email, setEmail] = useState("");
    const [recoveryCode, setRecoveryCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRecover = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/admin/recover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, recoveryCode, newPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Erreur lors de la réinitialisation");
            }

            toast.success("Mot de passe mis à jour !");
            router.push("/admin-login");
        } catch (error: any) {
            toast.error(error.message);
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
                        <KeyRound className="h-12 w-12 text-primary" />
                    </div>

                    <h1 className="text-2xl font-bold text-center text-gradient mb-2">
                        Récupération de compte
                    </h1>
                    <p className="text-center text-muted-foreground mb-8 text-sm">
                        Utilisez votre code de secours pour réinitialiser votre mot de passe.
                    </p>

                    <form onSubmit={handleRecover} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Administrateur</Label>
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
                            <Label htmlFor="recoveryCode">Code de Récupération</Label>
                            <Input
                                id="recoveryCode"
                                type="password"
                                placeholder="Votre code secret..."
                                value={recoveryCode}
                                onChange={(e) => setRecoveryCode(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={8}
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
                            {loading ? "Réinitialisation..." : "Changer le mot de passe"}
                        </CyberButton>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => router.push("/admin-login")}
                            className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour à la connexion
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
