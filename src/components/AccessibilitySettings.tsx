"use client";

import React from "react";
import { useAccessibility } from "@/lib/accessibility-context";
import { Settings, Eye, Zap, Type, Palette } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function AccessibilitySettings() {
  const { settings, updateSettings } = useAccessibility();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="fixed bottom-4 right-4 z-50 rounded-full h-12 w-12 bg-background/80 backdrop-blur-sm border-2 border-primary shadow-glow-blue">
          <Settings className="h-6 w-6 text-primary" />
          <span className="sr-only">Paramètres d'accessibilité</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card border-2 border-primary/50 text-foreground">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Eye className="h-4 w-4" /> Accessibilité & Green IT
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="h-4 w-4 mr-2" /> Mode Daltonisme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup 
              value={settings.colorBlindMode} 
              onValueChange={(v) => updateSettings({ colorBlindMode: v as any })}
            >
              <DropdownMenuRadioItem value="none">Désactivé</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="protanopia">Protanopie (Rouge)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="deuteranopia">Deutéranopie (Vert)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="tritanopia">Tritanopie (Bleu-Jaune)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="achromatopsia">Achromatopsie (Gris)</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        <DropdownMenuCheckboxItem
          checked={settings.highContrast}
          onCheckedChange={(checked) => updateSettings({ highContrast: checked })}
        >
          <Eye className="h-4 w-4 mr-2" /> Contraste Élevé
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={settings.lowPowerMode}
          onCheckedChange={(checked) => updateSettings({ lowPowerMode: checked })}
        >
          <Zap className="h-4 w-4 mr-2" /> Mode Éco (Green IT)
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Type className="h-4 w-4 mr-2" /> Taille du texte
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup 
              value={settings.fontSize} 
              onValueChange={(v) => updateSettings({ fontSize: v as any })}
            >
              <DropdownMenuRadioItem value="normal">Normal</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="large">Grand</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="extra-large">Très Grand</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
