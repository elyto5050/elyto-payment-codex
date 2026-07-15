import { X, AlertCircle, CheckCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info" | "default";

type Toast = { id: string; message: string; type: ToastType; duration?: number; actionLabel?: string };

export function ToastList({
  toasts,
  removeToast,
  actionMap,
}: {
  toasts: Array<Toast>;
  removeToast: (id: string) => void;
  actionMap?: Record<string, () => void>;
}) {
  if (!toasts?.length) return null;

  return (
    <div className="fixed right-4 top-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} actionMap={actionMap} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onRemove,
  actionMap,
}: {
  toast: Toast;
  onRemove: () => void;
  actionMap?: Record<string, () => void>;
}) {
  const getStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-emerald-500/90",
          icon: <CheckCircle className="h-4 w-4" />,
        };
      case "error":
        return {
          bg: "bg-red-500/90",
          icon: <AlertCircle className="h-4 w-4" />,
        };
      case "info":
        return {
          bg: "bg-blue-500/90",
          icon: <Info className="h-4 w-4" />,
        };
      default:
        return {
          bg: "bg-cyan-600/90",
          icon: <Info className="h-4 w-4" />,
        };
    }
  };

  const { bg, icon } = getStyles(toast.type);

  return (
    <div
      className={`${bg} text-white rounded-dense px-3.5 py-2.5 flex items-center gap-3 shadow-lg pointer-events-auto max-w-sm backdrop-blur-sm`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      {toast.actionLabel && actionMap?.[toast.id] ? (
        <div className="flex gap-2">
          <button
            onClick={() => {
              try {
                actionMap[toast.id]?.();
              } catch (e) {
                // swallow
              }
              onRemove();
            }}
            className="text-sm font-medium px-3 py-1 rounded-md bg-white/10 hover:bg-white/20"
          >
            {toast.actionLabel}
          </button>
          <button
            onClick={onRemove}
            className="text-white/70 hover:text-white transition-colors ml-2 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={onRemove}
          className="text-white/70 hover:text-white transition-colors ml-2 flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
