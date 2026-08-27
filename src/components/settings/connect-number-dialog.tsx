"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/components/ui/jesty-toast";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { integrationsApi, ApiClientError } from "@/lib/api";
import type { WhatsappIntegration } from "@/types";

const schema = z.object({
  label: z.string().optional(),
  phoneNumber: z.string().min(1, "Required"),
  phoneNumberId: z.string().min(1, "Required"),
  wabaId: z.string().min(1, "Required"),
  appId: z.string().min(1, "Required"),
  appSecret: z.string().optional(),
  accessToken: z.string().min(1, "Required"),
});
type FormValues = z.infer<typeof schema>;

export function ConnectNumberDialog({ onConnected }: { onConnected: (integration: WhatsappIntegration) => void }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      const integration = await integrationsApi.connect(values);
      onConnected(integration);
      toast.success("WhatsApp number connected");
      reset();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Couldn't connect this number");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Connect a number
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connect a WhatsApp number</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="label">Label</Label>
            <Input id="label" placeholder="Support number" {...register("label")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="phoneNumber">Phone number</Label>
            <Input id="phoneNumber" placeholder="+91 98765 43210" {...register("phoneNumber")} />
            {errors.phoneNumber && <p className="text-xs text-destructive">{errors.phoneNumber.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="phoneNumberId">Phone number ID</Label>
            <Input id="phoneNumberId" {...register("phoneNumberId")} />
            {errors.phoneNumberId && <p className="text-xs text-destructive">{errors.phoneNumberId.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="wabaId">WABA ID</Label>
            <Input id="wabaId" {...register("wabaId")} />
            {errors.wabaId && <p className="text-xs text-destructive">{errors.wabaId.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="appId">App ID</Label>
            <Input id="appId" {...register("appId")} />
            {errors.appId && <p className="text-xs text-destructive">{errors.appId.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="appSecret">App secret</Label>
            <Input id="appSecret" type="password" {...register("appSecret")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="accessToken">Access token</Label>
            <Input id="accessToken" type="password" {...register("accessToken")} />
            {errors.accessToken && <p className="text-xs text-destructive">{errors.accessToken.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Connect
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
