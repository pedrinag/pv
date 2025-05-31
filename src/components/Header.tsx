import { Button } from "@/components/ui/button";
import { BookOpen, Users, History, User, Menu, Star, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header = ({ activeTab, setActiveTab }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const avatarUrl = user?.user_metadata?.avatar_url;

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logout realizado com sucesso!",
        description: "Até logo!",
      });
    }
  };

  const navigation = [
    { id: "dashboard", label: "Dashboard", icon: BookOpen },
    { id: "generate-sermon", label: "Gerar Sermão", icon: BookOpen },
    { id: "generate-devotional", label: "Devocional", icon: Users },
    { id: "history", label: "Histórico", icon: History },
    { id: "plans", label: "Planos", icon: Star },
  ];

  return (
    <>
      {/* Header Desktop/Tablet */}
      <header className="bg-white shadow-sm border-b border-gray-200 hidden md:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sermão Fácil</h1>
                <p className="text-xs text-gray-500">Gerador de Sermões</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "default" : "ghost"}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center space-x-2 ${
                      activeTab === item.id 
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white" 
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Plano Gratuito</span>
                <Button size="sm" variant="outline" className="text-yellow-600 border-yellow-200 hover:bg-yellow-50">
                  <Star className="w-3 h-3 mr-1" />
                  Upgrade
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={activeTab === "profile" ? "default" : "ghost"}
                    className={`flex items-center space-x-2 ${
                      activeTab === "profile" 
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white" 
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span>Perfil</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setActiveTab("profile")}> 
                    <User className="w-4 h-4 mr-2" />
                    <span>Meu Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg md:hidden w-full max-w-full overflow-x-hidden">
        <div className="grid grid-cols-5 h-16 w-full">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center w-full text-[10px] font-medium focus:outline-none transition-colors ${
                  activeTab === item.id
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-blue-500"
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${activeTab === item.id ? "text-blue-600" : "text-gray-400"}`} />
                <span className="truncate px-1">{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center justify-center w-full text-[10px] font-medium focus:outline-none transition-colors ${
              activeTab === "profile"
                ? "text-blue-600"
                : "text-gray-500 hover:text-blue-500"
            }`}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-7 h-7 mb-0.5 rounded-full object-cover" />
            ) : (
              <User className={`w-5 h-5 mb-0.5 ${activeTab === "profile" ? "text-blue-600" : "text-gray-400"}`} />
            )}
            <span className="truncate px-1">Perfil</span>
          </button>
        </div>
      </nav>
    </>
  );
};
