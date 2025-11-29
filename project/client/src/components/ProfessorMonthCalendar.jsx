import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProfessorMonthCalendar({ events = [], onSelectDate, selectedDate }) {
  const [current, setCurrent] = useState(new Date());

  const monthLabel = useMemo(() =>
    current.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  [current]);

  const days = useMemo(() => {
    const year = current.getFullYear();
    const month = current.getMonth();
    // JS getDay(): 0=Sun..6=Sat; we want header starting Mon
    // Compute offset so week starts Monday
    const firstJs = new Date(year, month, 1).getDay();
    const first = (firstJs + 6) % 7; // shift so Mon=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const needed = Math.ceil((first + daysInMonth) / 7) * 7; // full weeks
    const start = new Date(year, month, 1 - first);

    const list = [];
    const todayStr = new Date().toDateString();

    for (let i = 0; i < needed; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = d.toDateString();
      const isCurrentMonth = d.getMonth() === month;
      const isToday = dateStr === todayStr;
      const dayEvents = events.filter((e) => {
        const ed = new Date(e.startDateTime || e.startDate || e.date);
        return ed.toDateString() === dateStr;
      });
      list.push({ d, isCurrentMonth, isToday, dayEvents });
    }
    return list;
  }, [current, events]);

  return (
    <div className="bg-white rounded-xl p-6 border border-[#c8d9e6]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[#2f4156]">{monthLabel}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrent((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
            className="p-1 hover:bg-[#f5efeb] rounded transition-colors"
          >
            <ChevronLeft size={20} className="text-[#567c8d]" />
          </button>
          <button
            onClick={() => setCurrent((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
            className="p-1 hover:bg-[#f5efeb] rounded transition-colors"
          >
            <ChevronRight size={20} className="text-[#567c8d]" />
          </button>
        </div>
      </div>

      <div
        className="mb-2"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gap: "0.5rem",
        }}
      >
        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-[#567c8d] py-2">
            {d}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gap: "0.5rem",
        }}
      >
        {days.map(({ d, isCurrentMonth, isToday, dayEvents }, idx) => {
          const dateNum = d.getDate();
          const baseText = isCurrentMonth ? "text-[#374151]" : "text-[#cbd5e1]"; // slate-700 vs muted
          const isSelected = selectedDate && d.toDateString() === selectedDate.toDateString();
          const hasEvents = dayEvents.length > 0;
          const bg = isSelected
            ? "bg-[#dbeafe] text-[#1e40af] font-semibold" // selected
            : isToday
            ? "bg-white border-2 border-[#93c5fd] text-[#1f2937]" // today ring
            : hasEvents && isCurrentMonth
            ? "bg-[#eef2ff] hover:bg-[#e0e7ff]" // indigo-50 tint for event days
            : "bg-white hover:bg-[#f8fafc]";
          return (
            <button
              key={idx}
              onClick={() => onSelectDate && onSelectDate(d)}
              className={`h-10 md:h-12 flex items-center justify-center text-sm rounded-lg transition-colors relative border border-[#e5e7eb] ${bg} ${baseText}`}
              title={dayEvents.length ? `${dayEvents.length} event(s)` : ""}
            >
              {dateNum}
              {/* Removed dot; tint is applied via bg for event days */}
            </button>
          );
        })}
      </div>

      {/* Optional mini list of events for the selected date could be added */}
    </div>
  );
}
