"use client";

import { useEffect } from "react";

type Props = {
  productId: string;
  productName: string;
  price: number;
  category?: string;
};

export function ProductViewTracker({ productId, productName, price, category }: Props) {
  useEffect(() => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: "view_item",
      ecommerce: {
        currency: "BDT",
        value: price,
        items: [
          {
            item_id: productId,
            item_name: productName,
            item_brand: "Nahian Fashion",
            item_category: category || "Tea",
            price,
            quantity: 1,
          },
        ],
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally fires once on mount — this is a page-view event

  return null;
}
