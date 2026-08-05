import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, TrendingUp, DollarSign, PieChart as PieChartIcon, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";
import { useMemo } from "react";

const COLORS = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"];

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: expenses = [], isLoading: expensesLoading } = trpc.expenses.list.useQuery(undefined, {
    enabled: !!user,
  });

  const monthlyIncome = 1290;

  // Calcular estatísticas
  const stats = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(String(e.amount || 0)), 0);
    const balance = monthlyIncome - totalExpenses;
    const savingsPercentage = monthlyIncome > 0 ? ((balance / monthlyIncome) * 100) : 0;

    // Agrupar gastos por categoria
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach((e) => {
      const category = e.category;
      expensesByCategory[category] = (expensesByCategory[category] || 0) + parseFloat(String(e.amount || 0));
    });

    // Dados para gráfico de pizza
    const categoryLabels: Record<string, string> = {
      alimentacao: "Alimentação",
      lazer: "Lazer",
      contas: "Contas",
      transporte: "Transporte",
      saude: "Saúde",
      outros: "Outros",
    };

    const pieData = Object.entries(expensesByCategory).map(([category, amount]) => ({
      name: categoryLabels[category] || category,
      value: parseFloat(amount.toFixed(2)),
    }));

    // Adicionar economia ao gráfico de pizza
    if (balance > 0) {
      pieData.push({
        name: "Economia",
        value: parseFloat(balance.toFixed(2)),
      });
    }

    // Dados para gráfico de linha
    const dailyExpenses: Record<number, number> = {};
    expenses.forEach((e) => {
      const date = new Date(e.date);
      const day = date.getDate();
      dailyExpenses[day] = (dailyExpenses[day] || 0) + parseFloat(String(e.amount || 0));
    });

    const lineData = [];
    for (let i = 1; i <= 30; i += 5) {
      let cumulative = 0;
      for (let j = 1; j <= i; j++) {
        cumulative += dailyExpenses[j] || 0;
      }
      lineData.push({
        name: `Dia ${i}`,
        gastos: parseFloat(cumulative.toFixed(2)),
      });
    }

    if (lineData.length === 0) {
      lineData.push(
        { name: "Dia 1", gastos: 0 },
        { name: "Dia 5", gastos: 0 },
        { name: "Dia 10", gastos: 0 },
        { name: "Dia 15", gastos: 0 },
        { name: "Dia 20", gastos: 0 },
        { name: "Dia 25", gastos: 0 },
        { name: "Dia 30", gastos: 0 }
      );
    }

    const economyData = [
      { name: "Gasto", value: parseFloat(totalExpenses.toFixed(2)) },
      { name: "Economia", value: parseFloat(balance.toFixed(2)) },
    ];

    return {
      totalExpenses,
      balance,
      savingsPercentage,
      pieData,
      lineData,
      economyData,
    };
  }, [expenses]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-slate-400">Faça login para continuar</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 pb-28">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-100">Minhas Finanças</h1>
            <p className="text-sm text-slate-400">Controle financeiro pessoal</p>
          </div>
        </div>
      </div>

      {/* Renda Líquida Card */}
      <Card className="mb-6 p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl shadow-slate-900/50 rounded-2xl animate-slide-up">
        <div className="mb-3">
          <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Renda Líquida Mensal</p>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-4xl md:text-5xl font-bold text-indigo-400">R$ {monthlyIncome.toFixed(2)}</p>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          R$ 1.400,00 - 8% FGTS = R$ {monthlyIncome.toFixed(2)}
        </p>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8">
        {/* Total Gasto */}
        <Card className="p-4 md:p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-lg hover:shadow-xl transition-smooth">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Gasto</p>
            <BarChart3 className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-red-400">
            R$ {stats.totalExpenses.toFixed(2)}
          </p>
        </Card>

        {/* Saldo Restante */}
        <Card className="p-4 md:p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-lg hover:shadow-xl transition-smooth">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Saldo</p>
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-indigo-400">
            R$ {stats.balance.toFixed(2)}
          </p>
        </Card>

        {/* Economizado */}
        <Card className="p-4 md:p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-lg hover:shadow-xl transition-smooth">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Economizado</p>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-emerald-400">
            {stats.savingsPercentage.toFixed(1)}%
          </p>
        </Card>

        {/* Status */}
        <Card className="p-4 md:p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-lg hover:shadow-xl transition-smooth">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Status</p>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-sm font-semibold text-emerald-400">
            Ativo
          </p>
        </Card>
      </div>

      {/* Gráficos */}
      {expensesLoading ? (
        <Card className="p-8 text-center border border-slate-700 bg-slate-800/50 rounded-xl">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
        </Card>
      ) : (
        <>
          {/* Gráfico de Economia */}
          <Card className="mb-6 p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <p className="text-sm font-bold uppercase text-slate-300">Economia vs Gastos</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.economyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }}
                  formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Gráfico de Pizza */}
          {stats.pieData.length > 0 && (
            <Card className="mb-6 p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-lg">
              <div className="flex items-center gap-2 mb-6">
                <PieChartIcon className="w-5 h-5 text-pink-400" />
                <p className="text-sm font-bold uppercase text-slate-300">Distribuição de Gastos</p>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: R$ ${value.toFixed(2)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Gráfico de Linha */}
          <Card className="mb-6 p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <p className="text-sm font-bold uppercase text-slate-300">Evolução de Gastos (Últimos 30 dias)</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }}
                  formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="gastos"
                  stroke="#6366f1"
                  dot={{ fill: "#ec4899", r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Gastos"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}

      {/* Quick Actions */}
      <div className="space-y-3 mb-8">
        <Button
          onClick={() => setLocation("/expenses")}
          className="w-full py-6 md:py-5 text-sm font-bold uppercase rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-smooth"
        >
          + Adicionar Gasto
        </Button>
        <Button
          onClick={() => setLocation("/investments")}
          className="w-full py-6 md:py-5 text-sm font-bold uppercase rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-smooth"
        >
          + Adicionar Investimento
        </Button>
      </div>
    </div>
  );
}
