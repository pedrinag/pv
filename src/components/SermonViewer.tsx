import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Share, BookOpen, Calendar, Tag, Palette, BookMarked } from "lucide-react";
import { Generation } from "@/types/database";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import { cleanMarkdown } from "@/hooks/useGenerations";
import html2canvas from 'html2canvas';
import { useRef } from "react";

interface SermonViewerProps {
  sermon: Generation;
  onBack: () => void;
}

export const SermonViewer = ({ sermon, onBack }: SermonViewerProps) => {
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
    };
    return theme ? themes[theme] || theme : 'Sem tema';
  };

  const contentRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (contentRef.current) {
      const canvas = await html2canvas(contentRef.current, { backgroundColor: '#fff', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${sermon.title}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // fallback para txt
      const element = document.createElement('a');
      const file = new Blob([sermon.content || ''], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${sermon.title}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: sermon.title,
          text: sermon.content || '',
        });
      } catch (error) {
        console.log('Erro ao compartilhar:', error);
      }
    } else {
      navigator.clipboard.writeText(sermon.content || '');
    }
  };

  const getRawContent = () => {
    return sermon.content || sermon.output || '';
  };

  const getPreview = () => {
    const content = getRawContent();
    const match = content.match(/Título Impactante:([\s\S]*?)[\-–—]{3,}/);
    if (match) {
      const titulo = match[1].replace(/\n/g, ' ').trim();
      return `Título Impactante: ${titulo}`;
    }
    const lines = content.split('\n').filter(Boolean);
    const preview = lines.slice(0, 2).join(' ');
    return cleanMarkdown(preview)
      .replace(/\s*[-–—]{2,}\s*/g, ' ')
      .replace(/(^|\s)[-–—](?=\s|$)/g, ' ')
      .trim();
  };

  const getSermonContent = () => {
    let content = getRawContent();
    const preview = getPreview().trim();
    if (content.startsWith(preview)) {
      content = content.slice(preview.length).trimStart();
    }
    content = content.replace(/\n(?=[^\n])/g, '\n\n');
    return content;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="flex items-center gap-2 hover:bg-gray-50 transition-colors px-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleShare} 
            className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 transition-colors px-5"
          >
            <Share className="w-4 h-4" />
            Compartilhar
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDownload} 
            className="flex items-center gap-2 hover:bg-green-50 hover:text-green-600 transition-colors px-3"
          >
            <Download className="w-4 h-4" />
            Baixar
          </Button>
        </div>
      </div>

      <Card className="shadow-xl border-0 bg-white" ref={contentRef}>
        <CardHeader className="pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold ${
              sermon.content_type === 'sermon' 
                ? 'bg-blue-50 text-blue-700' 
                : 'bg-purple-50 text-purple-700'
            }`}>
              {sermon.content_type === 'sermon' ? (
                <BookOpen className="w-4 h-4 px-4" />
              ) : (
                <BookMarked className="w-4 h-4" />
              )}
              {sermon.content_type === 'sermon' ? 'Sermão' : 'Devocional'}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              {format(new Date(sermon.created_at), 'dd/MM/yyyy', { locale: ptBR })}
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
              {sermon.title}
            </h1>
            
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Tag className="w-4 h-4 text-blue-500" />
                <span><strong>{sermon.content_type === 'sermon' ? 'Tema:' : 'Tema ou Foco:'}</strong> {getThemeLabel(sermon.theme)}</span>
              </div>
              {sermon.occasion && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4 text-green-500" />
                  <span><strong>{sermon.content_type === 'sermon' ? 'Ocasião:' : 'Momento do Dia:'}</strong> {sermon.occasion}</span>
                </div>
              )}
              {sermon.tone && sermon.content_type === 'sermon' && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Palette className="w-4 h-4 text-purple-500" />
                  <span><strong>Tom:</strong> {sermon.tone}</span>
                </div>
              )}
              {sermon.bible_verse && (
                <div className="flex items-center gap-2 text-gray-600">
                  <BookMarked className="w-4 h-4 text-orange-500" />
                  <span><strong>Versículo:</strong> {sermon.bible_verse}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-8">
          <div className="prose prose-lg max-w-none">
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-400 text-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                <strong className="text-gray-900">Prévia:</strong>
              </div>
              <div className="text-gray-700">
                <ReactMarkdown>{getPreview()}</ReactMarkdown>
              </div>
            </div>

            <div className="prose prose-lg max-w-none">
              <div className="space-y-6 text-gray-800 leading-relaxed">
                <ReactMarkdown>{getSermonContent()}</ReactMarkdown>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
