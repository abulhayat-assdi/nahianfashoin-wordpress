const FALLBACK_ITEMS = [
  "Featured on the Ellen's Show",
  "6 Million Customers",
  "2,50,000+ 4.9 Star Ratings",
  "Oprah's Favorite Things 2018 & 2019"
];

interface TickerProps {
  tickerItems?: string[];
}

export default function Ticker({ tickerItems }: TickerProps) {
  const items = tickerItems && tickerItems.length > 0 ? tickerItems : FALLBACK_ITEMS;
  
  return (
    <div className="flex h-[52px] w-full items-center overflow-hidden bg-brand-green">
      <div className="flex whitespace-nowrap animate-[marquee_34s_linear_infinite]">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex shrink-0 items-center gap-10 px-5 text-[18px] font-bold tracking-[0.06em] text-white md:text-[21px]"
          >
            {items.map((text, idx) => (
              <span key={idx} className="flex items-center gap-10">
                <span>{text}</span>
                <span className="opacity-60">&bull;</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
