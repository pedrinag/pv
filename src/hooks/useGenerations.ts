import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Generation, ContentType, ThemeType, OccasionType, ToneType } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

export function cleanMarkdown(text: string) {
  return text.replace(/\*\*|__/g, '');
}

export const useGenerations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: generations, isLoading } = useQuery({
    queryKey: ['generations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Generation[];
    },
  });

  const generateSermonWithN8N = useMutation({
    mutationFn: async (generationData: {
      title: string;
      content_type: ContentType;
      theme?: ThemeType;
      occasion?: OccasionType;
      tone?: ToneType;
      bible_verse?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      console.log('Enviando dados para o webhook n8n:', generationData);

      // Enviar dados para o webhook n8n e aguardar resposta completa
      const session_id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : uuidv4();
      const webhookResponse = await fetch('https://n8n.zappify.online/webhook/gerar-sermao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titulo: generationData.title,
          tipo_conteudo: generationData.content_type,
          tema: generationData.theme || '',
          ocasiao: generationData.occasion || '',
          tom: generationData.tone || '',
          versiculo_base: generationData.bible_verse || '',
          user_id: user.id,
          usuario_id: user.id,
          session_id
        }),
      });

      if (!webhookResponse.ok) {
        throw new Error('Erro ao gerar conteúdo com n8n');
      }

      const webhookResult = await webhookResponse.json();
      console.log('Resposta completa do webhook n8n:', webhookResult);

      // Verificar se recebeu o conteúdo gerado
      let generatedContent;
      if (Array.isArray(webhookResult) && webhookResult.length > 0) {
        generatedContent = webhookResult[0].output || webhookResult[0].content || webhookResult[0].conteudo || webhookResult[0].sermao;
      } else {
        generatedContent = webhookResult.content || webhookResult.conteudo || webhookResult.sermao || webhookResult.output;
      }
      
      if (!generatedContent) {
        throw new Error('N8n não retornou conteúdo gerado');
      }

      // Salvar no banco de dados com o conteúdo recebido do n8n
      const { data, error } = await supabase
        .from('generations')
        .insert([{
          ...generationData,
          content: generatedContent,
          output: generatedContent,
          user_id: user.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['generations'] });
      toast({
        title: "Sermão gerado com sucesso!",
        description: "Seu sermão foi criado usando IA e salvo.",
      });
      return data;
    },
    onError: (error) => {
      console.error('Erro ao gerar sermão:', error);
      toast({
        title: "Erro ao gerar sermão",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateDevotionalWithN8N = useMutation({
    mutationFn: async (generationData: {
      title: string;
      content_type: ContentType;
      theme?: ThemeType;
      occasion?: OccasionType;
      bible_verse?: string;
      content?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Enviar dados para o webhook n8n e aguardar resposta completa
      const session_id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : uuidv4();
      const webhookResponse = await fetch('https://n8n.zappify.online/webhook/gerar-devocional', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titulo: generationData.title,
          tipo_conteudo: generationData.content_type,
          tema: generationData.theme || '',
          ocasiao: generationData.occasion || '',
          versiculo_base: generationData.bible_verse || '',
          content: generationData.content || '',
          id: user.id,
          user_id: user.id,
          usuario_id: user.id,
          session_id
        }),
      });

      if (!webhookResponse.ok) {
        throw new Error('Erro ao gerar conteúdo devocional com n8n');
      }

      const webhookResult = await webhookResponse.json();
      let generatedContent;
      if (Array.isArray(webhookResult) && webhookResult.length > 0) {
        generatedContent = webhookResult[0].output || webhookResult[0].content || webhookResult[0].conteudo || webhookResult[0].devocional;
      } else {
        generatedContent = webhookResult.content || webhookResult.conteudo || webhookResult.devocional || webhookResult.output;
      }
      if (!generatedContent) {
        throw new Error('N8n não retornou conteúdo gerado');
      }
      // Salvar no banco de dados
      const { data, error } = await supabase
        .from('generations')
        .insert([{
          ...generationData,
          content: generatedContent,
          output: generatedContent,
          user_id: user.id
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['generations'] });
      toast({
        title: 'Devocional gerado com sucesso!',
        description: 'Seu devocional foi criado usando IA e salvo.',
      });
      return data;
    },
    onError: (error) => {
      toast({
        title: 'Erro ao gerar devocional',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const createGeneration = useMutation({
    mutationFn: async (generationData: {
      title: string;
      content_type: ContentType;
      theme?: ThemeType;
      occasion?: OccasionType;
      tone?: ToneType;
      bible_verse?: string;
      content: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('generations')
        .insert([{
          ...generationData,
          output: generationData.content,
          user_id: user.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generations'] });
      toast({
        title: "Conteúdo salvo com sucesso!",
        description: "Seu conteúdo foi salvo.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar conteúdo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteGeneration = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('generations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generations'] });
      toast({
        title: "Geração excluída",
        description: "A geração foi excluída com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a geração. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateGeneration = useMutation({
    mutationFn: async (updateData: { id: string; data: Partial<Generation> }) => {
      const { id, data } = updateData;
      const { error } = await supabase
        .from('generations')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generations'] });
      toast({
        title: "Conteúdo atualizado com sucesso!",
        description: "Seu conteúdo foi editado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar conteúdo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    generations: generations || [],
    isLoading,
    createGeneration: createGeneration.mutate,
    isCreating: createGeneration.isPending,
    generateSermonWithN8N: generateSermonWithN8N.mutateAsync,
    isGeneratingWithN8N: generateSermonWithN8N.isPending,
    generateDevotionalWithN8N: generateDevotionalWithN8N.mutateAsync,
    isGeneratingDevotionalWithN8N: generateDevotionalWithN8N.isPending,
    deleteGeneration: deleteGeneration.mutate,
    isDeleting: deleteGeneration.isPending,
    updateGeneration: updateGeneration.mutate,
    isUpdating: updateGeneration.isPending,
  };
};
