import React from "react";
import {
  Briefcase,
  Gift,
  Laptop,
  TrendingUp,
  PlusCircle,
  Utensils,
  Receipt,
  Car,
  ShoppingCart,
  Film,
  ShoppingBag,
  Gamepad2,
  Coffee,
  PiggyBank,
  CreditCard,
  ShieldCheck,
  HeartHandshake,
  Package,
  Sparkles,
  HelpCircle,
} from "lucide-react";

interface CategoryIconProps {
  name: string;
  className?: string;
}

export function CategoryIcon({ name, className = "w-4 h-4" }: CategoryIconProps) {
  switch (name) {
    case "Briefcase":
      return <Briefcase className={className} />;
    case "Gift":
      return <Gift className={className} />;
    case "Laptop":
      return <Laptop className={className} />;
    case "TrendingUp":
      return <TrendingUp className={className} />;
    case "PlusCircle":
      return <PlusCircle className={className} />;
    case "Utensils":
      return <Utensils className={className} />;
    case "Receipt":
      return <Receipt className={className} />;
    case "Car":
      return <Car className={className} />;
    case "ShoppingCart":
      return <ShoppingCart className={className} />;
    case "Film":
      return <Film className={className} />;
    case "ShoppingBag":
      return <ShoppingBag className={className} />;
    case "Gamepad2":
      return <Gamepad2 className={className} />;
    case "Coffee":
      return <Coffee className={className} />;
    case "PiggyBank":
      return <PiggyBank className={className} />;
    case "CreditCard":
      return <CreditCard className={className} />;
    case "ShieldCheck":
      return <ShieldCheck className={className} />;
    case "HeartHandshake":
      return <HeartHandshake className={className} />;
    case "Package":
      return <Package className={className} />;
    case "Sparkles":
      return <Sparkles className={className} />;
    default:
      return <HelpCircle className={className} />;
  }
}
