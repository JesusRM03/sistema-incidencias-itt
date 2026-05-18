export const THEME_STORAGE_KEY = 'temaVisualITT'

export const DEFAULT_THEME_ID = 'institucional-oscuro'

export const THEMES = [
  {
    id: 'institucional-oscuro',
    nombre: 'Institucional oscuro',
    descripcion: 'Verde y azul sobre fondo oscuro.',
    chart: {
      estado: '#10b981',
      tipo: '#38bdf8',
      edificio: '#f97316',
      prioridad: '#ef4444',
      grid: '#1e293b',
      axis: '#334155',
      text: '#cbd5e1',
      tooltipBg: '#020617',
      tooltipBorder: '#334155',
      cursor: 'rgba(15, 23, 42, 0.65)',
    },
  },
  {
    id: 'institucional-claro',
    nombre: 'Institucional claro',
    descripcion: 'Blanco, verde y azul institucional.',
    chart: {
      estado: '#047857',
      tipo: '#0369a1',
      edificio: '#0f766e',
      prioridad: '#dc2626',
      grid: '#dbeafe',
      axis: '#93c5fd',
      text: '#1e293b',
      tooltipBg: '#ffffff',
      tooltipBorder: '#bfdbfe',
      cursor: 'rgba(219, 234, 254, 0.72)',
    },
  },
  {
    id: 'naranja-azul',
    nombre: 'Naranja, blanco y azul',
    descripcion: 'Fondo claro con acentos naranja y azul.',
    chart: {
      estado: '#f97316',
      tipo: '#2563eb',
      edificio: '#0891b2',
      prioridad: '#dc2626',
      grid: '#fed7aa',
      axis: '#93c5fd',
      text: '#1f2937',
      tooltipBg: '#fff7ed',
      tooltipBorder: '#fdba74',
      cursor: 'rgba(255, 237, 213, 0.75)',
    },
  },
  {
    id: 'azul-academico',
    nombre: 'Azul académico',
    descripcion: 'Azules, blanco y gris para lectura formal.',
    chart: {
      estado: '#1d4ed8',
      tipo: '#0891b2',
      edificio: '#4f46e5',
      prioridad: '#be123c',
      grid: '#cbd5e1',
      axis: '#64748b',
      text: '#0f172a',
      tooltipBg: '#f8fafc',
      tooltipBorder: '#94a3b8',
      cursor: 'rgba(226, 232, 240, 0.78)',
    },
  },
  {
    id: 'alto-contraste',
    nombre: 'Alto contraste',
    descripcion: 'Oscuro con acentos muy visibles.',
    chart: {
      estado: '#facc15',
      tipo: '#22d3ee',
      edificio: '#a3e635',
      prioridad: '#fb7185',
      grid: '#52525b',
      axis: '#a1a1aa',
      text: '#ffffff',
      tooltipBg: '#000000',
      tooltipBorder: '#facc15',
      cursor: 'rgba(250, 204, 21, 0.18)',
    },
  },
]

export function getThemeById(themeId) {
  return THEMES.find((theme) => theme.id === themeId) || THEMES[0]
}
