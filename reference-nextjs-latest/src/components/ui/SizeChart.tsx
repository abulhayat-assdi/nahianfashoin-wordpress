"use client";

import { useState } from "react";
import { X, Ruler } from "lucide-react";

const SIZES = [
  { size: "M",   length: 40, chest: 42, shoulder: 17,   sleeve: 24.5, collar: 17.5 },
  { size: "L",   length: 42, chest: 44, shoulder: 18,   sleeve: 25.5, collar: 18 },
  { size: "XL",  length: 44, chest: 46, shoulder: 19,   sleeve: 26,   collar: 18 },
  { size: "XXL", length: 46, chest: 48, shoulder: 19.5, sleeve: 26.5, collar: 19 },
];

export default function SizeChart() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-[13px] text-[#1a3c2e] font-semibold hover:underline"
      >
        <Ruler size={14} />
        Size Chart
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white w-full max-w-[500px] rounded-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#eee]">
              <h3 className="text-[16px] font-bold text-[#1a1a1a]">Size Chart (Inch)</h3>
              <button onClick={() => setOpen(false)} className="text-[#999] hover:text-[#444]">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-x-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-[#1a3c2e] text-white">
                    <th className="px-2 py-2.5 text-left font-semibold">Size</th>
                    <th className="px-2 py-2.5 text-center font-semibold">Length</th>
                    <th className="px-2 py-2.5 text-center font-semibold">Chest</th>
                    <th className="px-2 py-2.5 text-center font-semibold">Shoulder</th>
                    <th className="px-2 py-2.5 text-center font-semibold">Sleeve</th>
                    <th className="px-2 py-2.5 text-center font-semibold">Collar</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZES.map((row, i) => (
                    <tr key={row.size} className={i % 2 === 0 ? "bg-white" : "bg-[#f8f8f8]"}>
                      <td className="px-2 py-2.5 font-bold text-[#1a3c2e]">{row.size}</td>
                      <td className="px-2 py-2.5 text-center text-[#444]">{row.length}</td>
                      <td className="px-2 py-2.5 text-center text-[#444]">{row.chest}</td>
                      <td className="px-2 py-2.5 text-center text-[#444]">{row.shoulder}</td>
                      <td className="px-2 py-2.5 text-center text-[#444]">{row.sleeve}</td>
                      <td className="px-2 py-2.5 text-center text-[#444]">{row.collar}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-[#999] px-5 py-3 border-t border-[#eee]">
              * সব মাপ ইঞ্চিতে। পণ্যভেদে ১ ইঞ্চি পার্থক্য হতে পারে।
            </p>
          </div>
        </div>
      )}
    </>
  );
}
