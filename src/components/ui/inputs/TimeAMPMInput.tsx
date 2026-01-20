import { Controller, type Control } from "react-hook-form";

const TIME_TEMPLATE = "__:__AM";
const EDITABLE_POS = [0, 1, 3, 4, 5, 6]; // HH MM A P

const normalize = (value?: string) =>
  /^[0-9_]{2}:[0-9_]{2}(AM|PM)$/i.test(value || "")
    ? value!.toUpperCase()
    : TIME_TEMPLATE;

const getChars = (value?: string) => normalize(value).split("");

export const TimeAMPMInput = ({
  name,
  control,
}: {
  name: string;
  control: Control<any>;
}) => {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={TIME_TEMPLATE}
      render={({ field }) => (
        <input
          {...field}
          className="rounded-lg border px-2 py-1.5 font-mono tracking-widest"
          value={normalize(field.value)}
          onFocus={(e) => {
            const el = e.currentTarget;
            requestAnimationFrame(() =>
              el.setSelectionRange(0, el.value.length),
            );
          }}
          onKeyDown={(e) => {
            const el = e.currentTarget;
            const pos = el.selectionStart ?? 0;

            // Bloquear navegación rara
            if (["ArrowUp", "ArrowDown"].includes(e.key)) {
              e.preventDefault();
            }

            // Backspace
            if (e.key === "Backspace") {
              e.preventDefault();
              const prev =
                EDITABLE_POS.filter((p) => p < pos).slice(-1)[0] ?? 0;

              const chars = getChars(field.value);
              chars[prev] = "_";
              field.onChange(chars.join(""));
              requestAnimationFrame(() => el.setSelectionRange(prev, prev));
              return;
            }

            // Delete
            if (e.key === "Delete") {
              e.preventDefault();
              if (!EDITABLE_POS.includes(pos)) return;
              const chars = getChars(field.value);
              chars[pos] = "_";
              field.onChange(chars.join(""));
              return;
            }

            // Solo números y A/P/M
            if (e.key.length === 1 && !/[0-9APM]/i.test(e.key)) {
              e.preventDefault();
            }
          }}
          onChange={(e) => {
            const el = e.currentTarget;
            const pos = el.selectionStart ?? 0;
            const char = e.nativeEvent.data;
            if (!char) return;

            const idx = EDITABLE_POS.includes(pos - 1)
              ? pos - 1
              : EDITABLE_POS.find((p) => p >= pos);

            if (idx == null) return;

            const chars = getChars(field.value);
            chars[idx] = char.toUpperCase();
            field.onChange(chars.join(""));

            const next = EDITABLE_POS.find((p) => p > idx) ?? idx;
            requestAnimationFrame(() => el.setSelectionRange(next, next));
          }}
        />
      )}
    />
  );
};
