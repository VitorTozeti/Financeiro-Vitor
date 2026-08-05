import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, TrendingUp, TrendingDown, Loader2, Edit2 } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Investments() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    ticker: "",
    quantity: "",
    averagePrice: "",
    currentPrice: "",
    description: "",
  });

  const utils = trpc.useUtils();
  const { data: investments = [], isLoading } = trpc.investments.list.useQuery(undefined, {
    enabled: !!user,
  });

  const createMutation = trpc.investments.create.useMutation({
    onSuccess: () => {
      utils.investments.list.invalidate();
      setFormData({ ticker: "", quantity: "", averagePrice: "", currentPrice: "", description: "" });
      setIsOpen(false);
      setEditingId(null);
    },
  });

  const updateMutation = trpc.investments.update.useMutation({
    onSuccess: () => {
      utils.investments.list.invalidate();
      setFormData({ ticker: "", quantity: "", averagePrice: "", currentPrice: "", description: "" });
      setIsOpen(false);
      setEditingId(null);
    },
  });

  const deleteMutation = trpc.investments.delete.useMutation({
    onSuccess: () => {
      utils.investments.list.invalidate();
    },
  });

  const handleAddInvestment = async () => {
    if (!formData.ticker || !formData.quantity || !formData.averagePrice || !formData.currentPrice) return;

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          currentPrice: parseFloat(formData.currentPrice),
          description: formData.description,
        });
      } else {
        await createMutation.mutateAsync({
          ticker: formData.ticker.toUpperCase(),
          quantity: parseFloat(formData.quantity),
          averagePrice: parseFloat(formData.averagePrice),
          currentPrice: parseFloat(formData.currentPrice),
          description: formData.description,
        });
      }
    } catch (error) {
      console.error("Erro ao salvar investimento:", error);
    }
  };

  const handleEditInvestment = (investment: any) => {
    setEditingId(investment.id);
    setFormData({
      ticker: investment.ticker,
      quantity: String(investment.quantity),
      averagePrice: String(investment.averagePrice),
      currentPrice: String(investment.currentPrice),
      description: investment.description || "",
    });
    setIsOpen(true);
  };

  const handleDeleteInvestment = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
    } catch (error) {
      console.error("Erro ao deletar investimento:", error);
    }
  };

  const calculateMetrics = (investment: any) => {
    const totalInvested = parseFloat(String(investment.quantity)) * parseFloat(String(investment.averagePrice));
    const currentValue = parseFloat(String(investment.quantity)) * parseFloat(String(investment.currentPrice));
    const profit = currentValue - totalInvested;
    const profitPercentage = (profit / totalInvested) * 100;
    const monthlyProjection = profit * 0.1;

    return {
      totalInvested,
      currentValue,
      profit,
      profitPercentage,
      monthlyProjection,
    };
  };

  const totalInvested = investments.reduce((sum, i) => sum + parseFloat(String(i.quantity)) * parseFloat(String(i.averagePrice)), 0);
  const totalCurrentValue = investments.reduce((sum, i) => sum + parseFloat(String(i.quantity)) * parseFloat(String(i.currentPrice)), 0);
  const totalProfit = totalCurrentValue - totalInvested;
  const totalProfitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-slate-400">Faça login para continuar</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-foreground p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-2">Meus Investimentos</h1>
        <p className="text-slate-400 text-sm">Acompanhe suas ações e rentabilidade</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-xl p-4 md:p-6 shadow-lg border border-indigo-500/30">
          <p className="text-indigo-200 text-xs font-semibold uppercase mb-2">Investido</p>
          <p className="text-2xl md:text-3xl font-bold text-white">R$ {totalInvested.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-pink-600 to-rose-900 rounded-xl p-4 md:p-6 shadow-lg border border-pink-500/30">
          <p className="text-pink-200 text-xs font-semibold uppercase mb-2">Valor Atual</p>
          <p className="text-2xl md:text-3xl font-bold text-white">R$ {totalCurrentValue.toFixed(2)}</p>
        </div>

        <div className={`bg-gradient-to-br ${totalProfit >= 0 ? 'from-emerald-600 to-emerald-900' : 'from-red-600 to-red-900'} rounded-xl p-4 md:p-6 shadow-lg border ${totalProfit >= 0 ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
          <p className={`${totalProfit >= 0 ? 'text-emerald-200' : 'text-red-200'} text-xs font-semibold uppercase mb-2`}>Lucro/Prejuízo</p>
          <p className="text-2xl md:text-3xl font-bold text-white">R$ {totalProfit.toFixed(2)}</p>
        </div>

        <div className={`bg-gradient-to-br ${totalProfitPercentage >= 0 ? 'from-amber-600 to-amber-900' : 'from-red-600 to-red-900'} rounded-xl p-4 md:p-6 shadow-lg border ${totalProfitPercentage >= 0 ? 'border-amber-500/30' : 'border-red-500/30'}`}>
          <p className={`${totalProfitPercentage >= 0 ? 'text-amber-200' : 'text-red-200'} text-xs font-semibold uppercase mb-2`}>Rentabilidade</p>
          <p className="text-2xl md:text-3xl font-bold text-white">{totalProfitPercentage.toFixed(2)}%</p>
        </div>
      </div>

      {/* Add Investment Button */}
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setEditingId(null);
          setFormData({ ticker: "", quantity: "", averagePrice: "", currentPrice: "", description: "" });
        }
      }}>
        <DialogTrigger asChild>
          <Button className="w-full mb-6 py-6 text-sm font-bold uppercase rounded-lg bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all">
            <Plus className="w-5 h-5 mr-2" />
            Adicionar Ação
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-slate-800 border border-slate-700 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-pink-400 font-bold text-lg">
              {editingId ? "Editar Ação" : "Nova Ação"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ticker" className="text-slate-200 uppercase text-xs font-bold">
                Ticker
              </Label>
              <Input
                id="ticker"
                placeholder="Ex: PETR4"
                value={formData.ticker}
                onChange={(e) => setFormData({ ...formData, ticker: e.target.value })}
                disabled={!!editingId}
                className="bg-slate-700 border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 mt-2 uppercase"
              />
            </div>

            <div>
              <Label htmlFor="quantity" className="text-slate-200 uppercase text-xs font-bold">
                Quantidade
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                disabled={!!editingId}
                className="bg-slate-700 border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 mt-2"
              />
            </div>

            <div>
              <Label htmlFor="averagePrice" className="text-slate-200 uppercase text-xs font-bold">
                Preço Médio (R$)
              </Label>
              <Input
                id="averagePrice"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.averagePrice}
                onChange={(e) => setFormData({ ...formData, averagePrice: e.target.value })}
                disabled={!!editingId}
                className="bg-slate-700 border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 mt-2"
              />
            </div>

            <div>
              <Label htmlFor="currentPrice" className="text-slate-200 uppercase text-xs font-bold">
                Preço Atual (R$)
              </Label>
              <Input
                id="currentPrice"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.currentPrice}
                onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
                className="bg-slate-700 border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 mt-2"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-slate-200 uppercase text-xs font-bold">
                Descrição (opcional)
              </Label>
              <Input
                id="description"
                placeholder="Notas sobre o investimento..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-700 border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 mt-2"
              />
            </div>

            <Button
              onClick={handleAddInvestment}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="w-full py-3 text-sm font-bold uppercase rounded-lg bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {editingId ? "Atualizar" : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Investments List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
          </div>
        ) : investments.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
            <p className="text-slate-400 text-sm">Nenhum investimento registrado</p>
          </div>
        ) : (
          investments.map((investment) => {
            const metrics = calculateMetrics(investment);
            const isProfit = metrics.profit >= 0;

            return (
              <div key={investment.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-2xl font-bold text-indigo-400">{investment.ticker}</p>
                      {isProfit ? (
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    {investment.description && <p className="text-xs text-slate-400">{investment.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditInvestment(investment)}
                      className="text-pink-400 hover:bg-pink-500/10 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteInvestment(investment.id)}
                      disabled={deleteMutation.isPending}
                      className="text-red-400 hover:bg-red-500/10 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs">Qtd</p>
                    <p className="font-bold text-slate-100">{parseFloat(String(investment.quantity)).toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs">Preço Médio</p>
                    <p className="font-bold text-slate-100">R$ {parseFloat(String(investment.averagePrice)).toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs">Preço Atual</p>
                    <p className="font-bold text-slate-100">R$ {parseFloat(String(investment.currentPrice)).toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs">Investido</p>
                    <p className="font-bold text-slate-100">R$ {metrics.totalInvested.toFixed(2)}</p>
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs">Valor Atual</p>
                    <p className="font-bold text-pink-400">R$ {metrics.currentValue.toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs">Lucro/Prejuízo</p>
                    <p className={`font-bold ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                      R$ {metrics.profit.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs">Rentabilidade</p>
                    <p className={`font-bold ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                      {metrics.profitPercentage.toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs">Projeção Mês</p>
                    <p className="font-bold text-amber-400">R$ {metrics.monthlyProjection.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
