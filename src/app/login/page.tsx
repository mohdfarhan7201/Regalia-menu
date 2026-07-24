"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, type LoginInput } from "@/lib/validations";
import { ROLE_REDIRECTS } from "@/lib/auth-constants";
import type { UserRole } from "@/types";
import { Eye, EyeOff, UtensilsCrossed, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdminFormField } from "@/components/admin/AdminFormField";

function errorMessage(raw: string): string {
  if (raw.includes("account_inactive"))
    return "Your account has been deactivated. Please contact your manager.";
  if (raw.includes("invalid_credentials"))
    return "Incorrect email or password. Please try again.";
  return "Sign-in failed. Please try again.";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setError("");
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      role: "",
      redirect: false,
    });

    if (result?.error) {
      setError(errorMessage(result.error));
      setShakeKey((k) => k + 1);
      return;
    }

    // Fetch session to get role for redirect
    const res = await fetch("/api/auth/session");
    const session = await res.json();
    const role = session?.user?.role as UserRole | undefined;

    if (callbackUrl) {
      router.push(callbackUrl);
    } else if (role && ROLE_REDIRECTS[role]) {
      router.push(ROLE_REDIRECTS[role]);
    } else {
      router.push("/admin/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <UtensilsCrossed className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-playfair text-2xl font-bold text-base-content">
            Regalia
          </h1>
          <p className="text-base-content/50 text-sm mt-1">Operations Portal</p>
        </div>

        {/* Card */}
        <div className="card bg-base-200 shadow-xl border border-base-300">
          <div className="card-body gap-5">
            <h2 className="card-title text-lg">Sign In</h2>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form
              key={shakeKey}
              onSubmit={handleSubmit(onSubmit)}
              className={`flex flex-col gap-4 ${error ? "animate-shake" : ""}`}
            >
              <AdminFormField label="Email" error={errors.email?.message}>
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="you@regalia.com"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  className={
                    error
                      ? "border-destructive/60 focus-visible:ring-destructive/30"
                      : ""
                  }
                />
              </AdminFormField>

              <AdminFormField label="Password" error={errors.password?.message}>
                <div className="relative">
                  <Input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    className={`pr-10 ${error ? "border-destructive/60 focus-visible:ring-destructive/30" : ""}`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </AdminFormField>

              <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-base-content/60">
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs checkbox-primary"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me on this device
              </label>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 w-full"
              >
                {isSubmitting ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-base-content/30 mt-6">
          Regalia Digital Operations © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
