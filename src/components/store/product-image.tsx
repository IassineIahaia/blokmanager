"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { BlockIllustration } from "./block-illustration";

/** Detecta imagens que falharam antes de o React ligar o onError (renderizadas no servidor). */
function useImageFallback() {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);
  return { failed, ref, onError: () => setFailed(true) };
}

/**
 * Foto do produto. Usa o URL definido no admin; se não houver, tenta
 * `/produtos/<tipo>.jpg` em `public/`. Se a foto não carregar, mostra a ilustração.
 */
export function ProductImage({
  type,
  label,
  imageUrl,
  className,
}: {
  type: string;
  label: string;
  imageUrl: string | null;
  className?: string;
}) {
  const { failed, ref, onError } = useImageFallback();
  const src = imageUrl || `/produtos/${type}.jpg`;

  if (failed) {
    return (
      <div className={cn("grid place-items-center bg-gradient-to-b from-white to-gray-100", className)}>
        <BlockIllustration type={type} className="h-3/5 transition-transform duration-500 group-hover:scale-105" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={label}
      ref={ref}
      onError={onError}
      className={cn("object-cover transition-transform duration-500 group-hover:scale-[1.03]", className)}
    />
  );
}

/** Imagem grande (hero). Se a foto não existir, mostra uma composição com as ilustrações. */
export function HeroImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const { failed, ref, onError } = useImageFallback();

  if (failed) {
    return (
      <div
        className={cn("relative bg-gradient-to-br from-gray-100 via-white to-gray-200", className)}
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-400/30 blur-3xl" />
        <BlockIllustration type="15cm" className="absolute left-[8%] top-[12%] h-[38%] drop-shadow-2xl" />
        <BlockIllustration type="12cm" className="absolute right-[8%] top-[30%] h-[34%] drop-shadow-2xl" />
        <BlockIllustration type="pave" className="absolute bottom-[10%] left-[24%] h-[32%] drop-shadow-2xl" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} ref={ref}
      onError={onError} className={cn("object-cover", className)} />
  );
}
