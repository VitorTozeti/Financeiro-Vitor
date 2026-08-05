import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type ExpenseCategory = "alimentacao" | "lazer" | "contas" | "transporte" | "saude" | "outros";

const categoryIcons: Record<ExpenseCategory, string> = {
  alimentacao: "🍔",
  lazer: "🎮",
  contas: "📄",
  transporte: "🚗",
  saude: "⚕️",
  outros: "📦",
};

const categoryLabels: Record<ExpenseCategory, string> = {
  alimentacao: "Alimentação",
  lazer: "Lazer",
  contas: "Contas",
  transporte: "Transporte",
  saude: "Saúde",
  outros: "Outros",
};

const categoryColors: Record<ExpenseCategory, string> = {
  alimentacao: "from-orange-500 to-red-600",
  lazer: "from-purple-500 to-pink-600",
  contas: "from-blue-500 to-cyan-600",
  transporte: "from-green-500 to-emerald-600",
  saude: "from-red-500 to-rose-600",
  outros: "from-gray-500 to-slate-600",
};

export default function Expenses() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: "alimentacao" as ExpenseCategory,
    amount: "",
    description: "",
  });

  const utils = trpc.useUtils();
  const { data: expenses = [], isLoading } = trpc.expenses.list.useQuery(undefined, {
    enabled: !!user,
  });

  const createMutation = trpc.expenses.create.useMutation({
    onSuccess: () => {
      utils.expenses.list.invalidate();
      setFormData({ category: "alimentacao", amount: "", description: "" });
      setIsOpen(false);
    },
  });

  const deleteMutation = trpc.expenses.delete.useMutation({
    onSuccess: () => {
      utils.expenses.list.invalidate();
    },
  });

  const handleAddExpense = async () => {
    if (!formData.amount || !formData.category) return;

    try {
      await createMutation.mutateAsync({
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description,
      });
    } catch (error) {
      console.error("Erro ao adicionar gasto:", error);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
    } catch (error) {
      console.error("Erro ao deletar gasto:", error);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(String(e.amount || 0)), 0);

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
        <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-2">Meus Gastos</h1>
        <p className="text-slate-400 text-sm">Controle e organize seus gastos por categoria</p>
      </div>

      {/* Total Card */}
      <div className="bg-gradient-to-br from-red-600 to-red-900 rounded-2xl p-6 md:p-8 shadow-2xl shadow-red-900/50 border border-red-500/30 mb-6">
        <p className="text-red-200 text-sm font-semibold uppercase tracking-wider mb-2">Total de Gastos</p>
        <p className="text-white text-4xl md:text-5xl font-bold">R$ {totalExpenses.toFixed(2)}</p>
      </div>

      {/* Add Expense Button */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="w-full mb-6 py-6 text-sm font-bold uppercase rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all">
            <Plus className="w-5 h-5 mr-2" />
            Adicionar Gasto
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-slate-800 border border-slate-700 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-indigo-400 font-bold text-lg">Novo Gasto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category" className="text-slate-200 uppercase text-xs font-bold">
                Categoria
              </Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v as ExpenseCategory })}>
                <SelectTrigger className="bg-slate-700 border-slate-600 rounded-lg text-slate-100 mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 rounded-lg">
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="text-slate-100">
                      {categoryIcons[key as ExpenseCategory]} {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount" className="text-slate-200 uppercase text-xs font-bold">
                Valor (R$)
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="bg-slate-700 border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 mt-2"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-slate-200 uppercase text-xs font-bold">
                Descrição (opcional)
              </Label>
              <Input
                id="description"
                placeholder="Descrição do gasto..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-700 border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 mt-2"
              />
            </div>

            <Button
              onClick={handleAddExpense}
              disabled={createMutation.isPending}
              className="w-full py-3 text-sm font-bold uppercase rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expenses List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
            <p className="text-slate-400 text-sm">Nenhum gasto registrado</p>
          </div>
        ) : (
          expenses.map((expense) => (
            <div key={expense.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`bg-gradient-to-br ${categoryColors[expense.category as ExpenseCategory]} rounded-lg p-3 flex-shrink-0`}>
                  <span className="text-2xl">{categoryIcons[expense.category as ExpenseCategory]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-100">{categoryLabels[expense.category as ExpenseCategory]}</p>
                  {expense.description && <p className="text-xs text-slate-400 truncate">{expense.description}</p>}
                  <p className="text-xs text-slate-500 mt-1">{new Date(expense.date).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="font-bold text-red-400 text-lg">R$ {parseFloat(String(expense.amount)).toFixed(2)}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteExpense(expense.id)}
                    disabled={deleteMutation.isPending}
                    className="text-red-400 hover:bg-red-500/10 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
