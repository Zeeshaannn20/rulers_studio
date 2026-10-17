// Renders structured data for Google (schema.org JSON-LD). Server component — no JS shipped.
export default function JsonLd({ data }: { data: object | null | undefined | (object | null | undefined)[] }) {
  const items = (Array.isArray(data) ? data : [data]).filter(Boolean) as object[];
  return (
    <>
      {items.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, "\\u003c") }} />
      ))}
    </>
  );
}
