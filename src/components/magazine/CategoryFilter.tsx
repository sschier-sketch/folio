import { CATEGORIES, CATEGORY_LABELS } from "./magazineConstants";

interface Props {
  active: string;
  onChange: (category: string) => void;
}

export default function CategoryFilter({ active, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            active === cat
              ? "bg-[#3c8af7] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {CATEGORY_LABELS[cat]}
        </button>
      ))}
    </div>
  );
}
