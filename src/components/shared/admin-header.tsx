import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Calendar } from "lucide-react";

interface AdminHeaderProps {
  title: string;
  userName: string;
  userRole?: string;
  date?: string;
}

export function AdminHeader({ title, userName, userRole, date }: AdminHeaderProps) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <header className="flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-4 md:px-8 py-4">
      <h1 className="text-headline-mobile md:text-headline-lg font-semibold text-on-surface">
        {title}
      </h1>
      <div className="flex items-center gap-4">
        {date && (
          <div className="hidden md:flex items-center gap-2 text-body-sm text-on-surface-variant">
            <Calendar className="h-4 w-4" />
            {date}
          </div>
        )}
        <Bell className="hidden md:block h-5 w-5 text-on-surface-variant" />
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary-container text-on-primary-container text-label-caps">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-body-sm font-medium text-on-surface leading-none">{userName}</p>
            {userRole && (
              <p className="text-label-caps text-on-surface-variant tracking-wide mt-0.5">
                {userRole}
              </p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}