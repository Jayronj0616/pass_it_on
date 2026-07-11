import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Needed for next/image to render any Supabase Storage URL — item
    // photos (public bucket, full public URLs) and now chat images
    // (private bucket, signed URLs, but same host/path shape). This was
    // missing before the messages feature too; item-photos was likely
    // hitting the same wall already.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hsbapldnyiwjfdywdhlj.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
};

export default nextConfig;
