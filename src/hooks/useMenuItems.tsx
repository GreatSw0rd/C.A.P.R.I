import {
  Settings,
  Code,
  WandSparkles,
  AudioLinesIcon,
  SquareSlashIcon,
  MonitorIcon,
  PowerIcon,
  MessageSquareTextIcon,
  BookOpenIcon,
  CalendarCheckIcon,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

export type MenuItem = {
  icon: React.ElementType;
  label: string;
  href: string;
  count?: number;
};

export type MenuGroup = {
  // Titre de la section (vide pour le groupe du haut).
  title: string;
  items: MenuItem[];
};

export const useMenuItems = () => {
  // Menu du tableau de bord, groupe par section comme dans Pluely.
  const groups: MenuGroup[] = [
    {
      title: "Activité",
      items: [
        { icon: CalendarCheckIcon, label: "Rendez-vous", href: "/rendez-vous" },
        { icon: BookOpenIcon, label: "Connaissances", href: "/knowledge" },
      ],
    },
    {
      title: "Intelligence",
      items: [
        { icon: WandSparkles, label: "Prompts système", href: "/system-prompts" },
        { icon: MessageSquareTextIcon, label: "Réponses", href: "/responses" },
        { icon: Code, label: "Fournisseurs d'IA", href: "/dev-space" },
      ],
    },
    {
      title: "Capture",
      items: [
        { icon: AudioLinesIcon, label: "Audio", href: "/audio" },
        { icon: MonitorIcon, label: "Capture d'écran", href: "/screenshot" },
      ],
    },
    {
      title: "Application",
      items: [
        { icon: Settings, label: "Réglages", href: "/settings" },
        { icon: SquareSlashIcon, label: "Curseur et raccourcis", href: "/shortcuts" },
      ],
    },
  ];

  const menu: MenuItem[] = groups.flatMap((g) => g.items);

  const footerItems: {
    icon: React.ElementType;
    label: string;
    href?: string;
    action?: () => Promise<void>;
  }[] = [
    {
      icon: PowerIcon,
      label: "Quitter C.A.P.R.I",
      action: async () => {
        await invoke("exit_app");
      },
    },
  ];

  return {
    groups,
    menu,
    footerItems,
  };
};
