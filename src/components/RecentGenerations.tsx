import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Heart, ArrowRight, Calendar, Trash2 } from "lucide-react";
import { useGenerations } from "@/hooks/useGenerations";
import { cleanMarkdown } from "@/hooks/useGenerations";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface RecentGenerationsProps {
  setActiveTab: (tab: string) => void;
  onViewGeneration: (generation: any) => void;
  onEditGeneration: (generation: any) => void;
}

export const RecentGenerations = ({ setActiveTab, onViewGeneration, onEditGeneration }: RecentGenerationsProps) => {
  const { generations, isLoading, deleteGeneration } = useGenerations();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [generationToDelete, setGenerationToDelete] = useState<string | null>(null);
  
  const recentItems = generations.slice(0, 3);

  const getThemeLabel = (theme: string | null) => {
    const themes: Record<string, string> = {
      'fe': 'Fé',
      'amor': 'Amor',
      'esperanca': 'Esperança',
      'perdao': 'Perdão',
      'gratidao': 'Gratidão',
      'familia': 'Família',
      'ansiedade': 'Ansiedade',
      'cura': 'Cura',
      'proposito': 'Propósito',
      'paz': 'Paz'
    };
    return theme ? themes[theme] || theme : 'Sem tema';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Hoje';
    if (diffInDays === 1) return 'Ontem';
    if (diffInDays < 7) return `${diffInDays} dias atrás`;
    
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const handleDeleteClick = (id: string) => {
    setGenerationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (generationToDelete) {
      deleteGeneration(generationToDelete);
      setDeleteDialogOpen(false);
      setGenerationToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900">Gerações Recentes</h3>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-16 bg-gray-200 rounded mb-4"></div>
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-200 rounded flex-1"></div>
                  <div className="h-8 bg-gray-200 rounded flex-1"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">Gerações Recentes</h3>
        <Button 
          variant="outline" 
          onClick={() => setActiveTab("history")}
          className="flex items-center gap-2"
        >
          Ver Todas
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {recentItems.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum conteúdo ainda</h3>
            <p className="text-gray-600 mb-4">Comece criando seu primeiro sermão ou devocional.</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setActiveTab("generate-sermon")}>
                Criar Sermão
              </Button>
              <Button variant="outline" onClick={() => setActiveTab("generate-devotional")}>
                Criar Devocional
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentItems.map((item) => (
            <Card key={item.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                    item.content_type === 'sermon' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {item.content_type === 'sermon' ? (
                      <BookOpen className="w-3 h-3" />
                    ) : (
                      <Heart className="w-3 h-3" />
                    )}
                    {item.content_type === 'sermon' ? 'Sermão' : 'Devocional'}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    {formatDate(item.created_at)}
                  </div>
                </div>
                <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                  {item.title}
                </CardTitle>
                <CardDescription className="text-sm font-medium text-gray-600">
                  {getThemeLabel(item.theme)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p
                  className="text-sm text-gray-600 mb-4"
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    display: 'block',
                  }}
                  title={cleanMarkdown(item.content || '')
                    .replace(/\s*[-–—]{2,}\s*/g, ' ')
                    .replace(/(^|\s)[-–—](?=\s|$)/g, ' ')
                    .trim()
                  }
                >
                  {cleanMarkdown(item.content || '')
                    .replace(/\s*[-–—]{2,}\s*/g, ' ')
                    .replace(/(^|\s)[-–—](?=\s|$)/g, ' ')
                    .trim()
                    .substring(0, 100)
                  }
                  {cleanMarkdown(item.content || '')
                    .replace(/\s*[-–—]{2,}\s*/g, ' ')
                    .replace(/(^|\s)[-–—](?=\s|$)/g, ' ')
                    .trim().length > 100 ? '...' : ''}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => onViewGeneration(item)}>
                    Ver
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => onEditGeneration(item)}>
                    Editar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(item.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir geração</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta geração? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
