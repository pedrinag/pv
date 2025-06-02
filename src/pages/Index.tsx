import { useState, useCallback, useEffect, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Users, Heart, PlusCircle, History as HistoryIcon, User, Star, LogOut, Loader2, Trash2, ChevronDown } from "lucide-react";
import { Header } from "@/components/Header";
import { RecentGenerations } from "@/components/RecentGenerations";
import { StatsCards } from "@/components/StatsCards";
import { SermonViewer } from "@/components/SermonViewer";
import { useAuth } from "@/hooks/useAuth";
import { useGenerations } from "@/hooks/useGenerations";
import { useToast } from "@/hooks/use-toast";
import { ContentType, ThemeType, OccasionType, ToneType, Generation } from "@/types/database";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import getCroppedImg from '@/utils/cropImage';
import Cropper from 'react-easy-crop';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { createClient } from '@supabase/supabase-js';

// Crie o adminClient fora do componente para evitar múltiplas instâncias
const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const adminClient = serviceKey
  ? createClient('https://jrjyxkpygmidaxvzqqnr.supabase.co', serviceKey)
  : null;

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null);
  const [editingGeneration, setEditingGeneration] = useState<Generation | null>(null);
  const [activeSermonTab, setActiveSermonTab] = useState("form");
  const { user, signOut } = useAuth();
  const [adminStats, setAdminStats] = useState<{ user_id: string, full_name: string, email: string, count: number }[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  // Função para visualizar geração
  const handleViewGeneration = useCallback((generation: Generation) => {
    setSelectedGeneration(generation);
    setActiveTab(generation.content_type === 'sermon' ? 'generate-sermon' : 'generate-devotional');
    setActiveSermonTab('viewer');
  }, []);

  // Função para editar geração
  const handleEditGeneration = useCallback((generation: Generation) => {
    setEditingGeneration(generation);
    setActiveTab(generation.content_type === 'sermon' ? 'generate-sermon' : 'generate-devotional');
    setActiveSermonTab('form');
  }, []);

  // Função para voltar da visualização
  const handleBackToForm = useCallback(() => {
    setActiveSermonTab('form');
    setSelectedGeneration(null);
    setEditingGeneration(null);
    setActiveTab('dashboard');
  }, []);

  // Função para buscar ranking admin
  const fetchAdminStats = useCallback(async () => {
    setAdminLoading(true);
    const { data, error } = await supabase
      .from('profile_generation_ranking')
      .select('*');
    if (!error && data && data.length > 0) {
      const stats = data.map((profile: any) => ({
        user_id: profile.id,
        full_name: profile.full_name || 'Sem nome',
        email: profile.email || '',
        count: profile.generation_count || 0
      }));
      stats.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.full_name.localeCompare(b.full_name);
      });
      setAdminStats(stats);
    } else {
      setAdminStats([]);
      alert('Erro ao buscar perfis ou nenhum perfil encontrado. Verifique as policies do Supabase.');
    }
    setAdminLoading(false);
  }, []);

  useEffect(() => {
    if (user?.email === "pedroenrique458@gmail.com" && activeTab === "admin") {
      fetchAdminStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab]);

  // Função para abrir geração de sermão limpa
  const handleNewSermon = () => {
    setSelectedGeneration(null);
    setEditingGeneration(null);
    setActiveSermonTab('form');
    setActiveTab('generate-sermon');
  };

  // Função para abrir geração de devocional limpa
  const handleNewDevotional = () => {
    setSelectedGeneration(null);
    setEditingGeneration(null);
    setActiveSermonTab('form');
    setActiveTab('generate-devotional');
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard setActiveTab={setActiveTab} onViewGeneration={handleViewGeneration} onEditGeneration={handleEditGeneration} onNewSermon={handleNewSermon} onNewDevotional={handleNewDevotional} />;
      case "generate-sermon":
        return <GenerateSermon setActiveTab={setActiveTab} externalSermon={activeSermonTab === 'form' ? null : selectedGeneration} editingSermon={editingGeneration} setEditingSermon={setEditingGeneration} activeSermonTab={activeSermonTab} setActiveSermonTab={setActiveSermonTab} onBack={handleBackToForm} activeTab={activeTab as string} />;
      case "generate-devotional":
        return <GenerateDevotional setActiveTab={setActiveTab} externalDevotional={activeSermonTab === 'form' ? null : selectedGeneration} editingDevotional={editingGeneration} setEditingDevotional={setEditingGeneration} activeSermonTab={activeSermonTab} setActiveSermonTab={setActiveSermonTab} onBack={handleBackToForm} activeTab={activeTab as string} />;
      case "history":
        return <History onViewGeneration={handleViewGeneration} onEditGeneration={handleEditGeneration} />;
      case "profile":
        return <Profile />;
      case "admin":
        return (
          <div className="max-w-4xl mx-auto py-10 px-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Administrador - Ranking de Gerações</h2>
            <div className="flex justify-end mb-4">
              <Button onClick={fetchAdminStats} disabled={adminLoading} className="bg-gradient-to-r from-blue-500 to-pink-500 text-white font-semibold shadow-md hover:from-blue-600 hover:to-pink-600 transition-all">
                {adminLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Atualizando...</>
                ) : (
                  <>Atualizar Ranking</>
                )}
              </Button>
            </div>
            {adminLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Quantidade de Gerações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminStats.map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell>{u.full_name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        );
      case "plans":
        return <Plans />;
      default:
        return <Dashboard setActiveTab={setActiveTab} onViewGeneration={handleViewGeneration} onEditGeneration={handleEditGeneration} onNewSermon={handleNewSermon} onNewDevotional={handleNewDevotional} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="container mx-auto px-4 py-8">
        {/* Menu extra para admin */}
        {user?.email === "pedroenrique458@gmail.com" && (
          <div className="flex justify-end mb-6">
            <button
              className={`px-6 py-2 rounded-xl font-semibold shadow transition-all duration-300 bg-gradient-to-r from-pink-500 to-blue-500 text-white hover:from-blue-600 hover:to-pink-600 ${activeTab === 'admin' ? 'ring-4 ring-pink-200' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              Administrador
            </button>
          </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
};

const Dashboard = ({ setActiveTab, onViewGeneration, onEditGeneration, onNewSermon, onNewDevotional }: { setActiveTab: (tab: string) => void, onViewGeneration: (generation: Generation) => void, onEditGeneration: (generation: Generation) => void, onNewSermon: () => void, onNewDevotional: () => void }) => {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Bem-vindo ao Sermão Fácil
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Crie sermões e devocionais inspiradores com o poder da inteligência artificial
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer transform hover:scale-105 hover:-translate-y-2 overflow-hidden relative"
          onClick={onNewSermon}>
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12 group-hover:scale-125 transition-transform duration-700"></div>
          <CardHeader className="text-center pb-4 relative z-10">
            <div className="mx-auto w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
              <BookOpen className="w-10 h-10 drop-shadow-sm" />
            </div>
            <CardTitle className="text-2xl font-bold drop-shadow-sm">Gerar Sermão</CardTitle>
            <CardDescription className="text-blue-100 font-medium">
              Crie esboços completos de sermões personalizados
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center relative z-10">
            <Button variant="secondary" className="w-full bg-white/95 backdrop-blur-sm text-blue-600 hover:bg-white hover:scale-105 transition-all duration-300 font-semibold shadow-lg" onClick={onNewSermon}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Começar Agora
            </Button>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-purple-500 to-indigo-600 text-white cursor-pointer transform hover:scale-105 hover:-translate-y-2 overflow-hidden relative"
          onClick={onNewDevotional}>
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 -translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 translate-x-12 group-hover:scale-125 transition-transform duration-700"></div>
          <CardHeader className="text-center pb-4 relative z-10">
            <div className="mx-auto w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
              <Heart className="w-10 h-10 drop-shadow-sm" />
            </div>
            <CardTitle className="text-2xl font-bold drop-shadow-sm">Gerar Devocional</CardTitle>
            <CardDescription className="text-purple-100 font-medium">
              Desenvolva reflexões diárias inspiradoras
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center relative z-10">
            <Button variant="secondary" className="w-full bg-white/95 backdrop-blur-sm text-purple-600 hover:bg-white hover:scale-105 transition-all duration-300 font-semibold shadow-lg" onClick={onNewDevotional}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Criar Devocional
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Generations */}
      <RecentGenerations setActiveTab={setActiveTab} onViewGeneration={onViewGeneration} onEditGeneration={onEditGeneration} />
    </div>
  );
};

const GenerateSermon = ({ setActiveTab, externalSermon, editingSermon, setEditingSermon, activeSermonTab, setActiveSermonTab, onBack, activeTab }: { setActiveTab: (tab: string) => void, externalSermon: Generation | null, editingSermon: Generation | null, setEditingSermon: (generation: Generation | null) => void, activeSermonTab: string, setActiveSermonTab: (tab: string) => void, onBack: () => void, activeTab: string }) => {
  const [title, setTitle] = useState('');
  const [theme, setTheme] = useState<ThemeType | undefined>(undefined);
  const [occasion, setOccasion] = useState<OccasionType | undefined>(undefined);
  const [tone, setTone] = useState<ToneType | undefined>(undefined);
  const [bibleVerse, setBibleVerse] = useState('');
  const [content, setContent] = useState('');
  const [generatedSermon, setGeneratedSermon] = useState<Generation | null>(null);
  const { generateSermonWithN8N, isGeneratingWithN8N, updateGeneration, isUpdating } = useGenerations();
  const { toast } = useToast();

  useEffect(() => {
    if (editingSermon) {
      setTitle(editingSermon.title || '');
      setTheme(editingSermon.theme || undefined);
      setOccasion(editingSermon.occasion || undefined);
      setTone(editingSermon.tone || undefined);
      setBibleVerse(editingSermon.bible_verse || '');
      setContent(editingSermon.content || '');
    }
  }, [editingSermon]);

  // Limpa o estado ao abrir para gerar novo
  useEffect(() => {
    if (activeTab !== 'generate-sermon') {
      setGeneratedSermon(null);
      setTitle('');
      setTheme(undefined);
      setOccasion(undefined);
      setTone(undefined);
      setBibleVerse('');
      setContent('');
    }
  }, [activeTab]);

  useEffect(() => {
    if (externalSermon && externalSermon.content_type !== 'sermon') {
      setGeneratedSermon(null);
      setTitle('');
      setTheme(undefined);
      setOccasion(undefined);
      setTone(undefined);
      setBibleVerse('');
      setContent('');
      setActiveSermonTab('form');
    }
  }, [externalSermon]);

  const sermonToShow = externalSermon || generatedSermon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSermon) {
      updateGeneration({
        id: editingSermon.id,
        data: {
          title,
          theme,
          occasion,
          tone,
          bible_verse: bibleVerse,
          content,
        },
      });
      setEditingSermon(null);
      toast({ title: 'Sermão atualizado!', description: 'Seu sermão foi editado com sucesso.' });
      return;
    }
    if (!title.trim() || !theme || !occasion || !tone) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha Título, Tema, Ocasião e Tom do Sermão para gerar o sermão.",
        variant: "destructive",
      });
      return;
    }
    try {
      setActiveSermonTab("viewer");
      const result = await generateSermonWithN8N({
        title,
        content_type: 'sermon' as ContentType,
        theme: theme || undefined,
        occasion: occasion || undefined,
        tone: tone || undefined,
        bible_verse: bibleVerse || undefined,
      });
      const typedResult: Generation = {
        ...result,
        content_type: result.content_type as ContentType,
        theme: result.theme as ThemeType | null,
        occasion: result.occasion as OccasionType | null,
        tone: result.tone as ToneType | null,
      };
      setGeneratedSermon(typedResult);
      setTitle('');
      setTheme(undefined);
      setOccasion(undefined);
      setTone(undefined);
      setBibleVerse('');
    } catch (error) {
      setActiveSermonTab("form");
    }
  };

  const handleBackToForm = () => {
    setActiveSermonTab("form");
    setGeneratedSermon(null);
    if (onBack) onBack();
    setEditingSermon(null);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-10 relative">
        {/* Elementos decorativos */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-200/30 to-indigo-300/30 rounded-full blur-xl"></div>
        </div>
        <div className="absolute -top-4 -right-8">
          <Star className="w-8 h-8 text-blue-400 animate-pulse" />
        </div>
        <div className="absolute -top-2 -left-6">
          <BookOpen className="w-6 h-6 text-indigo-400 animate-bounce" />
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4 relative z-10">
          Gerar Novo Sermão com IA
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto relative z-10">
          Preencha os campos abaixo para criar seu sermão personalizado usando inteligência artificial avançada
        </p>
      </div>
      <Card className="shadow-2xl border-0 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-lg overflow-hidden relative">
        {/* Background decorativo */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-indigo-600/5"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-200/20 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
        <CardContent className="p-1 relative z-10">
          <Tabs value={activeSermonTab} onValueChange={setActiveSermonTab}>
            <TabsList className="flex w-full mb-8 bg-white/70 backdrop-blur-sm shadow-lg rounded-md overflow-hidden border border-white/20 items-center sm:grid sm:grid-cols-2 sm:rounded-md sm:overflow-visible">
              <TabsTrigger
                value="form"
                className="flex-1 rounded-none font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg flex items-center justify-center h-10 text-sm px-4 py-2 first:rounded-l-md last:rounded-none sm:rounded-md"
              >
                <span>Criar Sermão</span>
              </TabsTrigger>
              <TabsTrigger
                value="viewer"
                className="flex-1 rounded-none font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg flex items-center justify-center h-10 text-sm px-4 py-2 last:rounded-r-md first:rounded-none sm:rounded-md text-gray-500 data-[state=active]:text-white"
                disabled={!sermonToShow && !isGeneratingWithN8N}
              >
                <span>Visualizar Sermão</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="form" className="mt-0">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Campo Título */}
                <div className="relative">
                  <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-3 h-3 text-white" />
                    </div>
                    Título do Sermão *
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="Ex: A Importância da Fé em Tempos Difíceis"
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl font-medium text-gray-800 placeholder-gray-500 group-hover:border-blue-300"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
                {/* Layout de duas colunas */}
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Campo Tema */}
                  <div className="relative">
                    <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Heart className="w-3 h-3 text-white" />
                      </div>
                      Tema Principal
                    </label>
                    <div className="relative group">
                      <select
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl font-medium text-gray-800 appearance-none cursor-pointer group-hover:border-purple-300"
                        value={theme ?? ''}
                        onChange={(e) => setTheme(e.target.value ? (e.target.value as ThemeType) : undefined)}
                        disabled={!!editingSermon}
                      >
                        <option value="">Selecione um tema inspirador...</option>
                        <option value="fe">🙏 Fé</option>
                        <option value="amor">❤️ Amor</option>
                        <option value="esperanca">✨ Esperança</option>
                        <option value="perdao">🕊️ Perdão</option>
                        <option value="gratidao">🙌 Gratidão</option>
                        <option value="familia">👨‍👩‍👧‍👦 Família</option>
                        <option value="ansiedade">😌 Ansiedade</option>
                        <option value="cura">💚 Cura</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  {/* Campo Ocasião */}
                  <div className="relative">
                    <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                        <Users className="w-3 h-3 text-white" />
                      </div>
                      Ocasião
                    </label>
                    <div className="relative group">
                      <select
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl font-medium text-gray-800 appearance-none cursor-pointer group-hover:border-green-300"
                        value={occasion ?? ''}
                        onChange={(e) => setOccasion(e.target.value ? (e.target.value as OccasionType) : undefined)}
                        disabled={!!editingSermon}
                      >
                        <option value="">Selecione uma ocasião especial...</option>
                        <option value="culto">⛪ Culto Dominical</option>
                        <option value="celula">🏠 Célula</option>
                        <option value="casamento">💒 Casamento</option>
                        <option value="funeral">🕯️ Funeral</option>
                        <option value="jovens">🎉 Reunião de Jovens</option>
                        <option value="evangelismo">📢 Evangelismo</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>
                {/* Campo Tom do Sermão */}
                {!editingSermon && (
                  <div className="relative">
                    <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Star className="w-3 h-3 text-white" />
                      </div>
                      Tom do Sermão
                    </label>
                    <div className="relative group">
                      <select
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl font-medium text-gray-800 appearance-none cursor-pointer group-hover:border-indigo-300"
                        value={tone ?? ''}
                        onChange={(e) => setTone(e.target.value ? (e.target.value as ToneType) : undefined)}
                      >
                        <option value="">Selecione o tom desejado...</option>
                        <option value="motivacional">💡 Motivacional</option>
                        <option value="confrontador">⚡ Confrontador</option>
                        <option value="amoroso">💖 Amoroso</option>
                        <option value="reflexivo">🧠 Reflexivo</option>
                        <option value="evangelistico">📣 Evangelístico</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                )}
                {/* Campo Versículo Base */}
                <div className="relative">
                  <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-3 h-3 text-white" />
                    </div>
                    Versículo Base (Opcional)
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="Ex: João 3:16, Salmos 23:1, Filipenses 4:13..."
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl font-medium text-gray-800 placeholder-gray-500 group-hover:border-orange-300"
                      value={bibleVerse}
                      onChange={(e) => setBibleVerse(e.target.value)}
                      disabled={!!editingSermon}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-yellow-500/5 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
                {/* Campo Conteúdo (apenas edição) */}
                {editingSermon && (
                  <div className="relative">
                    <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-3 h-3 text-white" />
                      </div>
                      Conteúdo do Sermão
                    </label>
                    <textarea
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl font-medium text-gray-800 min-h-[120px]"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                      style={{ fontFamily: 'inherit', fontSize: '1.125rem', lineHeight: '1.75rem' }}
                    />
                  </div>
                )}
                {/* Botões */}
                <div className="flex justify-between gap-4 mt-8">
                  <button
                    type="button"
                    onClick={handleBackToForm}
                    className="w-1/2 h-10 py-2 rounded-md text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition
                      md:h-auto md:py-4 md:rounded-2xl md:text-lg
                    "
                    disabled={isGeneratingWithN8N || isUpdating}
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="w-full max-w-xs mx-auto h-10 py-2 px-4 rounded-md text-sm font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:from-blue-600 hover:to-indigo-600 transition flex items-center justify-center gap-2
                      sm:w-1/2 sm:text-base sm:py-2 sm:px-4
                      md:h-auto md:py-4 md:rounded-2xl md:text-lg md:w-1/2
                      whitespace-nowrap
                      mb-4"
                    disabled={isGeneratingWithN8N || isUpdating}
                  >
                    {(isGeneratingWithN8N || isUpdating) ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isUpdating ? 'Salvando...' : 'Gerando com IA...'}
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-4 h-4 mr-2" />
                        {editingSermon ? 'Salvar' : 'Gerar Sermão com IA'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="viewer" className="mt-0">
              {isGeneratingWithN8N ? (
                <div className="text-center py-12">
                  <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Gerando seu sermão...</h3>
                  <p className="text-gray-600">Aguarde enquanto nossa IA cria seu sermão personalizado.</p>
                </div>
              ) : sermonToShow ? (
                <SermonViewer sermon={sermonToShow} onBack={handleBackToForm} />
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum sermão gerado ainda</h3>
                  <p className="text-gray-600">Volte à aba \"Criar Sermão\" para gerar um novo sermão.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

const GenerateDevotional = ({ setActiveTab, externalDevotional, editingDevotional, setEditingDevotional, activeSermonTab, setActiveSermonTab, onBack, activeTab }: { setActiveTab: (tab: string) => void, externalDevotional: Generation | null, editingDevotional: Generation | null, setEditingDevotional: (generation: Generation | null) => void, activeSermonTab: string, setActiveSermonTab: (tab: string) => void, onBack: () => void, activeTab: string }) => {
  const [title, setTitle] = useState('');
  const [theme, setTheme] = useState<ThemeType | undefined>(undefined);
  const [occasion, setOccasion] = useState<OccasionType | undefined>(undefined);
  const [bibleVerse, setBibleVerse] = useState('');
  const [content, setContent] = useState('');
  const [generatedDevotional, setGeneratedDevotional] = useState<Generation | null>(null);
  const { generateDevotionalWithN8N, isGeneratingDevotionalWithN8N, updateGeneration, isUpdating } = useGenerations();
  const { toast } = useToast();

  useEffect(() => {
    if (editingDevotional) {
      setTitle(editingDevotional.title || '');
      setTheme(editingDevotional.theme || undefined);
      setOccasion(editingDevotional.occasion || undefined);
      setBibleVerse(editingDevotional.bible_verse || '');
      setContent(editingDevotional.content || '');
    }
  }, [editingDevotional]);

  // Limpa o estado ao abrir para gerar novo
  useEffect(() => {
    if (activeTab !== 'generate-devotional') {
      setGeneratedDevotional(null);
      setTitle('');
      setTheme(undefined);
      setOccasion(undefined);
      setBibleVerse('');
      setContent('');
    }
  }, [activeTab]);

  useEffect(() => {
    if (externalDevotional && externalDevotional.content_type !== 'devotional') {
      setGeneratedDevotional(null);
      setTitle('');
      setTheme(undefined);
      setOccasion(undefined);
      setBibleVerse('');
      setContent('');
      setActiveSermonTab('form');
    }
  }, [externalDevotional]);

  const devotionalToShow = externalDevotional || generatedDevotional;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDevotional) {
      updateGeneration({
        id: editingDevotional.id,
        data: {
          title,
          theme,
          occasion,
          bible_verse: bibleVerse,
          content,
        },
      });
      setEditingDevotional(null);
      toast({ title: 'Devocional atualizado!', description: 'Seu devocional foi editado com sucesso.' });
      return;
    }
    if (!title.trim() || !theme || !occasion) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha Título, Tema e Momento do Dia para gerar o devocional.",
        variant: "destructive",
      });
      return;
    }
    try {
      setActiveSermonTab("viewer");
      const result = await generateDevotionalWithN8N({
        title,
        content_type: 'devotional' as ContentType,
        theme: theme || undefined,
        occasion: occasion || undefined,
        bible_verse: bibleVerse || undefined,
      });
      const typedResult: Generation = {
        ...result,
        content_type: result.content_type as ContentType,
        theme: result.theme as ThemeType | null,
        occasion: result.occasion as OccasionType | null,
        tone: result.tone as ToneType | null,
      };
      setGeneratedDevotional(typedResult);
      setTitle('');
      setTheme(undefined);
      setOccasion(undefined);
      setBibleVerse('');
    } catch (error) {
      setActiveSermonTab("form");
    }
  };

  const handleBackToForm = () => {
    setActiveSermonTab("form");
    setGeneratedDevotional(null);
    if (onBack) onBack();
    setEditingDevotional(null);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-10 relative">
        {/* Elementos decorativos */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8">
          <div className="w-24 h-24 bg-gradient-to-br from-pink-200/30 to-purple-300/30 rounded-full blur-xl"></div>
        </div>
        <div className="absolute -top-4 -right-8">
          <Heart className="w-8 h-8 text-pink-400 animate-pulse" />
        </div>
        <div className="absolute -top-2 -left-6">
          <Heart className="w-6 h-6 text-purple-400 animate-bounce" />
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-pink-400 bg-clip-text text-transparent mb-4 relative z-10">
          Gerar Novo Devocional
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto relative z-10">
          Crie uma reflexão inspiradora e transformadora para o dia
        </p>
      </div>
      <Card className="shadow-2xl border-0 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/50 backdrop-blur-lg overflow-hidden relative">
        {/* Background decorativo */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-600/5 via-transparent to-purple-600/5"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-pink-200/20 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
        <CardContent className="px-1 relative z-10">
          <Tabs value={activeSermonTab} onValueChange={setActiveSermonTab}>
            <TabsList className="flex w-full mb-8 bg-white/70 backdrop-blur-sm shadow-lg rounded-md overflow-hidden border border-white/20 items-center sm:grid sm:grid-cols-2 sm:rounded-md sm:overflow-visible">
              <TabsTrigger
                value="form"
                className="flex-1 rounded-none font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg flex items-center justify-center h-10 text-sm px-4 py-2 first:rounded-l-md last:rounded-none sm:rounded-md"
              >
                <span>Criar Devocional</span>
              </TabsTrigger>
              <TabsTrigger
                value="viewer"
                className="flex-1 rounded-none font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg flex items-center justify-center h-10 text-sm px-4 py-2 last:rounded-r-md first:rounded-none sm:rounded-md text-gray-500 data-[state=active]:text-white"
                disabled={!devotionalToShow && !isGeneratingDevotionalWithN8N}
              >
                <span>Visualizar Devocional</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="form" className="mt-0">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Campo Título */}
                <div className="relative">
                  <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <Heart className="w-3 h-3 text-white" />
                    </div>
                    Título do Devocional *
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="Ex: Gratidão em Cada Manhã"
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl font-medium text-gray-800 placeholder-gray-500 group-hover:border-pink-300"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-purple-500/5 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
                {/* Campo Tema */}
                <div className="relative">
                  <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-3 h-3 text-white" />
                    </div>
                    Tema ou Foco
                  </label>
                  <div className="relative group">
                    <select
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl font-medium text-gray-800 appearance-none cursor-pointer group-hover:border-blue-300"
                      value={theme ?? ''}
                      onChange={(e) => setTheme(e.target.value ? (e.target.value as ThemeType) : undefined)}
                      disabled={!!editingDevotional}
                    >
                      <option value="">Selecione um tema inspirador...</option>
                      <option value="gratidao">🙌 Gratidão</option>
                      <option value="fe">🙏 Força e Fé</option>
                      <option value="paz">🕊️ Paz Interior</option>
                      <option value="proposito">🎯 Propósito de Vida</option>
                      <option value="amor">❤️ Amor</option>
                      <option value="esperanca">✨ Esperança</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                {/* Campo Momento do Dia */}
                <div className="relative">
                  <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg flex items-center justify-center">
                      <Star className="w-3 h-3 text-white" />
                    </div>
                    Momento do Dia
                  </label>
                  <div className="relative group">
                    <select
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl font-medium text-gray-800 appearance-none cursor-pointer group-hover:border-orange-300"
                      value={occasion ?? ''}
                      onChange={(e) => setOccasion(e.target.value ? (e.target.value as OccasionType) : undefined)}
                      disabled={!!editingDevotional}
                    >
                      <option value="">Qualquer momento do dia...</option>
                      <option value="manha">🌅 Devocional Matinal</option>
                      <option value="noite">🌙 Reflexão Noturna</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                {/* Campo Versículo Base */}
                <div className="relative">
                  <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-green-500 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-3 h-3 text-white" />
                    </div>
                    Versículo Base (Opcional)
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="Ex: Filipenses 4:13, Salmos 46:1, Provérbios 3:5-6..."
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl font-medium text-gray-800 placeholder-gray-500 group-hover:border-green-300"
                      value={bibleVerse}
                      onChange={(e) => setBibleVerse(e.target.value)}
                      disabled={!!editingDevotional}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-green-300/5 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
                {/* Campo Conteúdo (apenas edição) */}
                {editingDevotional && (
                  <div className="relative">
                    <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-pink-400 to-pink-600 rounded-lg flex items-center justify-center">
                        <Heart className="w-3 h-3 text-white" />
                      </div>
                      Conteúdo do Devocional
                    </label>
                    <textarea
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl font-medium text-gray-800 min-h-[120px]"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                      style={{ fontFamily: 'inherit', fontSize: '1.125rem', lineHeight: '1.75rem' }}
                    />
                  </div>
                )}
                {/* Botões */}
                <div className="flex justify-between gap-4 mt-8">
                  <button
                    type="button"
                    onClick={handleBackToForm}
                    className="w-1/2 h-10 py-2 rounded-md text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition
                      md:h-auto md:py-4 md:rounded-2xl md:text-lg
                    "
                    disabled={isGeneratingDevotionalWithN8N || isUpdating}
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="w-full max-w-xs mx-auto h-10 py-2 px-4 rounded-md text-sm font-bold bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg hover:from-pink-600 hover:to-purple-600 transition flex items-center justify-center gap-2
                      sm:w-1/2 sm:text-base sm:py-2 sm:px-4
                      md:h-auto md:py-4 md:rounded-2xl md:text-lg md:w-1/2
                      whitespace-nowrap
                      mb-4"
                    disabled={isGeneratingDevotionalWithN8N || isUpdating}
                  >
                    {(isGeneratingDevotionalWithN8N || isUpdating) ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isUpdating ? 'Salvando...' : 'Gerando com IA...'}
                      </>
                    ) : (
                      <>
                        <Heart className="w-4 h-4 mr-2" />
                        {editingDevotional ? 'Salvar' : 'Gerar Devocional'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="viewer" className="mt-0">
              {isGeneratingDevotionalWithN8N ? (
                <div className="text-center py-12">
                  <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-pink-600" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Gerando seu devocional...</h3>
                  <p className="text-gray-600">Aguarde enquanto nossa IA cria seu devocional personalizado.</p>
                </div>
              ) : devotionalToShow ? (
                <SermonViewer sermon={devotionalToShow} onBack={handleBackToForm} />
              ) : (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum devocional gerado ainda</h3>
                  <p className="text-gray-600">Volte à aba \"Criar Devocional\" para gerar um novo devocional.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

const History = ({ onViewGeneration, onEditGeneration }: { onViewGeneration: (generation: Generation) => void, onEditGeneration: (generation: Generation) => void }) => {
  const { generations, isLoading, deleteGeneration } = useGenerations();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [generationToDelete, setGenerationToDelete] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<any | null>(null);

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

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Histórico de Gerações</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Histórico de Gerações</h2>

      {generations.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <HistoryIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum histórico ainda</h3>
            <p className="text-gray-600">Seus sermões e devocionais aparecerão aqui após serem criados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {generations.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 md:mb-2 flex-wrap md:flex-nowrap">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${item.content_type === 'sermon'
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
                      {/* Data: visível ao lado do tipo em desktop, escondida no mobile */}
                      <span className="text-sm text-gray-500 hidden md:inline">
                        {format(new Date(item.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600">{getThemeLabel(item.theme)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onViewGeneration(item)}>
                      Ver
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onEditGeneration(item)}>
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
                </div>
                {/* Data: visível embaixo no mobile, escondida no desktop */}
                <span className="text-sm flex justify-end text-gray-500 mt-1 md:hidden">
                  {format(new Date(item.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de visualização */}
      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewItem?.title}</DialogTitle>
            <DialogDescription>
              <span className="font-semibold">{viewItem?.content_type === 'sermon' ? 'Sermão' : 'Devocional'}</span> - {getThemeLabel(viewItem?.theme)}<br />
              <span className="text-xs text-gray-500">{viewItem?.bible_verse}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="prose max-w-none whitespace-pre-wrap">
            {viewItem?.content}
          </div>
        </DialogContent>
      </Dialog>

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

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [photoUrl, setPhotoUrl] = useState(user?.user_metadata?.avatar_url || "");
  const [uploading, setUploading] = useState(false);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [savingName, setSavingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [rawImage, setRawImage] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setPhotoUrl(data.user?.user_metadata?.avatar_url || "");
      setFullName(data.user?.user_metadata?.full_name || "");
    };
    getUser();
  }, []);

  const handleSaveName = async () => {
    if (!user) return;
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
    if (error) {
      toast({ title: 'Erro ao salvar nome', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Nome atualizado!', description: 'Seu nome foi alterado.' });
    }
    setSavingName(false);
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = () => {
      setRawImage(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropSave = async () => {
    if (!rawImage || !croppedAreaPixels || !user) {
      toast({ title: 'Erro ao salvar foto', description: 'Não foi possível processar a imagem.', variant: 'destructive' });
      setCropModalOpen(false);
      return;
    }
    setUploading(true);
    try {
      // Garantir que croppedAreaPixels tem x, y, width, height
      const { x, y, width, height } = croppedAreaPixels;
      const croppedBlob = await getCroppedImg(rawImage, { x, y, width, height });
      const fileExt = 'png';
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, croppedBlob, { upsert: true, contentType: 'image/png' });
      if (uploadError) {
        toast({ title: 'Erro ao fazer upload', description: uploadError.message, variant: 'destructive' });
        setUploading(false);
        setCropModalOpen(false);
        return;
      }
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const url = data.publicUrl + '?t=' + Date.now();
      setPhotoUrl(url);
      setRawImage(null);
      setCropModalOpen(false);
      // Atualiza o user_metadata
      const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: url } });
      if (updateError) {
        toast({ title: 'Erro ao salvar foto', description: updateError.message, variant: 'destructive' });
      } else {
        toast({ title: 'Foto atualizada!', description: 'Sua foto de perfil foi alterada.' });
      }
    } catch (err: any) {
      toast({ title: 'Erro ao processar imagem', description: err?.message || 'Erro desconhecido.', variant: 'destructive' });
    }
    setUploading(false);
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    setPhotoUrl("");
    const { error } = await supabase.auth.updateUser({ data: { avatar_url: "" } });
    if (error) {
      toast({ title: 'Erro ao remover foto', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Foto removida', description: 'Sua foto de perfil foi removida.' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Meu Perfil</h2>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {photoUrl ? (
                <img src={photoUrl} alt="Foto de perfil" className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" />
              ) : (
                <User className="w-10 h-10 text-gray-400 bg-gray-100 rounded-full p-1" />
              )}
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                {photoUrl ? (
                  <img src={photoUrl} alt="Foto de perfil" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                    <User className="w-10 h-10 text-gray-400" />
                  </div>
                )}
                <button
                  type="button"
                  className="absolute bottom-0 right-0 bg-white border border-gray-300 rounded-full p-1 shadow hover:bg-gray-50"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="Alterar foto"
                >
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2a2.828 2.828 0 11-4-4 2.828 2.828 0 014 4z" /></svg>
                </button>
                {photoUrl && (
                  <button
                    type="button"
                    className="absolute top-0 right-0 bg-white border border-gray-300 rounded-full p-1 shadow hover:bg-gray-50"
                    onClick={handleRemovePhoto}
                    disabled={uploading}
                    title="Remover foto"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  disabled={uploading}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50"
                  disabled={savingName}
                />
                <Button
                  size="sm"
                  onClick={handleSaveName}
                  disabled={savingName || !fullName.trim() || fullName === user?.user_metadata?.full_name}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {savingName ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">E-mail</label>
              <input
                type="email"
                value={user?.email || 'Não informado'}
                className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50"
                readOnly
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Plano Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg">
              <div>
                <h3 className="font-semibold text-yellow-800">Plano Gratuito</h3>
                <p className="text-sm text-yellow-600">Gerações ilimitadas</p>
              </div>
              <Button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700">
                Fazer Upgrade
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Modal de crop de imagem */}
      <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent className="max-w-md">
          <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
            {rawImage && (
              <Cropper
                image={rawImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="flex gap-4 items-center mt-4">
            <label className="text-sm">Zoom</label>
            <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={e => setZoom(Number(e.target.value))} className="flex-1" />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setCropModalOpen(false)} disabled={uploading}>Cancelar</Button>
            <Button onClick={handleCropSave} disabled={uploading}>{uploading ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Plans = () => {
  // Mock de dados dos planos e histórico
  const planos = [
    {
      id: 'free',
      nome: 'Gratuito',
      preco: 'R$ 0',
      descricao: 'Para começar',
      beneficios: [
        '5 gerações por mês',
        'Temas básicos',
        'Suporte por email',
      ],
      destaque: false,
    },
    {
      id: 'premium',
      nome: 'Premium',
      preco: 'R$ 29',
      descricao: 'Mais popular',
      beneficios: [
        'Gerações ilimitadas',
        'Todos os temas',
        'Download em PDF',
        'Suporte prioritário',
        'Histórico completo',
      ],
      destaque: true,
    },
    {
      id: 'anual',
      nome: 'Anual',
      preco: 'R$ 290',
      descricao: 'Melhor valor',
      beneficios: [
        'Tudo do Premium',
        '2 meses grátis',
        'Acesso antecipado',
        'Consultoria mensal',
        'Recursos exclusivos',
      ],
      destaque: false,
    },
  ];
  const planoAtual = planos[1]; // Exemplo: Premium
  const metodoPagamento = { tipo: 'Visa', final: '4532' };
  const historico = [
    { mes: 'Janeiro 2024', valor: 'R$ 29,00', status: 'Pago' },
    { mes: 'Dezembro 2023', valor: 'R$ 29,00', status: 'Pago' },
    { mes: 'Novembro 2023', valor: 'R$ 29,00', status: 'Pago' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Planos e Cobrança</h2>
      {/* Plano Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" /> Plano Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg">
            <div>
              <h3 className="font-semibold text-yellow-800">{planoAtual.nome}</h3>
              <p className="text-sm text-yellow-600">{planoAtual.beneficios[0]}</p>
            </div>
            <Button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700">Alterar Plano</Button>
          </div>
        </CardContent>
      </Card>
      {/* Planos Disponíveis */}
      <div className="grid md:grid-cols-3 gap-6">
        {planos.map((plano) => (
          <Card key={plano.id} className={plano.destaque ? 'border-2 border-blue-500 shadow-lg scale-105' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {plano.nome}
                {plano.destaque && <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">Mais Popular</span>}
              </CardTitle>
              <CardDescription>{plano.descricao}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{plano.preco}{plano.id === 'premium' && <span className="text-base font-normal">/mês</span>}{plano.id === 'anual' && <span className="text-base font-normal">/ano</span>}</div>
              <ul className="mb-4 space-y-1 text-sm">
                {plano.beneficios.map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-green-700"><span>✔️</span> {b}</li>
                ))}
              </ul>
              <Button className="w-full" variant={plano.destaque ? 'default' : 'outline'} disabled={plano.id === planoAtual.id}>{plano.id === planoAtual.id ? 'Plano Atual' : 'Assinar'}</Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Método de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Método de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="bg-gray-200 px-2 py-1 rounded text-sm">{metodoPagamento.tipo}</span>
              <span className="text-gray-600">•••• {metodoPagamento.final}</span>
            </div>
            <Button size="sm" variant="outline">Alterar</Button>
          </div>
        </CardContent>
      </Card>
      {/* Histórico de Cobrança */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Cobrança</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plano</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historico.map((h, i) => (
                <TableRow key={i}>
                  <TableCell>Plano Premium - {h.mes}</TableCell>
                  <TableCell>14/{String(i + 1).padStart(2, '0')}/2024</TableCell>
                  <TableCell>{h.valor}</TableCell>
                  <TableCell><span className="text-green-600 font-semibold">{h.status}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
