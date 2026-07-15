import Link from "next/link";
import Image from "next/image";

export function Logo({ size = 32, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <Image src="/logo.png" alt="Elyto" width={size} height={size} priority />
      {withText ? <span className="text-lg font-semibold tracking-tight text-white">Elyto</span> : null}
    </Link>
  );
}
