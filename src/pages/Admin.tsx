import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [generations, setGenerations] = useState<any[]>([]);
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState<{user_id: string, full_name: string, email: string, count: number}[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Busca todas as gerações com join no profile
      const { data: gens, error } = await supabase
        .from('generations')
        .select('*, profiles:profiles(id, full_name, email)')
        .order('created_at', { ascending: false });
      if (!error && gens) {
        setGenerations(gens);
        // Agrupa por usuário
        const stats: {[key: string]: {user_id: string, full_name: string, email: string, count: number}} = {};
        gens.forEach((g: any) => {
          const uid = g.user_id;
          const full_name = g.profiles && g.profiles.full_name ? g.profiles.full_name : 'Sem nome';
          const email = g.profiles && g.profiles.email ? g.profiles.email : '';
          if (!stats[uid]) {
            stats[uid] = {
              user_id: uid,
              full_name,
              email,
              count: 0,
            };
          }
          stats[uid].count++;
        });
        setUserStats(Object.values(stats).sort((a, b) => b.count - a.count));
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-pink-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">Painel Admin</h1>
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          <Card className="mb-10">
            <CardHeader>
              <CardTitle>Ranking de Gerações por Usuário</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Quantidade de Gerações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userStats.map((u: any) => (
                    <TableRow key={u.user_id}>
                      <TableCell>{u.full_name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Todas as Gerações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Nome do Usuário</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generations.map((g: any) => (
                    <TableRow key={g.id}>
                      <TableCell>{format(new Date(g.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                      <TableCell>{g.content_type === 'sermon' ? 'Sermão' : 'Devocional'}</TableCell>
                      <TableCell>{g.title}</TableCell>
                      <TableCell>{g.profiles?.full_name || 'Sem nome'}</TableCell>
                      <TableCell>{g.profiles?.email || ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 