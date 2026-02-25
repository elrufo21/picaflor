import { useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import type { PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, Box, Button, IconButton, Divider } from "@mui/material";

type Props = {
    from: string;
    to: string;
    onChangeFrom: (value: string) => void;
    onChangeTo: (value: string) => void;
    focusNextSelector?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toIso = (d: Dayjs | null): string =>
    d && d.isValid() ? d.format("YYYY-MM-DD") : "";

const fromIso = (s: string): Dayjs | null => {
    if (!s) return null;
    const trimmed = String(s).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const parsedIso = dayjs(trimmed, "YYYY-MM-DD", true);
        return parsedIso.isValid() ? parsedIso : null;
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
        const parsedDmy = dayjs(trimmed, "DD/MM/YYYY", true);
        return parsedDmy.isValid() ? parsedDmy : null;
    }

    const fallback = dayjs(trimmed);
    return fallback.isValid() ? fallback : null;
};

dayjs.extend(customParseFormat);

// ─── Custom Day Component ─────────────────────────────────────────────────────

// PickersDayProps might not be generic in this version
type CustomDayProps = PickersDayProps & {
    day: Dayjs;
    selectedDay?: Dayjs | null;
    hoveredDay?: Dayjs | null;
    rangeStart?: Dayjs | null;
    rangeEnd?: Dayjs | null;
};

const CustomPickersDay = (props: CustomDayProps) => {
    const { day, rangeStart, rangeEnd, selectedDay, hoveredDay, ...other } = props;

    const isStart = rangeStart && day.isSame(rangeStart, "day");
    const isEnd = rangeEnd && day.isSame(rangeEnd, "day");
    const isRange =
        rangeStart &&
        rangeEnd &&
        day.isAfter(rangeStart, "day") &&
        day.isBefore(rangeEnd, "day");

    // Style logic
    const style: React.CSSProperties = {};
    if (isStart || isEnd) {
        style.backgroundColor = "#10b981"; // emerald-500
        style.color = "#fff";
        style.borderRadius = "50%";
    } else if (isRange) {
        style.backgroundColor = "#d1fae5"; // emerald-100
        style.color = "#064e3b"; // emerald-900
        style.borderRadius = 0;
    }

    // Visual connection tweaks for start/end
    const wrapperStyle: React.CSSProperties = { position: "relative" };

    return (
        <div style={{ padding: 0, ...wrapperStyle }}>
            {/* Background connector for range ends */}
            {rangeStart && rangeEnd && (isStart || isEnd || isRange) && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: isStart ? "50%" : 0,
                        right: isEnd ? "50%" : 0,
                        backgroundColor: "#d1fae5",
                        zIndex: -1,
                    }}
                />
            )}
            <PickersDay
                {...other}
                day={day}
                disableMargin
                selected={!!isStart || !!isEnd}
                sx={{
                    ...(isStart || isEnd
                        ? {
                            backgroundColor: "#10b981 !important",
                            color: "#fff !important",
                        }
                        : {}),
                    ...style,
                }}
            />
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const TravelDateRangePicker = ({
    from,
    to,
    onChangeFrom,
    onChangeTo,
    focusNextSelector,
}: Props) => {
    const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);

    // Internal state for the popover
    const [localFrom, setLocalFrom] = useState<Dayjs | null>(null);
    const [localTo, setLocalTo] = useState<Dayjs | null>(null);
    const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());

    // Sync props to state when opening
    const handleOpen = (event: React.MouseEvent<HTMLDivElement>) => {
        setAnchorEl(event.currentTarget);
        const f = fromIso(from);
        const t = fromIso(to);
        setLocalFrom(f);
        setLocalTo(t);
        // Focus month on from/to date or current month
        const baseMonth = f ?? t ?? dayjs();
        setCurrentMonth(baseMonth.startOf("month"));
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleDayClick = (day: Dayjs) => {
        // Logic:
        // 1. If start is null, set start.
        // 2. If start is set but end is null:
        //    - If day < start, set start to day (reset).
        //    - If day > start, set end to day.
        // 3. If both set, reset start to day, clear end.

        if (!localFrom || (localFrom && localTo)) {
            setLocalFrom(day);
            setLocalTo(null);
        } else if (localFrom && !localTo) {
            if (day.isBefore(localFrom)) {
                setLocalFrom(day);
            } else {
                setLocalTo(day);
            }
        }
    };

    const handleConfirm = () => {
        onChangeFrom(toIso(localFrom));
        onChangeTo(toIso(localTo));
        handleClose();
        if (focusNextSelector) {
            setTimeout(() => {
                const next = document.querySelector<HTMLInputElement>(
                    focusNextSelector,
                );
                next?.focus();
            }, 0);
        }
    };

    const handleClear = () => {
        setLocalFrom(null);
        setLocalTo(null);
    };

    const handlePrevMonth = () => setCurrentMonth((prev) => prev.subtract(1, "month"));
    const handleNextMonth = () => setCurrentMonth((prev) => prev.add(1, "month"));

    // Display text strings
    const fromText = fromIso(from)?.format("DD MMM YYYY") || "";
    const toText = fromIso(to)?.format("DD MMM YYYY") || "";

    const open = Boolean(anchorEl);

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            {/* ─── Trigger ────────────────────────────────────────────────────── */}
            <div
                className="col-span-1 md:col-span-2 lg:col-span-2 flex rounded-lg border border-slate-300 overflow-hidden bg-white hover:border-emerald-400 cursor-pointer transition-colors"
                onClick={handleOpen}
            >
                <div className="flex-1 flex flex-col px-3 pt-2 pb-1.5 border-r border-slate-100">
                    <span className="text-[10px] font-semibold tracking-widest uppercase text-emerald-600">Salida</span>
                    <span className={`text-sm font-medium ${fromText ? "text-slate-800" : "text-slate-400"}`}>{fromText || "Seleccionar"}</span>
                </div>
                <div className="flex-1 flex flex-col px-3 pt-2 pb-1.5">
                    <span className="text-[10px] font-semibold tracking-widest uppercase text-slate-500">Regreso</span>
                    <span className={`text-sm font-medium ${toText ? "text-slate-800" : "text-slate-400"}`}>{toText || "Seleccionar"}</span>
                </div>
            </div>

            {/* ─── Popover ────────────────────────────────────────────────────── */}
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                PaperProps={{
                    style: { maxWidth: 'none', borderRadius: '16px', overflow: 'hidden' }
                }}
            >
                <div className="bg-white p-4">
                    {/* Header with Custom Navigation */}
                    <div className="flex items-center justify-between mb-4 px-2">
                        <IconButton onClick={handlePrevMonth} size="small">
                            <ChevronLeft className="h-5 w-5" />
                        </IconButton>

                        <IconButton onClick={handleNextMonth} size="small">
                            <ChevronRight className="h-5 w-5" />
                        </IconButton>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Left Calendar (Current Month) */}
                        <Box sx={{ width: 300 }}>
                            <div className="text-center font-bold mb-2 text-slate-700 capitalize">
                                {currentMonth.format("MMMM YYYY")}
                            </div>
                            <DateCalendar
                                key={`left-${currentMonth.format("YYYY-MM")}`}
                                value={null} // Controlled manually via slots
                                referenceDate={currentMonth}
                                onMonthChange={(d) => setCurrentMonth(d.startOf("month"))}
                                onYearChange={(d) => setCurrentMonth(d)}
                                slots={{
                                    day: CustomPickersDay as any,
                                    calendarHeader: () => null, // Hide default header
                                }}
                                slotProps={{
                                    day: {
                                        rangeStart: localFrom,
                                        rangeEnd: localTo,
                                    } as any,
                                }}
                                onChange={(newValue) => newValue && handleDayClick(newValue)}
                                views={['day']}
                                disableHighlightToday={false}
                            />
                        </Box>

                        <div className="hidden md:block w-px bg-slate-100"></div>

                        {/* Right Calendar (Next Month) */}
                        <Box sx={{ width: 300 }}>
                            <div className="text-center font-bold mb-2 text-slate-700 capitalize">
                                {currentMonth.add(1, 'month').format("MMMM YYYY")}
                            </div>
                            <DateCalendar
                                key={`right-${currentMonth.add(1, "month").format("YYYY-MM")}`}
                                value={null}
                                referenceDate={currentMonth.add(1, 'month')}
                                onMonthChange={(d) =>
                                    setCurrentMonth(d.subtract(1, "month").startOf("month"))
                                }
                                onChange={(newValue) => newValue && handleDayClick(newValue)}
                                slots={{
                                    day: CustomPickersDay as any,
                                    calendarHeader: () => null, // Hide default header
                                }}
                                slotProps={{
                                    day: {
                                        rangeStart: localFrom,
                                        rangeEnd: localTo,
                                    } as any,
                                }}
                                views={['day']}
                            />
                        </Box>
                    </div>

                    <Divider sx={{ my: 2 }} />

                    <div className="flex items-center justify-end gap-3">
                        <Button
                            variant="outlined"
                            onClick={handleClear}
                            sx={{ borderRadius: '999px', textTransform: 'none', borderColor: '#e2e8f0', color: '#64748b' }}
                        >
                            Limpiar
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleConfirm}
                            disabled={!localFrom}
                            sx={{ borderRadius: '999px', textTransform: 'none', backgroundColor: '#059669', '&:hover': { backgroundColor: '#047857' } }}
                        >
                            Confirmar
                        </Button>
                    </div>
                </div>
            </Popover>
        </LocalizationProvider>
    );
};

export default TravelDateRangePicker;
