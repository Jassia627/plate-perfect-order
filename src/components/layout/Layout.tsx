import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ProtectedRoute from "./ProtectedRoute";

type LayoutProps = {
  children: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

const Layout = ({ children, title, description, action }: LayoutProps) => {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title={title} subtitle={description} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6">
            <div className="container mx-auto max-w-6xl">
              {(action || description) && (
                <div className="flex justify-between items-center mb-6">
                  {description && (
                    <p className="text-muted-foreground">{description}</p>
                  )}
                  {action && (
                    <div className="flex items-center gap-2">
                      {action}
                    </div>
                  )}
                </div>
              )}
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Layout; 