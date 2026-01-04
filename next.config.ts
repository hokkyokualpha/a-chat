import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker/Cloud Run用の最適化
  output: "standalone",

  // セキュリティ設定
  poweredByHeader: false, // X-Powered-Byヘッダーを削除

  // パフォーマンス最適化
  compress: true, // gzip圧縮を有効化
  generateEtags: true, // ETags生成を有効化

  // React設定
  reactStrictMode: true, // React Strict Modeを有効化
};

export default nextConfig;
