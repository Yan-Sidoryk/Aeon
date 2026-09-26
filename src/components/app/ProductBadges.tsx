import { Check, TriangleAlert } from "lucide-react";
import type { Product } from "@/types/api";
import { Badge } from "./ui";

/** Card badges for a product: FDA label, tier, boxed warning, and "Labeled by" for partner products. */
export function ProductBadges({ product }: { product: Product }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {product.label_found ? (
        <Badge tone="lime">
          <Check className="size-3" strokeWidth={3} />
          FDA label found
        </Badge>
      ) : (
        <Badge>No FDA label</Badge>
      )}
      <Badge tone="white">{product.tier}</Badge>
      {product.has_boxed_warning && (
        <Badge tone="flame">
          <TriangleAlert className="size-3" strokeWidth={2.5} />
          Boxed warning
        </Badge>
      )}
      {product.partner && product.labeler && <Badge tone="lavender">Labeled by {product.labeler}</Badge>}
    </div>
  );
}
