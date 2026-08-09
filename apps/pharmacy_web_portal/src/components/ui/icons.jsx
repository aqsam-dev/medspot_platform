export default function Icon({ name, className = "" }) {
  return (
    <span
      className={`material-symbols-outlined leading-none ${className}`}
    >
      {name}
    </span>
  );
}