import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NAV, NAV_GROUPS } from "@/data/nav";
import { PRECOMPILES } from "@/data/precompiles";
import ritualLogo from "@/assets/ritual-logo.png";
import { CatMascot } from "./cat-mascot";

export function AppSidebar() {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) =>
    url === "/" ? currentPath === "/" : currentPath === url || currentPath.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2 px-2 py-2">
          <img
            src={ritualLogo}
            alt="Ritual"
            className="size-7 rounded-md object-contain bg-black p-0.5 transition-transform group-hover:rotate-6"
          />
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden flex-1 min-w-0">
            <span className="text-sm font-semibold tracking-tight truncate">Enshrined</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Ritual Testnet · 1979
            </span>
          </div>
          <CatMascot size={22} className="group-data-[collapsible=icon]:hidden" />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((g) => {
          const items = NAV.filter((n) => n.group === g.id);
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={g.id}>
              <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                        <Link to={item.url} preload="intent">
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}

        <SidebarGroup>
          <SidebarGroupLabel>Precompiles</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {PRECOMPILES.map((p) => (
                <SidebarMenuItem key={p.id}>
                  <SidebarMenuButton
                    asChild
                    size="sm"
                    isActive={currentPath === `/precompile-map/${p.id}`}
                    tooltip={`${p.name} · ${p.address}`}
                  >
                    <Link to="/precompile-map/$id" params={{ id: p.id }}>
                      <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                        {p.address.length > 8 ? p.address.slice(0, 6) : p.address}
                      </span>
                      <span className="truncate">{p.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-2 text-[10px] text-muted-foreground group-data-[collapsible=icon]:hidden">
          Research digest of{" "}
          <a
            href="https://docs.ritualfoundation.org"
            target="_blank"
            rel="noreferrer"
            className="text-signal hover:underline"
          >
            docs.ritualfoundation.org
          </a>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
