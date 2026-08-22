import type { ReactNode } from "react";

interface ChipFilterProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export function ChipFilter({ label, options, value, onChange }: ChipFilterProps) {
  return (
    <div className="filter-group">
      <span>{label}</span>
      <div className="chip-row">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`chip${option === value ? " is-active" : ""}`}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ToggleChipProps {
  active: boolean;
  onClick: () => void;
  tone?: "warning" | "danger";
  children: ReactNode;
}

export function ToggleChip({ active, onClick, tone = "warning", children }: ToggleChipProps) {
  return (
    <button
      type="button"
      className={`chip${active ? ` is-active tone-${tone}` : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
