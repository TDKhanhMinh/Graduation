"use client"

import { motion } from "framer-motion"
import { Heart, Image as ImageIcon, MessageSquareHeart, QrCode, Sparkles } from "lucide-react"

export function AuthVisualShowcase() {
  return (
    <div className="relative hidden h-full w-full flex-col items-center justify-center overflow-hidden rounded-3xl bg-primary/5 p-8 lg:flex">
      {/* Dynamic Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-primary/20 blur-[100px]" />
      <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-secondary/20 blur-[100px]" />

      {/* Floating Elements Showcase */}
      <div className="relative z-10 w-full max-w-sm">
        {/* Main Poster Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-20 aspect-[3/4] w-full overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-white/40 to-white/10 p-4 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex h-full flex-col justify-between rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-600/40 p-4 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                Đám cưới
              </div>
              <Sparkles className="size-4 text-white" />
            </div>
            
            <div className="mt-auto space-y-2 text-white">
              <h3 className="font-heading text-2xl font-bold leading-tight">Linh & Quân</h3>
              <p className="text-xs text-white/80">Quét mã QR để gửi lời chúc!</p>
            </div>
          </div>
        </motion.div>

        {/* Floating QR Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: 20, y: -20 }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="absolute -right-8 top-12 z-30 flex size-20 items-center justify-center rounded-2xl border border-white/40 bg-white/60 shadow-xl backdrop-blur-md"
          whileHover={{ scale: 1.05, rotate: 5 }}
        >
          <QrCode className="size-10 text-primary" />
        </motion.div>

        {/* Floating Wish Card 1 */}
        <motion.div
          initial={{ opacity: 0, x: -30, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="absolute -left-12 bottom-24 z-30 flex items-center gap-3 rounded-2xl border border-white/40 bg-white/80 p-3 shadow-xl backdrop-blur-md"
          whileHover={{ scale: 1.05, x: -5 }}
        >
          <div className="flex size-8 items-center justify-center rounded-full bg-memory-pink/20 text-memory-pink">
            <Heart className="size-4" />
          </div>
          <div className="space-y-1">
            <div className="h-1.5 w-12 rounded-full bg-muted/60" />
            <div className="h-1.5 w-20 rounded-full bg-muted/40" />
          </div>
        </motion.div>

        {/* Floating Media Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="absolute -bottom-10 right-4 z-10 flex items-center gap-3 rounded-2xl border border-white/40 bg-white/70 p-3 shadow-lg backdrop-blur-md"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <ImageIcon className="size-5" />
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-status-info/20 text-status-info">
            <MessageSquareHeart className="size-5" />
          </div>
        </motion.div>
      </div>

      {/* Typography */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="relative z-20 mt-16 text-center"
      >
        <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Lưu giữ từng khoảnh khắc
        </h2>
        <p className="mt-3 max-w-sm text-sm text-muted-foreground">
          Tạo không gian tương tác trực tiếp cho sự kiện của bạn. Thu thập lời chúc và hình ảnh thật dễ dàng.
        </p>
      </motion.div>
    </div>
  )
}
