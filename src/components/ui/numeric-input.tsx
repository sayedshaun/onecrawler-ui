import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";

type NumericInputProps = Omit<React.ComponentProps<typeof Input>, "type" | "value" | "onChange"> & {
  value: number;
  emptyValue: number;
  onValueChange: (value: number) => void;
};

/**
 * Keeps the text the user is editing separate from its numeric form value, so
 * an empty number field does not immediately render its fallback value again.
 */
export function NumericInput({ value, emptyValue, onValueChange, ...props }: NumericInputProps) {
  const [textValue, setTextValue] = useState(() => String(value));
  const previousValue = useRef(value);

  useEffect(() => {
    if (value !== previousValue.current) {
      setTextValue(String(value));
      previousValue.current = value;
    }
  }, [value]);

  return (
    <Input
      {...props}
      type="number"
      value={textValue}
      onChange={(event) => {
        const nextText = event.target.value;
        setTextValue(nextText);

        const nextValue = nextText === "" ? emptyValue : Number(nextText);
        if (Number.isFinite(nextValue)) {
          previousValue.current = nextValue;
          onValueChange(nextValue);
        }
      }}
    />
  );
}
