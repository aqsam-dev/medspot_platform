export default function Input({
  label,
  value,
  onChange,
  type = "text"
}) {
  return (
    <div className="mb-4">

      <label className="block text-sm font-medium mb-2">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full border rounded-lg px-3 py-2"
      />

    </div>
  );
}