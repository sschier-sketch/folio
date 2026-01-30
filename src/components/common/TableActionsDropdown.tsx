import { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface ActionItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger';
  hidden?: boolean;
}

interface TableActionsDropdownProps {
  actions: ActionItem[];
}

export default function TableActionsDropdown({ actions }: TableActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const visibleActions = actions.filter(action => !action.hidden);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 192;

      let left = rect.right - dropdownWidth;
      let top = rect.bottom + 4;

      if (left < 8) {
        left = 8;
      }

      if (top + 200 > window.innerHeight) {
        top = rect.top - 200;
      }

      setPosition({ top, left });
    }
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors border"
        style={{ backgroundColor: '#EEF4FF', borderColor: '#DDE7FF' }}
        title="Aktionen"
      >
        <MoreVertical className="w-4 h-4" style={{ color: '#1e1e24' }} />
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999]"
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
          <div className="py-1">
            {visibleActions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                className={`w-full flex items-center px-4 py-2 text-sm text-left transition-colors ${
                  action.variant === 'danger'
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
