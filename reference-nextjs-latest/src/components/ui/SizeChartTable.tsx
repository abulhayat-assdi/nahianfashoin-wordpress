const SIZES = [
  { size: "M",   length: 40, chest: 42, shoulder: 17,   sleeve: 24.5, collar: 17.5 },
  { size: "L",   length: 42, chest: 44, shoulder: 18,   sleeve: 25.5, collar: 18 },
  { size: "XL",  length: 44, chest: 46, shoulder: 19,   sleeve: 26,   collar: 18 },
  { size: "XXL", length: 46, chest: 48, shoulder: 19.5, sleeve: 26.5, collar: 19 },
];

export default function SizeChartTable() {
  return (
    <section className="bg-white border-t border-[#f0f0f0] py-10 md:py-14">
      <div className="mx-auto max-w-[1280px] px-4 md:px-10">
        <h2 className="text-[18px] md:text-[22px] font-bold text-[#1a1a1a] mb-6">
          Size Chart <span className="text-[14px] font-normal text-[#777]">(Inch)</span>
        </h2>
        <table className="w-full text-[12px] md:text-[14px] border border-[#eee]">
          <thead>
            <tr className="bg-[#1a3c2e] text-white">
              <th className="px-2 py-2 md:px-5 md:py-3 text-left font-semibold">Size</th>
              <th className="px-2 py-2 md:px-5 md:py-3 text-center font-semibold">Length</th>
              <th className="px-2 py-2 md:px-5 md:py-3 text-center font-semibold">Chest</th>
              <th className="px-2 py-2 md:px-5 md:py-3 text-center font-semibold">Shoulder</th>
              <th className="px-2 py-2 md:px-5 md:py-3 text-center font-semibold">Sleeve</th>
              <th className="px-2 py-2 md:px-5 md:py-3 text-center font-semibold">Collar</th>
            </tr>
          </thead>
          <tbody>
            {SIZES.map((row, i) => (
              <tr key={row.size} className={i % 2 === 0 ? "bg-white" : "bg-[#f8f8f8]"}>
                <td className="px-2 py-2.5 md:px-5 md:py-3.5 font-bold text-[#1a3c2e]">{row.size}</td>
                <td className="px-2 py-2.5 md:px-5 md:py-3.5 text-center text-[#444]">{row.length}</td>
                <td className="px-2 py-2.5 md:px-5 md:py-3.5 text-center text-[#444]">{row.chest}</td>
                <td className="px-2 py-2.5 md:px-5 md:py-3.5 text-center text-[#444]">{row.shoulder}</td>
                <td className="px-2 py-2.5 md:px-5 md:py-3.5 text-center text-[#444]">{row.sleeve}</td>
                <td className="px-2 py-2.5 md:px-5 md:py-3.5 text-center text-[#444]">{row.collar}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11px] text-[#999] mt-3">
          * সব মাপ ইঞ্চিতে। পণ্যভেদে ১ ইঞ্চি পার্থক্য হতে পারে।
        </p>
      </div>
    </section>
  );
}
