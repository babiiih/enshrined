import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, User as UserIcon, LogIn } from "lucide-react";
import { useAuth, signOut } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { user, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div className="h-8 w-16 rounded-md bg-muted/40 animate-pulse" />;
  }

  if (!isAuthenticated) {
    return (
      <Button asChild size="sm" variant="outline" className="h-8">
        <Link to="/auth">
          <LogIn className="size-3.5" />
          <span className="hidden sm:inline">Sign in</span>
        </Link>
      </Button>
    );
  }

  const email = user?.email ?? "";
  const initials =
    (user?.user_metadata?.display_name as string | undefined)?.slice(0, 2).toUpperCase() ||
    email.slice(0, 2).toUpperCase();

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/" });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-8 items-center gap-2 rounded-full border border-border bg-muted/40 pl-1 pr-2.5 hover:border-signal/40 transition-colors"
          aria-label="Account menu"
        >
          <span className="grid size-6 place-items-center rounded-full bg-signal/15 text-[10px] font-semibold text-signal">
            {initials || <UserIcon className="size-3" />}
          </span>
          <span className="hidden sm:inline text-xs text-foreground max-w-[120px] truncate">
            {email}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Signed in as
          </div>
          <div className="text-xs text-foreground truncate">{email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/portfolio">
            <UserIcon className="size-4" /> My portfolio
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}