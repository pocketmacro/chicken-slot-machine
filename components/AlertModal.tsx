"use client";

interface AlertModalProps {
  title: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
  type?: "success" | "error" | "info";
}

export default function AlertModal({
  title,
  message,
  buttonText = "OK",
  onClose,
  type = "info",
}: AlertModalProps) {
  const typeConfig = {
    success: {
      icon: "🎉",
      buttonClass: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
    },
    error: {
      icon: "⚠️",
      buttonClass: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
    },
    info: {
      icon: "ℹ️",
      buttonClass: "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600",
    },
  };

  const config = typeConfig[type];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl max-w-md w-full relative border border-white/20">
        <div className="p-8 text-center">
          <div className="text-6xl mb-4">{config.icon}</div>
          <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>
          <p className="text-white/90 text-lg mb-8">{message}</p>

          <button
            onClick={onClose}
            className={`w-full px-6 py-3 ${config.buttonClass} text-white rounded-lg font-medium transition-all transform hover:scale-105`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
