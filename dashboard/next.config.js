/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['basescan.org'],
  },
  env: {
    NEXT_PUBLIC_CONTRACT_ADDRESS: '0x9855B75061D4c841791382998f0CE8B2BCC965A4',
    NEXT_PUBLIC_BASE_RPC: 'https://mainnet.base.org',
    NEXT_PUBLIC_BASESCAN_URL: 'https://basescan.org',
  },
};

module.exports = nextConfig;
