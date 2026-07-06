import {
  Rainbow,
  Users,
  Music,
  BookOpen,
  Coffee,
  Baby,
  Scale,
  CircleDot,
  GraduationCap,
  UsersRound,
  MapPin,
  Brain,
  Accessibility,
  Sparkles,
  DoorOpen,
  MessageCircleQuestion,
  type LucideIcon,
} from "lucide-react"

const map: Record<string, LucideIcon> = {
  rainbow: Rainbow,
  users: Users,
  music: Music,
  "book-open": BookOpen,
  coffee: Coffee,
  baby: Baby,
  scale: Scale,
  "circle-dot": CircleDot,
  "graduation-cap": GraduationCap,
  "users-round": UsersRound,
  "map-pin": MapPin,
  brain: Brain,
  accessibility: Accessibility,
  sparkles: Sparkles,
  "door-open": DoorOpen,
  "message-circle-question": MessageCircleQuestion,
}

export function TagIcon({
  name,
  className,
}: {
  name: string | null
  className?: string
}) {
  const Icon = (name ? map[name] : undefined) ?? CircleDot
  return <Icon className={className} aria-hidden="true" />
}
