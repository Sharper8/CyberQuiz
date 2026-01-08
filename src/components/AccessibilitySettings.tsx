"use client";

import React from "react";
import { useAccessibility } from "@/lib/accessibility-context";
import { Settings, Eye, Wind, Zap, Type, Palette } from "lucide-react";
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
        
        <DropdownMenuCheckboxItem
          checked={settings.colorBlindMode}
          onCheckedChange={(checked) => updateSettings({ colorBlindMode: checked })}
        >
          <Palette className="h-4 w-4 mr-2" /> Mode Daltonisme
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={settings.highContrast}
          onCheckedChange={(checked) => updateSettings({ highContrast: checked })}
        >
          <Eye className="h-4 w-4 mr-2" /> Contraste Élevé
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={settings.reducedMotion}
          onCheckedChange={(checked) => updateSettings({ reducedMotion: checked })}
        >
          <Wind className="h-4 w-4 mr-2" /> Réactions Réduites
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
