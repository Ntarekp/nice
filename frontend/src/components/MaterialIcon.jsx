export default function MaterialIcon({
  name,
  size = 24,
  fill = false,
  className = '',
  style = {},
}) {
  return (
    <span
      className={`material-symbols-outlined ${fill ? 'icon-fill' : ''} ${className}`.trim()}
      style={{ fontSize: size, ...style }}
      aria-hidden
    >
      {name}
    </span>
  )
}
