import { useToastStore } from "~/store/useToastStore";
import { MaterialIcon } from "./MaterialIcon";

const typeStyles = {
  success: {
    icon: "check_circle",
    className: "border-success/20 bg-surface-container-lowest text-onsurface",
    iconClass: "text-success",
  },
  error: {
    icon: "error",
    className: "border-error/20 bg-surface-container-lowest text-onsurface",
    iconClass: "text-error",
  },
  info: {
    icon: "info",
    className: "border-primary/20 bg-surface-container-lowest text-onsurface",
    iconClass: "text-primary",
  },
};

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div
      className="pointer-events-none fixed right-3 top-20 z-[90] flex w-[min(360px,calc(100vw-24px))] flex-col gap-2 md:right-5"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => {
        const style = typeStyles[toast.type] || typeStyles.info;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-3.5 py-3 shadow-lg backdrop-blur-sm toast-enter ${style.className}`}
            role={toast.type === "error" ? "alert" : "status"}
          >
            <MaterialIcon name={style.icon} size={20} className={`mt-0.5 shrink-0 ${style.iconClass}`} filled />
            <p className="min-w-0 flex-1 text-sm leading-5">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-onsurface-variant transition-colors hover:bg-surface-container hover:text-onsurface"
              aria-label="Dismiss notification"
            >
              <MaterialIcon name="close" size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
