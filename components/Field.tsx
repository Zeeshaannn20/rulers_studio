import type { ReactNode } from "react";

export default function Field({
  id,
  label,
  required,
  error,
  full,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={"fld" + (full ? " full" : "") + (error ? " bad" : "")}>
      <label htmlFor={id}>
        {label} {required && <i>*</i>}
      </label>
      {children}
      <span className="err" id={`${id}-err`}>
        {error}
      </span>
    </div>
  );
}
