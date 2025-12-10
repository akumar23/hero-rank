import { env } from "./src/env/server.mjs";

/**
 * Don't be scared of the generics here.
 * All they do is to give us autocompletion when using this.
 *
 * @template {import('next').NextConfig} T
 * @param {T} config - A generic parameter that flows through to the return type
 * @constraint {{import('next').NextConfig}}
 */
function defineNextConfig(config) {
  return config;
}

export default defineNextConfig({
  reactStrictMode: true,
  swcMinify: true,
  images: {
    // Allow images from the local API proxy route
    // Note: localhost is automatically allowed for local development
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.superherodb.com',
        pathname: '/pictures2/portraits/**',
      },
    ],
    // For API route images, we use unoptimized mode since they're proxied
    unoptimized: false,
  },
});