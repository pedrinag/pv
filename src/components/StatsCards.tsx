import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Heart, TrendingUp, Calendar } from "lucide-react";
import { useGenerations } from "@/hooks/useGenerations";

export const StatsCards = () => {
  const { generations, isLoading } = useGenerations();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="relative overflow-hidden animate-pulse">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200"></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-300 rounded w-20"></div>
                <div className="w-12 h-12 bg-gray-300 rounded-xl"></div>
              </CardHeader>
              <CardContent className="relative">
                <div className="h-8 bg-gray-300 rounded w-12 mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthGenerations = generations.filter(gen => {
    const genDate = new Date(gen.created_at);
    return genDate.getMonth() === currentMonth && genDate.getFullYear() === currentYear;
  });

  const thisMonthSermons = thisMonthGenerations.filter(gen => gen.content_type === 'sermon').length;
  const thisMonthDevotionals = thisMonthGenerations.filter(gen => gen.content_type === 'devotional').length;
  const totalGenerations = generations.length;

  // Count unique days this month
  const activeDays = new Set(
    thisMonthGenerations.map(gen => new Date(gen.created_at).getDate())
  ).size;

  const stats = [
    {
      title: "Sermões Gerados",
      value: thisMonthSermons.toString(),
      description: "Este mês",
      icon: BookOpen,
      gradient: "from-blue-500 via-blue-600 to-blue-700",
      bgGradient: "from-blue-50 to-blue-100",
      iconBg: "bg-blue-500",
      shadowColor: "shadow-blue-500/25",
    },
    {
      title: "Devocionais Criados",
      value: thisMonthDevotionals.toString(), 
      description: "Este mês",
      icon: Heart,
      gradient: "from-purple-500 via-purple-600 to-purple-700",
      bgGradient: "from-purple-50 to-purple-100",
      iconBg: "bg-purple-500",
      shadowColor: "shadow-purple-500/25",
    },
    {
      title: "Total de Gerações",
      value: totalGenerations.toString(),
      description: "Desde o início",
      icon: TrendingUp,
      gradient: "from-green-500 via-green-600 to-green-700",
      bgGradient: "from-green-50 to-green-100",
      iconBg: "bg-green-500",
      shadowColor: "shadow-green-500/25",
    },
    {
      title: "Dias Ativos",
      value: activeDays.toString(),
      description: "Este mês",
      icon: Calendar,
      gradient: "from-orange-500 via-orange-600 to-orange-700",
      bgGradient: "from-orange-50 to-orange-100",
      iconBg: "bg-orange-500",
      shadowColor: "shadow-orange-500/25",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index} 
              className={`relative overflow-hidden border-0 shadow-lg ${stat.shadowColor} hover:shadow-xl hover:shadow-${stat.shadowColor.split('/')[0]}/40 transition-all duration-500 hover:scale-105 hover:-translate-y-1 group`}
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-60 group-hover:opacity-80 transition-opacity duration-300`}></div>
              
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-20 h-20 transform translate-x-8 -translate-y-8 opacity-10">
                <div className={`w-full h-full rounded-full bg-gradient-to-br ${stat.gradient}`}></div>
              </div>
              <div className="absolute bottom-0 left-0 w-16 h-16 transform -translate-x-6 translate-y-6 opacity-5">
                <div className={`w-full h-full rounded-full bg-gradient-to-tr ${stat.gradient}`}></div>
              </div>
              
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
                  {stat.title}
                </CardTitle>
                <div className={`w-12 h-12 rounded-xl ${stat.iconBg} shadow-lg group-hover:shadow-xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-gray-900 mb-1 group-hover:scale-105 transition-transform duration-300">
                  {stat.value}
                </div>
                <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                  {stat.description}
                </p>
              </CardContent>
              
              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
