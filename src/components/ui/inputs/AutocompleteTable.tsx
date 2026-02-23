import { forwardRef, type ReactNode } from "react";
import Autocomplete, {
  type AutocompleteProps,
} from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Paper, { type PaperProps } from "@mui/material/Paper";
import TextField from "@mui/material/TextField";

type Column<Option> = {
  key: string;
  header: string;
  width?: string | number;
  align?: "left" | "center" | "right";
  render: (option: Option) => ReactNode;
};

type Props<Option> = Omit<
  AutocompleteProps<Option, false, false, false>,
  "renderInput" | "renderOption" | "options" | "value" | "onChange"
> & {
  options: Option[];
  value: Option | null;
  onChange: (value: Option | null) => void;
  columns: Column<Option>[];
  getOptionLabel: (option: Option) => string;
  getOptionKey: (option: Option) => string | number;
  label?: string;
  placeholder?: string;
  noOptionsText?: string;
};

const resolveColumnWidth = (width?: string | number) => {
  if (typeof width === "number") return `${width}px`;
  return width ?? "1fr";
};

function AutocompleteTable<Option>({
  options,
  value,
  onChange,
  columns,
  getOptionLabel,
  getOptionKey,
  label,
  placeholder,
  noOptionsText = "Sin resultados",
  size = "small",
  className,
  ...rest
}: Props<Option>) {
  const gridTemplateColumns = columns
    .map((column) => resolveColumnWidth(column.width))
    .join(" ");

  const PaperWithHeader = forwardRef<HTMLDivElement, PaperProps>(
    function PaperWithHeaderComponent(props, ref) {
      const { children, ...paperProps } = props;
      return (
        <Paper ref={ref} {...paperProps}>
          <Box
            sx={{
              px: 1.5,
              py: 1,
              borderBottom: "1px solid",
              borderColor: "divider",
              bgcolor: "grey.50",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns,
                gap: 1,
                fontSize: 12,
                fontWeight: 600,
                color: "text.secondary",
              }}
            >
              {columns.map((column) => (
                <Box key={column.key} sx={{ textAlign: column.align ?? "left" }}>
                  {column.header}
                </Box>
              ))}
            </Box>
          </Box>
          {children}
        </Paper>
      );
    },
  );

  const renderOption = (
    props: React.HTMLAttributes<HTMLLIElement>,
    option: Option,
  ) => (
    <li {...props} key={String(getOptionKey(option))}>
      <Box
        sx={{
          width: "100%",
          display: "grid",
          gridTemplateColumns,
          gap: 1,
          fontSize: 13,
          py: 0.25,
        }}
      >
        {columns.map((column) => (
          <Box key={column.key} sx={{ textAlign: column.align ?? "left" }}>
            {column.render(option)}
          </Box>
        ))}
      </Box>
    </li>
  );

  return (
    <Autocomplete<Option, false, false, false>
      className={className}
      options={options}
      value={value}
      onChange={(_, nextValue) => onChange(nextValue)}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={(option, selectedValue) =>
        getOptionKey(option) === getOptionKey(selectedValue)
      }
      noOptionsText={noOptionsText}
      PaperComponent={PaperWithHeader}
      renderOption={renderOption}
      size={size}
      {...rest}
      renderInput={(params) => (
        <TextField {...params} label={label} placeholder={placeholder} />
      )}
    />
  );
}

export default AutocompleteTable;
