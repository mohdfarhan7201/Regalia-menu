"use client";

import Image from "next/image";
import { Phone, MessageCircle } from "lucide-react";
import type { IBranding, ILocation } from "@/types";

interface Props {
  branding: IBranding | null;
  location: ILocation | null;
  width: number;
  height: number;
}

export default function BackCoverPage({
  branding,
  location,
  width,
  height,
}: Props) {
  const qrUrl = location
    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
        `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/menu?type=${location.type}&location=${location.code}`,
      )}`
    : null;

  return (
    <div
      className="w-full h-full bg-[#0a0a0a] flex flex-col items-center justify-center relative overflow-hidden"
      style={{ width, height }}
    >
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/40" />

      <div className="relative z-10 text-center px-8 flex flex-col items-center gap-5">
        <div className="w-16 h-px bg-white/20" />

        {branding?.logoUrl && (
          <Image
            src={branding.logoUrl}
            alt="logo"
            width={60}
            height={60}
            className="rounded-full border border-white/20 object-cover"
          />
        )}

        <div>
          <h2 className="font-playfair text-white text-2xl font-bold tracking-widest uppercase">
            {branding?.restaurantName ?? "Regalia"}
          </h2>
          {branding?.tagline && (
            <p className="text-white/40 text-xs tracking-widest italic mt-1">
              {branding.tagline}
            </p>
          )}
        </div>

        {/* Contact info */}
        <div className="flex flex-col gap-1.5 text-sm text-white/60">
          {branding?.callNumber && (
            <p className="inline-flex items-center gap-2 justify-center">
              <Phone className="w-3.5 h-3.5 text-[var(--menu-accent)]" />
              {branding.callNumber}
            </p>
          )}
          {branding?.whatsappNumber && (
            <p className="inline-flex items-center gap-2 justify-center">
              <MessageCircle className="w-3.5 h-3.5 text-[var(--menu-accent)]" />
              +{branding.whatsappNumber}
            </p>
          )}
        </div>

        {/* QR Code */}
        {qrUrl && (
          <div className="flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="QR Code"
              width={100}
              height={100}
              className="rounded-lg p-1.5 bg-white"
            />
            <p className="text-white/30 text-xs">Scan to open menu</p>
          </div>
        )}

        <div className="w-16 h-px bg-white/20 mt-2" />
      </div>

      <div className="absolute top-4 left-4 text-white/10 text-3xl">✦</div>
      <div className="absolute bottom-4 right-4 text-white/10 text-3xl">✦</div>
    </div>
  );
}
