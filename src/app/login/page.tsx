"use client";

import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEACTIVATED_FLAG } from "@/components/identity";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useData } from "@/lib/data";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Set by IdentityGate right before it signs a deactivated account back
  // out — checked once for the initial render, since that's the only moment
  // it's relevant.
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === "undefined" || !sessionStorage.getItem(DEACTIVATED_FLAG)) return null;
    sessionStorage.removeItem(DEACTIVATED_FLAG);
    return "Bu hesap pasif durumda.";
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const result = await login(email, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Beklenmedik bir hata oluştu.");
    }
  }

  return (
    <div className="mx-auto max-w-sm py-16">
      <Card>
        <CardHeader>
          <CardTitle>FactoryPilot&apos;a giriş yap</CardTitle>
          <CardDescription>E-postan ve şifrenle giriş yap.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="login-email">E-posta</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError(null);
                }}
                autoComplete="username"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="login-password">Şifre</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError(null);
                }}
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">
              <LogIn className="size-4" />
              Giriş yap
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
