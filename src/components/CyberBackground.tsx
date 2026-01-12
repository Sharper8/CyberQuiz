"use client";

import { useAccessibility } from "@/lib/accessibility-context";

export default function CyberBackground() {
  const { settings } = useAccessibility();
  
  // Green IT: Hide the heavy animated wheel in low power mode
  if (settings.lowPowerMode) {
    return (
      <div className="fixed inset-0 z-0 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-black" />
        {/* Simple grid instead of complex gradients/animations */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 bg-background">
      {/* Gradient de base - cyan à gauche, sombre au centre, coloré à droite */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-gray-900 to-purple-900/30" />
      
      {/* Placeholder pour Spline ou Image statique */}
      <div className="absolute inset-0 opacity-40">
        {/* Vous pouvez insérer votre composant Spline ici */}
        {/* <Spline scene="..." /> */}
      </div>
      
      {/* Effet de circuits / lignes techniques (statique) */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.1) 2px, rgba(0, 255, 255, 0.1) 4px),
          repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0, 255, 255, 0.1) 2px, rgba(0, 255, 255, 0.1) 4px)
        `,
        backgroundSize: '100px 100px'
      }} />
      
      {/* Particules flottantes */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
        <div className="absolute top-40 left-60 w-1 h-1 bg-cyan-300 rounded-full animate-pulse" style={{animationDelay: '0.5s'}} />
        <div className="absolute top-60 left-40 w-2 h-2 bg-cyan-500 rounded-full animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute bottom-40 left-80 w-1 h-1 bg-cyan-400 rounded-full animate-pulse" style={{animationDelay: '1.5s'}} />
      </div>
      
      {/* Overlay pour contrôler la luminosité */}
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
}
