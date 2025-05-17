import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  FileText,
  Video,
  ClipboardList,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { icon: Briefcase, label: "Jobs", path: "/dashboard" },
    { icon: FileText, label: "Resume", path: "/resume" },
    { icon: Video, label: "Mock", path: "/mock" },
    { icon: ClipboardList, label: "Applications", path: "/applications" },
  ];

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 ${
        isExpanded ? "w-64" : "w-16"
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col h-full">
        <div className="p-4">
          <ChevronRight
            className={`transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
        <nav className="flex-1">
          {menuItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              className={`w-full justify-start gap-4 p-4 ${
                isExpanded ? "" : "justify-center"
              }`}
              onClick={() => navigate(item.path)}
            >
              <item.icon className="h-5 w-5" />
              {isExpanded && <span>{item.label}</span>}
            </Button>
          ))}
        </nav>
        <Button
          variant="ghost"
          className={`mt-auto mb-4 mx-2 justify-start gap-4 ${
            isExpanded ? "" : "justify-center"
          }`}
          onClick={() => navigate("/login")}
        >
          <LogOut className="h-5 w-5" />
          {isExpanded && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );
};