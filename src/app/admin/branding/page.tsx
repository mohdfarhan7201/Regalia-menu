"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BrandingSchema } from "@/lib/validations";
import PageHeader from "@/components/PageHeader";
import { FormField, inputCls, textareaCls } from "@/components/admin/FormField";
import ImageUploadField from "@/components/admin/ImageUploadField";
import VideoUploadField from "@/components/admin/VideoUploadField";
import {
  Settings,
  Save,
  Hotel,
  Palette,
  Image as ImageIcon,
  Phone,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";

type BrandingInput = z.infer<typeof BrandingSchema>;

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-base-200 border border-base-300/60 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-base-300/40 bg-base-300/20">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">{title}</h2>
          <p className="text-xs text-base-content/40">{description}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function BrandingPage() {
  const qc = useQueryClient();
  const { data: branding, isLoading } = useQuery<BrandingInput>({
    queryKey: ["admin-branding"],
    queryFn: () => fetch("/api/admin/branding").then((r) => r.json()),
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<BrandingInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(BrandingSchema) as any,
    values: branding,
  });

  const watchedName = useWatch({ control, name: "hotelName" });
  const watchedTagline = useWatch({ control, name: "tagline" });
  const watchedPrimary = useWatch({ control, name: "primaryColor" });
  const watchedLogo = useWatch({ control, name: "logoUrl" });
  const watchedCoverImage = useWatch({ control, name: "coverImageUrl" });
  const watchedCoverVideo = useWatch({ control, name: "coverVideoUrl" });

  const saveMutation = useMutation({
    mutationFn: async (data: BrandingInput) => {
      const res = await fetch("/api/admin/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Branding saved successfully!");
      qc.invalidateQueries({ queryKey: ["admin-branding"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading)
    return (
      <div className="flex justify-center py-24">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );

  const isPending = isSubmitting || saveMutation.isPending;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Branding & Settings"
        subtitle="Hotel identity, colors and contact info"
        icon={Settings}
      />

      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))}>
        <div className="flex flex-col gap-4">
          {/* Live Preview Card */}
          <div
            className="rounded-2xl border border-base-300/60 p-5 flex items-center gap-5 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${watchedPrimary ?? "#C9A96E"}22, ${watchedPrimary ?? "#C9A96E"}06)`,
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0 shadow-lg"
              style={{ background: watchedPrimary ?? "#C9A96E", color: "#fff" }}
            >
              {(watchedName ?? "R").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-base">
                {watchedName || "Your Hotel Name"}
              </p>
              <p className="text-xs text-base-content/50 mt-0.5">
                {watchedTagline || "Your tagline appears here"}
              </p>
            </div>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-30">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Live Preview</span>
            </div>
          </div>

          {/* Identity */}
          <SectionCard
            icon={Hotel}
            title="Hotel Identity"
            description="Core info shown on menu and receipts"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Hotel Name"
                required
                error={
                  errors.hotelName
                    ? String(errors.hotelName.message)
                    : undefined
                }
                className="sm:col-span-2"
              >
                <input
                  {...register("hotelName")}
                  className={inputCls(!!errors.hotelName)}
                  placeholder="Regalia Resort"
                />
              </FormField>
              <FormField label="Tagline">
                <input
                  {...register("tagline")}
                  className={inputCls()}
                  placeholder="A Royal Experience"
                />
              </FormField>
              <ImageUploadField
                label="Hotel Logo"
                value={watchedLogo ?? ""}
                onChange={(url) =>
                  setValue("logoUrl", url, { shouldDirty: true })
                }
                uploadType="branding-logo"
                hint="Max 500 KB · PNG or SVG preferred"
              />
            </div>
          </SectionCard>

          {/* Colors */}
          <SectionCard
            icon={Palette}
            title="Brand Colors"
            description="Applied throughout the guest-facing menu"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Primary Color">
                <div className="flex gap-2.5 items-center">
                  <input
                    {...register("primaryColor")}
                    type="color"
                    className="w-11 h-11 rounded-xl cursor-pointer bg-base-100 border border-base-300 p-1 shrink-0"
                  />
                  <input
                    {...register("primaryColor")}
                    className={inputCls() + " flex-1 font-mono"}
                    placeholder="#C9A96E"
                  />
                </div>
              </FormField>
              <FormField label="Accent Color">
                <div className="flex gap-2.5 items-center">
                  <input
                    {...register("accentColor")}
                    type="color"
                    className="w-11 h-11 rounded-xl cursor-pointer bg-base-100 border border-base-300 p-1 shrink-0"
                  />
                  <input
                    {...register("accentColor")}
                    className={inputCls() + " flex-1 font-mono"}
                    placeholder="#1A1A2E"
                  />
                </div>
              </FormField>
            </div>
          </SectionCard>

          {/* Media */}
          <SectionCard
            icon={ImageIcon}
            title="Cover Media"
            description="Hero image and/or video shown on the menu landing screen"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <ImageUploadField
                  label="Cover Image"
                  value={watchedCoverImage ?? ""}
                  onChange={(url) =>
                    setValue("coverImageUrl", url, { shouldDirty: true })
                  }
                  uploadType="branding-cover"
                  hint="Max 2 MB · Landscape 16:9 recommended"
                />
                <p className="text-[11px] text-base-content/40 px-1">
                  Shown as a static fallback if no video is set, or on older
                  devices.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <VideoUploadField
                  label="Cover Video"
                  value={watchedCoverVideo ?? ""}
                  onChange={(url) =>
                    setValue("coverVideoUrl", url, { shouldDirty: true })
                  }
                  hint="Max 20 MB · MP4 recommended · Plays muted on loop"
                />
                <p className="text-[11px] text-base-content/40 px-1">
                  Autoplays muted & looped on the menu cover. Takes priority
                  over the image.
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Contact */}
          <SectionCard
            icon={Phone}
            title="Contact Details"
            description="Displayed on receipts and used for WhatsApp room orders"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="WhatsApp Number"
                hint="(no + prefix)"
                required
                error={
                  errors.whatsappNumber
                    ? String(errors.whatsappNumber.message)
                    : undefined
                }
                className="sm:col-span-2"
              >
                <input
                  {...register("whatsappNumber")}
                  className={inputCls(!!errors.whatsappNumber)}
                  placeholder="91XXXXXXXXXX"
                />
              </FormField>
              <FormField label="Phone">
                <input {...register("phone")} className={inputCls()} />
              </FormField>
              <FormField label="Email">
                <input
                  {...register("email")}
                  type="email"
                  className={inputCls()}
                />
              </FormField>
              <FormField label="Address" className="sm:col-span-2">
                <textarea
                  {...register("address")}
                  className={textareaCls}
                  rows={2}
                />
              </FormField>
            </div>
          </SectionCard>

          {/* Sticky footer */}
          <div className="sticky bottom-0 -mx-8 px-8 py-4 bg-base-100/80 backdrop-blur-md border-t border-base-300/40 flex items-center justify-between">
            <p className="text-xs text-base-content/40">
              {isDirty ? "You have unsaved changes" : "All changes saved"}
            </p>
            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary rounded-xl gap-2 min-w-36"
            >
              {isPending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
