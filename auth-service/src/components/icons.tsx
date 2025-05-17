import {
  Loader2,
  User,
  UserCog,
  Mail,
  Lock,
  Eye,
  EyeOff,
  type LucideIcon,
  ChevronLeft,
  ChevronRight,
  Menu,
  Home,
  Calendar,
  Settings,
  LogOut,
  Check,
  X,
  Clock,
  Info,
  AlertTriangle,
  LucideProps
} from "lucide-react"

export type Icon = LucideIcon

export const Icons = {
  spinner: Loader2,
  user: User,
  userTie: UserCog,
  mail: Mail,
  lock: Lock,
  eye: Eye,
  eyeOff: EyeOff,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  menu: Menu,
  home: Home,
  calendar: Calendar,
  settings: Settings,
  logout: LogOut,
  check: Check,
  close: X,
  clock: Clock,
  info: Info,
  warning: AlertTriangle,
  logo: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
} 