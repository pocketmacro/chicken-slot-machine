"use client";

import { useState, useEffect } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { fetchAuthSession } from "aws-amplify/auth";
import { uploadData, getUrl } from "aws-amplify/storage";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ConfirmModal from "@/components/ConfirmModal";
import AlertModal from "@/components/AlertModal";

const client = generateClient<Schema>();

interface Prize {
  id: string;
  name: string;
  description?: string;
  redirectUrls: string[];
  imageUrl?: string;
  color: string;
  weight: number;
  quantity: number;
  isActive: boolean;
}

interface UserSpin {
  id: string;
  userId: string;
  lastSpinTime: string;
  prizesWon?: string[];
  owner?: string;
}

type ModalState = {
  type: "confirm" | "alert" | null;
  title: string;
  message: string;
  onConfirm?: () => void;
  alertType?: "success" | "error" | "info";
  confirmColor?: "green" | "red" | "yellow";
};

export default function AdminPage() {
  const router = useRouter();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [userSpins, setUserSpins] = useState<UserSpin[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    redirectUrls: [""],
    imageUrl: "",
    color: "#3B82F6",
    weight: 10,
    quantity: 1,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [modal, setModal] = useState<ModalState>({
    type: null,
    title: "",
    message: "",
  });

  const checkAdminAccess = async () => {
    try {
      const session = await fetchAuthSession();
      const groups = session.tokens?.accessToken?.payload["cognito:groups"] as string[] | undefined;
      const hasAdminAccess = groups?.includes("admins") || false;
      setIsAdmin(hasAdminAccess);

      if (!hasAdminAccess) {
        router.push("/");
      }
    } catch (error) {
      console.error("Error checking admin access:", error);
      setIsAdmin(false);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadPrizes();
      loadUserSpins();
    }
  }, [isAdmin]);

  const loadPrizes = async () => {
    try {
      const { data } = await client.models.Prize.list();
      setPrizes(
        data.map((p) => ({
          id: p.id,
          name: p.name || "",
          description: p.description || "",
          redirectUrls: p.redirectUrls || [],
          imageUrl: p.imageUrl || "",
          color: p.color || "",
          weight: p.weight ?? 10,
          quantity: p.quantity ?? 1,
          isActive: p.isActive ?? true,
        }))
      );
    } catch (error) {
      console.error("Error loading prizes:", error);
    }
  };

  const loadUserSpins = async () => {
    try {
      const { data } = await client.models.UserSpin.list();
      setUserSpins(
        data
          .filter((u) => u && u.id && u.lastSpinTime) // Filter out null/invalid entries
          .map((u) => ({
            id: u.id,
            userId: u.userId || "",
            lastSpinTime: u.lastSpinTime || "",
            prizesWon: u.prizesWon || [],
            owner: u.owner || "",
          }))
      );
    } catch (error) {
      console.error("Error loading user spins:", error);
    }
  };

  const resetUserSpin = async (userSpinId: string) => {
    setModal({
      type: "confirm",
      title: "Reset Spin Timer",
      message: "Are you sure you want to reset this user's spin timer?",
      confirmColor: "yellow",
      onConfirm: async () => {
        setModal({ type: null, title: "", message: "" });
        try {
          const threeHoursAgo = new Date();
          threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);
          const resetTime = threeHoursAgo.toISOString();

          await client.models.UserSpin.update({
            id: userSpinId,
            lastSpinTime: resetTime,
          });

          loadUserSpins();
          setModal({
            type: "alert",
            title: "Success!",
            message: "User spin timer reset successfully! They can now spin again.",
            alertType: "success",
          });
        } catch (error) {
          console.error("Error resetting user spin:", error);
          setModal({
            type: "alert",
            title: "Error",
            message: "Failed to reset user spin timer.",
            alertType: "error",
          });
        }
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate: number of URLs should match quantity
    const validUrls = formData.redirectUrls.filter(url => url.trim() !== "");
    if (validUrls.length !== formData.quantity) {
      setModal({
        type: "alert",
        title: "Invalid URLs",
        message: `You must provide exactly ${formData.quantity} URL(s) to match the quantity.`,
        alertType: "error",
      });
      return;
    }

    try {
      let imageUrl = "";

      // Upload image to S3 if provided
      if (imageFile) {
        const fileName = `prize-images/${Date.now()}-${imageFile.name}`;
        const result = await uploadData({
          path: fileName,
          data: imageFile,
          options: {
            contentType: imageFile.type
          }
        }).result;

        // Get the URL for the uploaded image
        const urlResult = await getUrl({
          path: fileName
        });
        imageUrl = urlResult.url.toString();
      }

      await client.models.Prize.create({
        name: formData.name,
        description: formData.description,
        redirectUrls: validUrls,
        imageUrl: imageUrl || undefined,
        color: formData.color,
        weight: formData.weight,
        quantity: formData.quantity,
        isActive: true,
      });

      setFormData({
        name: "",
        description: "",
        redirectUrls: [""],
        imageUrl: "",
        color: "#3B82F6",
        weight: 10,
        quantity: 1,
      });
      setImageFile(null);
      setImagePreview("");
      setShowForm(false);
      loadPrizes();
    } catch (error) {
      console.error("Error creating prize:", error);
      setModal({
        type: "alert",
        title: "Error",
        message: "Failed to create prize. Please try again.",
        alertType: "error",
      });
    }
  };

  const togglePrize = async (prize: Prize) => {
    try {
      await client.models.Prize.update({
        id: prize.id,
        isActive: !prize.isActive,
      });
      loadPrizes();
    } catch (error) {
      console.error("Error toggling prize:", error);
    }
  };

  const deletePrize = async (id: string) => {
    setModal({
      type: "confirm",
      title: "Delete Prize",
      message: "Are you sure you want to delete this prize? This action cannot be undone.",
      confirmColor: "red",
      onConfirm: async () => {
        setModal({ type: null, title: "", message: "" });
        try {
          await client.models.Prize.delete({ id });
          loadPrizes();
          setModal({
            type: "alert",
            title: "Deleted!",
            message: "Prize has been deleted successfully.",
            alertType: "success",
          });
        } catch (error) {
          console.error("Error deleting prize:", error);
          setModal({
            type: "alert",
            title: "Error",
            message: "Failed to delete prize.",
            alertType: "error",
          });
        }
      },
    });
  };

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="min-h-screen" style={{ background: '#17759B' }}>
          <nav className="bg-black/20 shadow-lg border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-6">
                    <Image
                      src="/pocket-macro-logo.png"
                      alt="Pocket Macro"
                      width={110}
                      height={110}
                      className="object-contain"
                    />
                    <h1 className="text-5xl font-bold text-white">
                      Admin Panel
                    </h1>
                  </div>
                  <Link
                    href="/"
                    className="text-sm text-white/90 hover:text-white"
                  >
                    Back to Wheel
                  </Link>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-white/90">
                    {user?.signInDetails?.loginId}
                  </span>
                  <button
                    onClick={signOut}
                    className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </nav>

          {loading || !isAdmin ? (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            </main>
          ) : (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-8 flex justify-between items-center">
              <h2 className="text-3xl font-bold text-white">Manage Prizes</h2>
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg font-medium transition-all transform hover:scale-105"
              >
                {showForm ? "Cancel" : "Add New Prize"}
              </button>
            </div>

            {showForm && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg p-6 mb-8 border border-white/20">
                <h3 className="text-xl font-semibold mb-4 text-white">Add New Prize</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-1">
                      Prize Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white/90 border border-white/30 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="e.g., Free Coffee"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white/90 border border-white/30 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      rows={3}
                      placeholder="Optional description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-1">
                      Prize Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImageFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setImagePreview(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full px-4 py-2 bg-white/90 border border-white/30 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-yellow-500 file:text-white file:cursor-pointer hover:file:bg-yellow-600"
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-lg border-2 border-white/30"
                        />
                      </div>
                    )}
                    <p className="text-xs text-white/70 mt-1">
                      Upload an image for this prize (optional, recommended 400x400px)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-1">
                        Weight (1-100)
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="100"
                        value={formData.weight}
                        onChange={(e) =>
                          setFormData({ ...formData, weight: parseInt(e.target.value) || 10 })
                        }
                        className="w-full px-4 py-2 bg-white/90 border border-white/30 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="10"
                      />
                      <p className="text-xs text-white/70 mt-1">
                        Higher = more common (1=rare, 100=very common)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-1">
                        Quantity Available
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => {
                          const newQty = parseInt(e.target.value) || 1;
                          setFormData({
                            ...formData,
                            quantity: newQty,
                            redirectUrls: Array(newQty).fill("").map((_, i) => formData.redirectUrls[i] || "")
                          });
                        }}
                        className="w-full px-4 py-2 bg-white/90 border border-white/30 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="1"
                      />
                      <p className="text-xs text-white/70 mt-1">
                        How many can be won
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Redirect URLs (one per quantity)
                    </label>
                    <div className="space-y-2">
                      {formData.redirectUrls.map((url, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-white/80 text-sm font-medium min-w-[60px]">
                            URL #{index + 1}:
                          </span>
                          <input
                            type="url"
                            required
                            value={url}
                            onChange={(e) => {
                              const newUrls = [...formData.redirectUrls];
                              newUrls[index] = e.target.value;
                              setFormData({ ...formData, redirectUrls: newUrls });
                            }}
                            className="flex-1 px-4 py-2 bg-white/90 border border-white/30 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                            placeholder="https://example.com/prize"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-white/70 mt-2">
                      Each prize needs its own unique URL. Add {formData.quantity} URL(s) total.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-1">
                      Color
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) =>
                          setFormData({ ...formData, color: e.target.value })
                        }
                        className="h-10 w-20 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) =>
                          setFormData({ ...formData, color: e.target.value })
                        }
                        className="flex-1 px-4 py-2 bg-white/90 border border-white/30 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all transform hover:scale-105"
                  >
                    Create Prize
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border border-white/20">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-black/20">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                      Prize
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                      Redirect URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                      Weight
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {prizes.map((prize) => (
                    <tr key={prize.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {prize.name}
                        </div>
                        {prize.description && (
                          <div className="text-sm text-white/70">
                            {prize.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-white/80">
                        <div className="space-y-1">
                          {prize.redirectUrls.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-yellow-300 hover:text-yellow-200 truncate block max-w-xs"
                            >
                              {idx + 1}. {url}
                            </a>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                        <span className="font-medium">{prize.weight}</span>
                        <span className="text-xs text-white/60 block">
                          {prize.weight <= 5 ? "Very Rare" : prize.weight <= 20 ? "Rare" : prize.weight <= 50 ? "Uncommon" : "Common"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                        <span className="font-medium">{prize.quantity}</span>
                        <span className="text-xs text-white/60 block">available</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            prize.isActive
                              ? "bg-green-500/30 text-green-200"
                              : "bg-gray-500/30 text-gray-200"
                          }`}
                        >
                          {prize.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => togglePrize(prize)}
                          className="text-yellow-300 hover:text-yellow-200"
                        >
                          {prize.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => deletePrize(prize.id)}
                          className="text-red-300 hover:text-red-200"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {prizes.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-white/80">
                    No prizes yet. Add your first prize to get started!
                  </p>
                </div>
              )}
            </div>

            <div className="mt-12">
              <h2 className="text-3xl font-bold text-white mb-8">User Management</h2>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border border-white/20">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-black/20">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                        User ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                        Last Spin Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                        Prizes Won
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                        Can Spin Now?
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {userSpins.map((userSpin) => {
                      const lastSpinTime = new Date(userSpin.lastSpinTime);
                      const now = new Date();
                      const hoursSinceLastSpin = (now.getTime() - lastSpinTime.getTime()) / (1000 * 60 * 60);
                      const canSpinNow = hoursSinceLastSpin >= 2;

                      return (
                        <tr key={userSpin.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">
                              {userSpin.userId}
                            </div>
                            {userSpin.owner && (
                              <div className="text-xs text-white/70">
                                {userSpin.owner}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                            <div>{new Date(userSpin.lastSpinTime).toLocaleDateString()}</div>
                            <div className="text-xs text-white/60">
                              {new Date(userSpin.lastSpinTime).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                            {userSpin.prizesWon?.length || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                canSpinNow
                                  ? "bg-green-500/30 text-green-200"
                                  : "bg-red-500/30 text-red-200"
                              }`}
                            >
                              {canSpinNow ? "Yes" : "No"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => resetUserSpin(userSpin.id)}
                              className="text-yellow-300 hover:text-yellow-200 disabled:text-white/40 disabled:cursor-not-allowed"
                              disabled={canSpinNow}
                            >
                              {canSpinNow ? "Already Can Spin" : "Reset Timer"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {userSpins.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-white/80">
                      No users have spun yet!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </main>
          )}

          {modal.type === "confirm" && modal.onConfirm && (
            <ConfirmModal
              title={modal.title}
              message={modal.message}
              confirmColor={modal.confirmColor}
              onConfirm={modal.onConfirm}
              onCancel={() => setModal({ type: null, title: "", message: "" })}
            />
          )}

          {modal.type === "alert" && (
            <AlertModal
              title={modal.title}
              message={modal.message}
              type={modal.alertType}
              onClose={() => setModal({ type: null, title: "", message: "" })}
            />
          )}
        </div>
      )}
    </Authenticator>
  );
}
