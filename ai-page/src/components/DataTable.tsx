import React from "react";
import { downloadAsCSV } from "../lib/csv";
import type { TableData } from "../lib/csv";

interface DataTableProps {
  data: TableData;
}

export const DataTable: React.FC<DataTableProps> = ({ data }) => {
  return (
    <div className="glass-card rounded-xl border border-white/10 overflow-hidden my-6">
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
        <div>
          <h3 className="font-semibold text-slate-200 text-lg">{data.title}</h3>
          {data.explanation && (
            <p className="text-sm text-slate-400 mt-1">{data.explanation}</p>
          )}
        </div>
        <button
          onClick={() => downloadAsCSV(data)}
          className="flex items-center gap-2 px-4 py-2 bg-lime-500 hover:bg-lime-400 text-slate-950 rounded-lg text-sm font-medium transition-all shadow-lg shadow-lime-500/20 hover:scale-105 active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-white/10">
            <tr>
              {data.headers.map((header, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className="px-6 py-3 font-bold tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {data.rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="bg-slate-900/30 hover:bg-slate-900/50 transition-colors"
              >
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className="px-6 py-4 whitespace-nowrap text-slate-200"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
