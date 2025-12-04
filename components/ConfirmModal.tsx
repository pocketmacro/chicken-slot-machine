"use client";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmColor?: "green" | "red" | "yellow";
}

export default function ConfirmModal({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  confirmColor = "green",
}: ConfirmModalProps) {
  const colorClasses = {
    green: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
    red: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
    yellow: "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600",
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl max-w-md w-full relative border border-white/20">
        <div className="p-8">
          <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>
          <p className="text-white/90 text-lg mb-8">{message}</p>

          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all border border-white/20"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-6 py-3 ${colorClasses[confirmColor]} text-white rounded-lg font-medium transition-all transform hover:scale-105`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
