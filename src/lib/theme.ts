export const C = {
  bg: "#0F1420",
  panel: "#1A2130",
  panel2: "#212A3B",
  border: "#2C3548",
  borderHi: "#3A465C",
  text: "#E6EAF2",
  textDim: "#94A0B5",
  textFaint: "#5E6B82",
  accent: "#5B8DEF",
  accentDim: "#2A3B5E",
  todo: "#5E6B82",
  doing: "#5B8DEF",
  done: "#34D399",
  plan: "#F0A04B",
  danger: "#F87171",
  warn: "#FBBF24",
} as const;

export const KCOLS = [
  { id: "todo", label: "To do", color: C.todo },
  { id: "doing", label: "In progress", color: C.doing },
  { id: "done", label: "Completed", color: C.done },
] as const;

export const PROJ_COLS = [
  { id: "Pianificato", label: "Planned", color: C.plan },
  { id: "In corso", label: "In progress", color: C.doing },
  { id: "Completato", label: "Completed", color: C.done },
] as const;

export const PRIO: Record<string, string> = {
  Alta: C.danger,
  Media: C.warn,
  Bassa: C.textDim,
};

export const APP_PALETTE = [
  "#5B8DEF",
  "#34D399",
  "#F0A04B",
  "#A78BFA",
  "#F472B6",
  "#22D3EE",
];
