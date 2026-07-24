"use client";

import Image from "next/image";
import type { IBranding } from "@/types";

interface Props {
  branding: IBranding | null;
  width: number;
  height: number;
}

export default function CoverPage({ branding, width, height }: Props) {
  return (
    <div
      className="relative w-full h-full overflow-hidden bg-[#0a0a0a] flex flex-col items-center justify-center"
      style={{ width, height }}
    >
      {/* Cover background — video takes priority, falls back to image */}
      {branding?.coverVideoUrl ? (
        <video
          src={branding.coverVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : branding?.coverImageUrl ? (
        <Image
          src={branding.coverImageUrl}
          alt="cover"
          fill
          className="object-cover"
          priority
        />
      ) : null}
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/30 to-black/80" />

      {/* Content */}
      <div className="relative z-10 text-center px-8 flex flex-col items-center gap-4">
        {branding?.logoUrl && (
          <Image
            src={branding.logoUrl ?? "/regalialogo.png"}
            alt="logo"
            width={80}
            height={80}
            className="rounded-full border-2 border-white/20 object-cover"
          />
        )}
        <h1 className="font-playfair text-white text-4xl font-bold tracking-widest uppercase">
          {branding?.restaurantName ?? "Regalia Resort"}
        </h1>
        {branding?.tagline && (
          <p className="text-white/60 text-sm tracking-widest font-light italic">
            {branding.tagline}
          </p>
        )}
        <div className="w-16 h-px bg-white/30 mt-2" />
        <p className="text-white/40 text-xs tracking-widest uppercase">Menu</p>
      </div>

      {/* Corner ornaments */}
      <div className="absolute top-4 left-4 text-white/10 text-3xl">✦</div>
      <div className="absolute top-4 right-4 text-white/10 text-3xl">✦</div>
      <div className="absolute bottom-4 left-4 text-white/10 text-3xl">✦</div>
      <div className="absolute bottom-4 right-4 text-white/10 text-3xl">✦</div>
    </div>
  );
}
