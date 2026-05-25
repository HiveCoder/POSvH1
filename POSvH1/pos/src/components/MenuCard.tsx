import { FC } from 'react';
import { Pencil } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { splitVatInclusive } from '../lib/tax';

interface MenuCardProps {
  id: string;
  name: string;
  price: number;
  item_image: string | null;
  description?: string;
  course?: string;
  item: string;
  onClick?: () => void;
  onEdit?: () => void;
  disabled?: boolean;
}

const MenuCard: FC<MenuCardProps> = ({ 
  id, 
  name, 
  price, 
  item_image, 
  description,
  course, 
  item, 
  onClick,
  onEdit,
  disabled 
}) => {
  const vatSplit = splitVatInclusive(price);

  return (
    <div
      className={cn(
        "relative bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer min-h-[19rem] flex flex-col",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none"
      )}
      onClick={disabled ? undefined : onClick}
    >
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/95 text-gray-700 border border-gray-200 hover:bg-white"
          title="Edit item"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">Edit</span>
        </button>
      )}

      <div className="h-36">
        {item_image ? (
          <img
            src={item_image}
            alt={name}
            className="w-full h-full object-cover filter saturate-75 brightness-95"
            style={{ filter: 'saturate(0.7) brightness(0.95)' }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const placeholder = document.createElement('div');
                placeholder.className = 'w-full h-full bg-gray-200 flex items-center justify-center text-2xl text-gray-400 font-medium';
                placeholder.textContent = name.slice(0, 2).toUpperCase();
                parent.insertBefore(placeholder, target);
              }
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-2xl text-gray-400 font-medium">
            {name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 p-3 flex flex-col">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-5 break-words" title={name}>
            {name}
          </h3>
        </div>

        <div className="mt-1">
          <p className="text-xs text-gray-500 break-words" title={course}>
            {course || ' '}
          </p>
        </div>

        {description && (
          <p className="text-xs text-gray-600 mt-2 leading-4 break-words whitespace-pre-wrap">
            {description}
          </p>
        )}

        <div className="mt-auto pt-3">
          <span className="text-sm font-semibold text-gray-900 tabular-nums">
            {formatCurrency(price)}
          </span>
          <p className="text-[11px] text-gray-500 mt-0.5">
            VAT 12%: {formatCurrency(vatSplit.vatAmount)} | Net: {formatCurrency(vatSplit.vatableSales)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MenuCard; 