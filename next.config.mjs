/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // Server Actions (e.g. the sign-in form) check the request's Origin
    // against an allowlist as CSRF protection. Behind Railway's proxy the
    // public domain isn't auto-detected the way it is on Vercel, so
    // without this every Server Action gets silently rejected. Update this
    // if a custom domain is ever added.
    serverActions: {
      allowedOrigins: [
        "open-doors-web-production.up.railway.app",
        "opendoorschurchfinder.com",
        "www.opendoorschurchfinder.com",
        "httpsopendoorschurchfinder.com",
      ],
    },
  },
}

export default nextConfig
