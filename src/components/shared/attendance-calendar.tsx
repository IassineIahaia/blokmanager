import { cn } from "@/lib/utils";
import type { AttendanceDay } from "@/types";

interface AttendanceCalendarProps {
  attendance: AttendanceDay[];
  presentCount: number;
  totalDays: number;
}

export function AttendanceCalendar({ attendance, presentCount, totalDays }: AttendanceCalendarProps) {
  const absences = totalDays - presentCount;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-label-caps uppercase text-on-surface-variant">
          Assiduidade
        </h3>
        <p className="text-body-sm font-medium text-on-surface">
          {presentCount} Presentes / {absences} Faltas
        </p>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {attendance.map((day) => (
          <div
            key={day.day}
            className={cn(
              "aspect-square rounded-sm flex items-center justify-center text-body-sm font-medium",
              day.present
                ? "bg-surface-container-low text-on-surface"
                : "bg-error-container text-on-error-container"
            )}
          >
            {day.day}
          </div>
        ))}
      </div>
    </div>
  );
}