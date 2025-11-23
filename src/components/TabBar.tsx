import { Home, User, Settings as SettingsIcon, TrendingUp } from "lucide-react";
import { NavLink } from "./NavLink";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";

const TabBar = () => {
  const tabs = [
    { to: "/dashboard", icon: Home, label: "Home" },
    { to: "/analytics", icon: TrendingUp, label: "Analytics" },
    { to: "/profile", icon: User, label: "Profile" },
    { to: "/settings", icon: SettingsIcon, label: "Settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border pb-safe">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex justify-around items-center">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              onClick={() => triggerHaptic("light")}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200",
                "text-muted-foreground hover:text-foreground"
              )}
              activeClassName="text-primary bg-primary/10"
            >
              <tab.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{tab.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default TabBar;
