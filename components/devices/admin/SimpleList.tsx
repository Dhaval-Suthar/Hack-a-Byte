interface SimpleListProps<T extends { _id: string }> {
  items: T[];
  label: (item: T) => React.ReactNode;
}

export default function SimpleList<T extends { _id: string }>({ items, label }: SimpleListProps<T>) {
  return (
    <ul className="border border-neutral-800 rounded divide-y divide-neutral-800 text-xs">
      {items.map((item) => (
        <li key={item._id} className="p-2 flex items-center gap-3">
          {label(item)}
        </li>
      ))}
      {!items.length && (
        <li className="p-4 text-center text-neutral-500">Empty</li>
      )}
    </ul>
  );
}
