import { UtensilsCrossed, Gamepad2, FileText, Car, Heart, Package } from "lucide-react";

type ExpenseCategory = "alimentacao" | "lazer" | "contas" | "transporte" | "saude" | "outros";

const categoryConfig: Record<ExpenseCategory, { icon: React.ReactNode; label: string; emoji: string }> = {
  alimentacao: { icon: <UtensilsCrossed className="w-6 h-6" />, label: "Alimentação", emoji: "🍔" },
  lazer: { icon: <Gamepad2 className="w-6 h-6" />, label: "Lazer", emoji: "🎮" },
  contas: { icon: <FileText className="w-6 h-6" />, label: "Contas", emoji: "📄" },
  transporte: { icon: <Car className="w-6 h-6" />, label: "Transporte", emoji: "🚗" },
  saude: { icon: <Heart className="w-6 h-6" />, label: "Saúde", emoji: "⚕️" },
  outros: { icon: <Package className="w-6 h-6" />, label: "Outros", emoji: "📦" },
};

interface CategoryIconProps {
  category: ExpenseCategory;
  size?: "sm" | "md" | "lg";
  useEmoji?: boolean;
}

export function CategoryIcon({ category, size = "md", useEmoji = true }: CategoryIconProps) {
  const config = categoryConfig[category];

  if (useEmoji) {
    const sizeClass = {
      sm: "text-lg",
      md: "text-2xl",
      lg: "text-4xl",
    }[size];

    return <span className={sizeClass}>{config.emoji}</span>;
  }

  return <div className="text-accent">{config.icon}</div>;
}

export function getCategoryLabel(category: ExpenseCategory): string {
  return categoryConfig[category].label;
}

export function getCategoryEmoji(category: ExpenseCategory): string {
  return categoryConfig[category].emoji;
}
