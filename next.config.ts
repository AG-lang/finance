import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 性能优化配置
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'lucide-react',
      'recharts',
      'date-fns'
    ],
  },
  
  // 图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // 生产环境优化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // 启用模块化导入
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
  },
};

export default nextConfig;
