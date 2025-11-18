"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gift, Users, Sparkles, Copy, Check, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ReferralSection() {
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleCopyCode = () => {
    // This would normally copy the user's referral code
    // For now, it's a demo action
    navigator.clipboard.writeText("SHARE & EARN");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGetStarted = () => {
    // Check if user is already logged in
    if (status === "authenticated" && session) {
      // User is logged in, redirect to referral dashboard
      router.push("/tenants/referrals");
    } else {
      // User is not logged in, redirect to signin
      router.push("/signin");
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 dark:from-blue-700 dark:via-blue-600 dark:to-cyan-600 py-20 px-4 md:px-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-white"
          >
            <motion.div
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-semibold">Limited Time Offer</span>
            </motion.div>

            <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Share the Love,
              <br />
              <span className="text-cyan-300 dark:text-cyan-200">Earn Rewards!</span>
            </h2>

            <p className="text-lg md:text-xl mb-8 text-white/90">
              Invite your friends to Student24 and both get{" "}
              <span className="font-bold text-cyan-300 dark:text-cyan-200">R100 Uber Eats vouchers</span>{" "}
              when you both move in!
            </p>

            {/* Benefits */}
            <div className="space-y-4 mb-8">
              <motion.div
                className="flex items-start gap-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 mt-1">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    R100 for You, R100 for Them
                  </h3>
                  <p className="text-white/80">
                    Both you and your friend receive R100 Uber Eats vouchers when you both move in
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="flex items-start gap-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
              >
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 mt-1">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    Unlimited Referrals
                  </h3>
                  <p className="text-white/80">
                    No limit! Refer as many friends as you want and stack those
                    vouchers
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="flex items-start gap-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                viewport={{ once: true }}
              >
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 mt-1">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Easy to Share</h3>
                  <p className="text-white/80">
                    Get your unique referral code and share it on social media,
                    WhatsApp, or email
                  </p>
                </div>
              </motion.div>
            </div>

            <motion.button
              onClick={handleGetStarted}
              className="bg-white text-blue-600 font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Your Referral Code
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>

          {/* Right Visual Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <motion.div
              className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 shadow-2xl"
              whileHover={{ y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* Voucher Card */}
              <div className="mb-6">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-700 dark:to-cyan-700 rounded-2xl p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
                        REFERRAL VOUCHER
                      </span>
                      <Gift className="w-8 h-8" />
                    </div>

                    <div className="mb-2">
                      <span className="text-5xl font-bold">R100</span>
                      <span className="text-xl ml-2">OFF</span>
                    </div>

                    <p className="text-sm text-white/90 mb-4">
                      Uber Eats voucher when both move in
                    </p>

                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 font-mono text-lg tracking-wider">
                      SHARE & EARN
                    </div>
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <div className="space-y-4">
                <h3 className="text-gray-900 font-bold text-xl mb-4">
                  How It Works
                </h3>

                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div className="text-gray-700 dark:text-gray-200">
                    <p className="font-semibold">Sign up & get your code</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Create an account to receive your unique referral code
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div className="text-gray-700 dark:text-gray-200">
                    <p className="font-semibold">Share with friends</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Send your code to friends looking for accommodation
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div className="text-gray-700 dark:text-gray-200">
                    <p className="font-semibold">Earn vouchers</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Get R100 Uber Eats vouchers when you both move in!
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Counter */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      10K+
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Students Joined</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">R2M+</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Earned in Vouchers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                      25K+
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Referrals Made</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating Elements */}
            <motion.div
              className="absolute -top-6 -right-6 bg-cyan-400 text-gray-900 rounded-full px-6 py-3 font-bold shadow-xl"
              animate={{
                y: [0, -10, 0],
                rotate: [-5, 5, -5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              🎉 R100 OFF
            </motion.div>

            <motion.div
              className="absolute -bottom-6 -left-6 bg-blue-400 text-white rounded-full px-6 py-3 font-bold shadow-xl"
              animate={{
                y: [0, 10, 0],
                rotate: [5, -5, 5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.5,
              }}
            >
              💰 Easy Money
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
