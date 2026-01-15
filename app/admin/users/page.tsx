
"use client";

import { useState, useEffect } from "react";
import { Plus, User, Shield, Calendar, Clock, Lock, Users, Trophy, Gamepad2 } from "lucide-react";
import CyberButton from "@/components/CyberButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AdminUser {
  id: number;
  email: string;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
}

interface NormalUser {
  username: string;
  totalGames: number;
  lastPlayed: string;
  bestScore: number;
}

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [normalUsers, setNormalUsers] = useState<NormalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: "", password: "" });
  const [creating, setCreating] = useState(false);

  // Password Change State
  const [isPwdDialogOpen, setIsPwdDialogOpen] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);

  // Current user
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Decode token to get current user email (simple decode)
    const token = localStorage.getItem('adminToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserEmail(payload.email);
      } catch (e) {
        console.error("Failed to decode token");
      }
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [adminsRes, usersRes] = await Promise.all([
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/users/normal', { headers })
      ]);

      if (!adminsRes.ok || !usersRes.ok) throw new Error('Failed to fetch data');

      setAdmins(await adminsRes.json());
      setNormalUsers(await usersRes.json());
    } catch (error) {
      toast.error("Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAdmin),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to create admin');

      toast.success("Administrateur créé avec succès");
      setAdmins([data, ...admins]);
      setIsDialogOpen(false);
      setNewAdmin({ email: "", password: "" });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminId) return;

    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setChangingPwd(true);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetAdminId: selectedAdminId, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      toast.success("Mot de passe mis à jour");
      setIsPwdDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      setSelectedAdminId(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setChangingPwd(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-2">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground">Gérez les accès et visualisez les joueurs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ADMINS SECTION */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Administrateurs ({admins.length})</h2>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <CyberButton variant="primary" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </CyberButton>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouvel Administrateur</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateAdmin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@cyberquiz.fr"
                      value={newAdmin.email}
                      onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={newAdmin.password}
                      onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                      required
                      minLength={8}
                    />
                  </div>
                  <CyberButton
                    type="submit"
                    variant="primary"
                    className="w-full"
                    disabled={creating}
                  >
                    {creating ? "Création..." : "Créer le compte"}
                  </CyberButton>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            <div className="space-y-4">
              {admins.map((admin) => {
                const isMe = admin.email === currentUserEmail;
                return (
                  <div
                    key={admin.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${isMe
                      ? "bg-primary/10 border-primary/50"
                      : "bg-muted/30 border-border hover:border-primary/30"
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isMe ? "bg-primary text-black" : "bg-muted text-muted-foreground"
                        }`}>
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{admin.email}</p>
                          {isMe && <Badge variant="secondary" className="text-[10px] h-5">Moi</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleDateString() : 'Jamais'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Dialog open={isPwdDialogOpen && selectedAdminId === admin.id} onOpenChange={(open) => {
                      setIsPwdDialogOpen(open);
                      if (!open) {
                        setSelectedAdminId(null);
                        setNewPassword("");
                        setConfirmPassword("");
                      }
                    }}>
                      <DialogTrigger asChild>
                        <CyberButton
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAdminId(admin.id)}
                          className="h-8 w-8 p-0 flex items-center justify-center"
                          title="Changer le mot de passe"
                        >
                          <Lock className="h-4 w-4" />
                        </CyberButton>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Changer le mot de passe</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleChangePassword} className="space-y-4 mt-4">
                          <p className="text-sm text-muted-foreground">
                            Modification pour : <span className="font-bold text-primary">{admin.email}</span>
                          </p>
                          <div className="space-y-2">
                            <Label htmlFor="new-password">Nouveau mot de passe</Label>
                            <Input
                              id="new-password"
                              type="password"
                              placeholder="••••••••"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              required
                              minLength={8}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                            <Input
                              id="confirm-password"
                              type="password"
                              placeholder="••••••••"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              required
                              minLength={8}
                            />
                          </div>
                          <CyberButton
                            type="submit"
                            variant="primary"
                            className="w-full"
                            disabled={changingPwd}
                          >
                            {changingPwd ? "Mise à jour..." : "Valider"}
                          </CyberButton>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* NORMAL USERS SECTION */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-secondary" />
            <h2 className="text-xl font-bold">Joueurs ({normalUsers.length})</h2>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : normalUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
              Aucun joueur enregistré pour le moment.
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {normalUsers.map((user, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border hover:border-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                      <Gamepad2 className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{user.username}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Trophy className="h-3 w-3 text-yellow-500" />
                          Meilleur score : {user.bestScore}
                        </span>
                        <span>•</span>
                        <span>{user.totalGames} parties</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>Dernière partie</p>
                    <p>{new Date(user.lastPlayed).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
