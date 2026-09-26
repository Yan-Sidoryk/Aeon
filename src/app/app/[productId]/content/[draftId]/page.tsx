import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DraftDetail } from "@/components/app/fix/DraftDetail";
import { idParam } from "@/lib/params";

type Props = { params: Promise<{ productId: string; draftId: string }> };

export const metadata: Metadata = { title: "Draft · Content · Dashboard · Aeon" };

/** Dashboard → Content → one draft with its pre-MLR checklist. Owner-only, so it loads in the browser. */
export default async function DraftPage({ params }: Props) {
  const { productId, draftId } = await params;
  const product = idParam(productId);
  const draft = idParam(draftId);
  if (product === null || draft === null) notFound();
  return <DraftDetail productId={product} draftId={draft} />;
}
