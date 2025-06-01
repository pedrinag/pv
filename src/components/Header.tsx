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
    { id: "generate-sermon", label: "Sermão", icon: BookOpen },
    { id: "generate-devotional", label: "Devocional", icon: Users },
    { id: "history", label: "Histórico", icon: History },
    { id: "plans", label: "Planos", icon: Star },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white px-4 pt-3 pb-2 flex items-center justify-center">
        <div className="flex items-center gap-3 w-full">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col items-start justify-center min-w-0">
            <span className="font-bold text-lg text-gray-900 leading-tight">Sermão Fácil</span>
            <span className="text-xs text-gray-400 leading-tight">Gerador de Sermões</span>
          </div>
        </div>
      </div>

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
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden w-[95vw] max-w-xl px-2">
        <div className="flex items-center justify-between bg-white/90 backdrop-blur rounded-full shadow-lg border border-gray-200 px-2 py-1.5 gap-x-1.5">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors focus:outline-none ${
                  isActive ? "bg-blue-50 text-blue-600 shadow" : "text-gray-500 hover:text-blue-500"
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                <span className="text-[10px] font-medium leading-tight mt-0.5">{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors focus:outline-none ${
              activeTab === "profile"
                ? "bg-blue-50 text-blue-600 shadow"
                : "text-gray-500 hover:text-blue-500"
            }`}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-5 h-5 mb-0.5 rounded-full object-cover border border-gray-200" />
            ) : (
              <User className={`w-5 h-5 mb-0.5 ${activeTab === "profile" ? "text-blue-600" : "text-gray-400"}`} />
            )}
            <span className="text-[10px] font-medium leading-tight mt-0.5">Perfil</span>
          </button>
        </div>
      </nav>
    </>
  );
};
