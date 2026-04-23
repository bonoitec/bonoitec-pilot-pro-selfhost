import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";
import { CheckoutDialog } from "@/components/CheckoutDialog";

type Plan = "monthly" | "quarterly" | "annual";

interface CheckoutDialogState {
  open: (plan: Plan) => void;
  close: () => void;
  isOpen: boolean;
  plan: Plan | null;
}

const Ctx = createContext<CheckoutDialogState | null>(null);

export function CheckoutDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);

  const open = useCallback((p: Plan) => {
    setPlan(p);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Keep plan around briefly so the dialog's exit animation has data to render.
    setTimeout(() => setPlan(null), 250);
  }, []);

  const value = useMemo(() => ({ open, close, isOpen, plan }), [open, close, isOpen, plan]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <CheckoutDialog open={isOpen} plan={plan} onClose={close} />
    </Ctx.Provider>
  );
}

export function useCheckoutDialog(): CheckoutDialogState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCheckoutDialog must be used inside <CheckoutDialogProvider>");
  return ctx;
}
