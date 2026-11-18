import { Palette } from "lucide-react";
export function ThemePicker() {
  return (
    <label className="theme-picker"><Palette size={17} aria-hidden="true" /><span className="sr-only">Tema de la página</span>
      <select defaultValue={document.documentElement.dataset.theme || "normal"} onChange={(event) => {
        const theme = event.target.value;
        document.documentElement.dataset.theme = theme;
        try { localStorage.setItem("itt:tema", theme); } catch { /* Sigue activo en esta página. */ }
      }}>
        <option value="normal">Normal</option><option value="oscuro">Oscuro</option><option value="bosque">Bosque</option>
      </select>
    </label>
  );
}
