import { Building2, Calculator, ClipboardList, Droplet, Handshake, Map as MapIcon, MessageSquare, ShieldCheck, Truck, Wrench, Zap } from 'lucide-react';

const ICONS = {
  map: MapIcon,
  building: Building2,
  calculator: Calculator,
  wrench: Wrench,
  clipboard: ClipboardList,
  handshake: Handshake,
  message: MessageSquare,
  droplet: Droplet,
  zap: Zap,
  truck: Truck,
  shield: ShieldCheck,
} as const;

/** Consistent 24px outline icons for the services grid. Decorative: the service name is always shown. */
export function ServiceIcon({ name }: { name: keyof typeof ICONS }) {
  const Icon = ICONS[name];
  return <Icon size={22} strokeWidth={1.75} aria-hidden="true" focusable="false" />;
}
