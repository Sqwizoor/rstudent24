"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  Gift,
  Users,
  TrendingUp,
  Share2,
  Ticket,
  Mail,
  MessageCircle,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface Referral {
  id: number;
  referralCode: string;
  referred?: {
    name: string;
    email: string;
  };
  createdAt: string;
  completedAt?: string;
  isCompleted: boolean;
  voucherGenerated: boolean;
}

interface Voucher {
  id: number;
  code: string;
  discountAmount: number;
  discountPercent?: number;
  status: string;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
}

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalVouchers: number;
  activeVouchers: number;
}

export default function ReferralDashboard() {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string>("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    totalVouchers: 0,
    activeVouchers: 0,
  });
  const [activeTab, setActiveTab] = useState<"referrals" | "vouchers">(
    "referrals"
  );

  useEffect(() => {
    fetchReferralData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReferralData = async () => {
    try {
      const response = await fetch("/api/referrals");
      if (response.ok) {
        const data = await response.json();
        setReferralCode(data.referralCode || "");
        setReferrals(data.referrals || []);
        setVouchers(data.vouchers || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error("Error fetching referral data:", error);
      toast.error("Failed to load referral data");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast.success("Referral code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = (platform: "whatsapp" | "email") => {
    const shareUrl = `${window.location.origin}/signup?ref=${referralCode}`;
    const message = `Hey! Check out Student24 for amazing student accommodation. Use my referral code ${referralCode} when you sign up and we both get R500 vouchers! ${shareUrl}`;

    if (platform === "whatsapp") {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(message)}`,
        "_blank"
      );
    } else {
      window.location.href = `mailto:?subject=Join Student24 and Get R500 OFF&body=${encodeURIComponent(message)}`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Referral Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Share your code and earn rewards for every friend who joins!
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Referrals
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalReferrals}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Completed
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.completedReferrals}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Active Vouchers
                </p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.activeVouchers}
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                <Ticket className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Earned
                </p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  R{stats.completedReferrals * 500}
                </p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Referral Code Card */}
        <motion.div
          className="bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-700 dark:to-cyan-700 rounded-2xl p-8 mb-8 text-white shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Your Referral Code</h2>
              <p className="text-white/90 mb-4">
                Share this code with friends to earn R500 vouchers!
              </p>

              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 font-mono text-2xl tracking-wider flex-1">
                  {referralCode || "Loading..."}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="bg-white text-blue-600 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {copied ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <Copy className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleShare("whatsapp")}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Share on WhatsApp
              </button>
              <button
                onClick={() => handleShare("email")}
                className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors flex items-center gap-2"
              >
                <Mail className="w-5 h-5" />
                Share via Email
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("referrals")}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === "referrals"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="w-5 h-5" />
                Referrals ({stats.totalReferrals})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("vouchers")}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === "vouchers"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Ticket className="w-5 h-5" />
                Vouchers ({stats.totalVouchers})
              </div>
            </button>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === "referrals" ? (
                <motion.div
                  key="referrals"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  {referrals.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        No referrals yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Start sharing your code to earn rewards!
                      </p>
                    </div>
                  ) : (
                    referrals.map((referral) => (
                      <div
                        key={referral.id}
                        className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-3 rounded-lg ${
                              referral.isCompleted
                                ? "bg-green-100 dark:bg-green-900/30"
                                : "bg-yellow-100 dark:bg-yellow-900/30"
                            }`}
                          >
                            {referral.isCompleted ? (
                              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                            ) : (
                              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {referral.referred?.name || "Pending Signup"}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {referral.referred?.email || referral.referralCode}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                              referral.isCompleted
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                            }`}
                          >
                            {referral.isCompleted ? "Completed" : "Pending"}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatDate(referral.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="vouchers"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {vouchers.length === 0 ? (
                    <div className="text-center py-12">
                      <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        No vouchers yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Complete referrals to earn vouchers!
                      </p>
                    </div>
                  ) : (
                    vouchers.map((voucher) => (
                      <div
                        key={voucher.id}
                        className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                                <Gift className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                                  {voucher.code}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  R{voucher.discountAmount} OFF
                                  {voucher.discountPercent &&
                                    ` or ${voucher.discountPercent}%`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Expires: {formatDate(voucher.expiresAt)}
                              </div>
                              {voucher.usedAt && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  Used: {formatDate(voucher.usedAt)}
                                </div>
                              )}
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              voucher.status === "Active"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                : voucher.status === "Used"
                                ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400"
                                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                            }`}
                          >
                            {voucher.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
