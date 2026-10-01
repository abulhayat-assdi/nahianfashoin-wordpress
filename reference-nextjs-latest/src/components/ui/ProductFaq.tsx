"use client";

import { useState } from "react";

type FAQ = {
  q: string;
  a: string;
};

export function ProductFaq({ faqs }: { faqs?: FAQ[]; productId: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const displayFaqs = faqs && faqs.length > 0 ? faqs : [];

  if (displayFaqs.length === 0) return null;

  return (
    <section className="bg-[#fcfaf7] px-6 py-[80px]">
      <div className="mx-auto max-w-[1200px]">
        <div className="text-center mb-10">
          <p className="text-[13px] font-bold uppercase tracking-widest text-[#222]">Learn More</p>
          <h2 className="mt-3 font-heading text-[32px] md:text-[42px] text-[#ac8545]">Frequently Asked Questions</h2>
        </div>

        <div className="mx-auto max-w-[1000px] space-y-4">
          {displayFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index} className="bg-white">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-[#fafafa]"
                >
                  <span className="text-[15px] font-bold text-[#222] pr-4 leading-tight">{faq.q}</span>
                  <span className="text-[24px] font-light text-[#222] flex-shrink-0 w-6 text-center">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-[14px] leading-[1.6] text-[#444] border-t border-[#f0f0f0] pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
