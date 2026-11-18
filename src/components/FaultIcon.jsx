import { Armchair, Lightbulb, Projector, Wrench, Wifi, Droplets } from "lucide-react";
const icons = {
  "Instalación eléctrica": Lightbulb, Proyector: Projector, Mobiliario: Armchair,
  Sanitarios: Droplets, "Red o conectividad": Wifi,
};
export function FaultIcon({name}) {
  const Icon = icons[name] || Wrench;
  return <Icon className="fault-icon" aria-hidden="true" size={18} />;
}
