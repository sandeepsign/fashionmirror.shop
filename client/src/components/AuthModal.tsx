import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: any) => void;
}

export function AuthModal({ isOpen, onClose, onLogin }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");

  const handleSuccess = (user: any) => {
    onLogin(user);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0">
        {mode === "login" ? (
          <LoginForm
            onSuccess={handleSuccess}
            onSwitchToRegister={() => setMode("register")}
          />
        ) : (
          <RegisterForm
            onSuccess={handleSuccess}
            onSwitchToLogin={() => setMode("login")}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}