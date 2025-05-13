import { Bell, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReactNode } from "react";

type HeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
};

const Header = ({ title, subtitle, actions, onMenuClick, showMenuButton = false }: HeaderProps) => {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-border px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {showMenuButton && onMenuClick && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onMenuClick}
              className="mr-2 md:hidden"
            >
              <Menu size={20} />
            </Button>
          )}
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-restaurant-dark dark:text-white truncate">{title}</h1>
            {subtitle && <p className="text-xs md:text-sm text-muted-foreground truncate max-w-[200px] md:max-w-none">{subtitle}</p>}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-4">
          {actions && (
            <div className="mr-1 md:mr-2">
              {actions}
            </div>
          )}
          
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="w-64 pl-8 rounded-full bg-muted"
            />
          </div>
          
          <Button variant="ghost" size="icon" className="relative md:hidden">
            <Search size={20} />
          </Button>
          
          <Button variant="ghost" size="icon" className="relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-restaurant-primary rounded-full"></span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
