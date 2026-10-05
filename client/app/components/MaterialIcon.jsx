export function MaterialIcon({
  name,
  className = "",
  size = 24,
  filled = false,
  style,
}) {
  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
        lineHeight: 1,
        ...style,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}