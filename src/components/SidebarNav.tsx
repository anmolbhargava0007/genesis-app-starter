
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const ROLE_MODULES = {
  "1": {
    modules: [
      { moduleId: 1, name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      { moduleId: 3, name: "User Management", icon: Users, path: "/usermanagement" },
      { moduleId: 2, name: "Workspaces", icon: ChevronDown, path: "/workspace" },
    ]
  },
  "2": {
    modules: [
      { moduleId: 2, name: "Workspaces", icon: ChevronDown, path: "/workspace"},
    ]
  }
};

const SidebarNav = () => {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isWorkspacesOpen, setIsWorkspacesOpen] = useState(location.pathname === "/workspace");
  
  const modules = ROLE_MODULES[userRole.toString()]?.modules || ROLE_MODULES["2"].modules;
  
  const handleModuleClick = (path: string, collapsible?: boolean) => {
    if (collapsible) {
      setIsWorkspacesOpen(!isWorkspacesOpen);
    }
    navigate(path);
  };
  
  return (
    <div className="flex flex-col space-y-2 p-2">
      {modules.map(module => (
        <div key={module.moduleId} className="w-full">
          {module.collapsible ? (
            <Collapsible
              open={isWorkspacesOpen}
              onOpenChange={setIsWorkspacesOpen}
              className="w-full"
            >
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost"
                  className="w-full justify-between text-gray-200"
                  onClick={() => navigate(module.path)}
                >
                  <div className="flex items-center gap-2">
                    {module.icon && <module.icon className="h-4 w-4" />}
                    <span>{module.name}</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isWorkspacesOpen ? "transform rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                {/* The workspace content will be rendered separately by Sidebar.tsx */}
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <Button 
              variant="ghost"
              className={`w-full justify-start text-gray-200 ${location.pathname === module.path ? "bg-gray-700" : ""}`}
              onClick={() => handleModuleClick(module.path)}
            >
              <div className="flex items-center gap-2">
                {module.icon && <module.icon className="h-4 w-4" />}
                <span>{module.name}</span>
              </div>
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

export default SidebarNav;
