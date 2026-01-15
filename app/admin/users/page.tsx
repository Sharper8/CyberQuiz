"use client";

export default function AdminUsersPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gradient mb-2">Gestion des utilisateurs</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">Administrateurs</h2>
          </div>
          <p className="text-sm text-muted-foreground">Section à implémenter.</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">Utilisateurs</h2>
          </div>
          <p className="text-sm text-muted-foreground">Section à implémenter.</p>
        </div>
      </div>
    </div>
  );
}
