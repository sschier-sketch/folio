import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  MoreHorizontal,
  Eye,
  XCircle,
  RotateCcw,
  ShieldCheck,
  UserCog,
  UserCheck,
  Ban,
  Trash2,
} from 'lucide-react';

interface UserActionsDropdownProps {
  userId: string;
  userEmail: string;
  isPro: boolean;
  isCancelling: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  onImpersonate: (userId: string, email: string) => void;
  onCancelSubscription: (userId: string) => void;
  onRefund: (userId: string, email: string) => void;
  onGrantAdmin: (userId: string, email: string) => void;
  onRevokeAdmin: (userId: string, email: string) => void;
  onBan: (userId: string, email: string) => void;
  onUnban: (userId: string, email: string) => void;
  onDelete: (userId: string, email: string) => void;
}

interface ActionItem {
  label: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  hidden?: boolean;
}

export default function UserActionsDropdown({
  userId,
  userEmail,
  isPro,
  isCancelling,
  isAdmin,
  isBanned,
  onImpersonate,
  onCancelSubscription,
  onRefund,
  onGrantAdmin,
  onRevokeAdmin,
  onBan,
  onUnban,
  onDelete,
}: UserActionsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 288;
    let left = rect.right - menuWidth;
    if (left < 8) left = 8;
    setPosition({ top: rect.bottom + 4, left });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }

    function handleScroll() {
      setOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [open, updatePosition]);

  const actions: ActionItem[] = [
    {
      label: 'Als Nutzer anmelden',
      description: 'Im Kontext dieses Nutzers einloggen',
      icon: <Eye className="w-4 h-4" />,
      onClick: () => onImpersonate(userId, userEmail),
    },
    {
      label: 'Abo zum Laufzeitende kuendigen',
      description: 'Pro-Zugriff endet nach bezahlter Laufzeit',
      icon: <XCircle className="w-4 h-4" />,
      onClick: () => onCancelSubscription(userId),
      hidden: !isPro || isCancelling,
    },
    {
      label: 'Letzte Zahlung erstatten',
      description: 'Stripe-Rueckerstattung und sofortige Abo-Beendigung',
      icon: <RotateCcw className="w-4 h-4" />,
      onClick: () => onRefund(userId, userEmail),
      hidden: !isPro,
    },
    {
      label: 'Admin-Rechte entziehen',
      description: 'Administratorrechte fuer diesen Nutzer entfernen',
      icon: <ShieldCheck className="w-4 h-4" />,
      onClick: () => onRevokeAdmin(userId, userEmail),
      hidden: !isAdmin,
    },
    {
      label: 'Zum Admin machen',
      description: 'Administratorrechte fuer diesen Nutzer erteilen',
      icon: <UserCog className="w-4 h-4" />,
      onClick: () => onGrantAdmin(userId, userEmail),
      hidden: isAdmin,
    },
    {
      label: 'Sperre aufheben',
      description: 'Zugriff fuer diesen Nutzer wieder erlauben',
      icon: <UserCheck className="w-4 h-4" />,
      onClick: () => onUnban(userId, userEmail),
      hidden: !isBanned,
    },
    {
      label: 'Benutzer sperren',
      description: 'Zugriff fuer diesen Nutzer blockieren',
      icon: <Ban className="w-4 h-4" />,
      onClick: () => onBan(userId, userEmail),
      hidden: isBanned,
    },
    {
      label: 'Benutzer loeschen',
      description: 'Nutzer und alle Daten unwiderruflich entfernen',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => onDelete(userId, userEmail),
      variant: 'danger',
    },
  ];

  const visibleActions = actions.filter(a => !a.hidden);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          className="fixed w-72 bg-white rounded-xl border border-gray-200 shadow-xl z-[9999] py-1 overflow-hidden"
          style={{ top: position.top, left: position.left }}
        >
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 truncate">{userEmail}</p>
          </div>
          <div className="py-1 max-h-80 overflow-y-auto">
            {visibleActions.map((action, i) => (
              <button
                key={i}
                onClick={() => {
                  setOpen(false);
                  action.onClick();
                }}
                className={`w-full text-left px-3 py-2.5 flex items-start gap-3 transition-colors ${
                  action.variant === 'danger'
                    ? 'hover:bg-red-50 text-red-600'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className={`mt-0.5 flex-shrink-0 ${
                  action.variant === 'danger' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {action.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{action.label}</p>
                  <p className={`text-xs mt-0.5 leading-tight ${
                    action.variant === 'danger' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {action.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
