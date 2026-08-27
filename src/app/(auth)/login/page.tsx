"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import gsap from "gsap";
import { useAuth } from "@/providers/auth-provider";
import { useGsapContext } from "@/hooks/use-gsap-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JestyWordmark } from "@/components/brand/jesty-mark";
import { ApiClientError } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const scope = useGsapContext<HTMLDivElement>((_ctx, el) => {
    gsap.set(el, { autoAlpha: 0, y: 24 });
    gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" });
    gsap.from(el.querySelectorAll("[data-stagger]"), {
      autoAlpha: 0,
      y: 12,
      duration: 0.45,
      stagger: 0.06,
      delay: 0.15,
      ease: "power2.out",
    });
  }, []);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await login(values.email, values.password);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Login failed";
      toast.error(message);
      if (scope.current) {
        gsap.fromTo(scope.current, { x: -8 }, { x: 0, duration: 0.4, ease: "elastic.out(1, 0.4)" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-app px-4">
      <div ref={scope} className="w-full max-w-sm border border-border bg-card p-8">
        <div data-stagger>
          <JestyWordmark className="mb-8" />
        </div>

        <div data-stagger className="mb-6">
          <h1 className="text-2xl font-semibold">Log in</h1>
          <p className="mt-1 text-base text-muted-foreground">Access your WhatsApp Business inbox.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div data-stagger className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div data-stagger className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <Button data-stagger type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log in"}
          </Button>
        </form>
      </div>
    </main>
  );
}