/** @type {import('next').NextConfig} */
const nextConfig = {
    //Eg. for If u want to use external image src in Image tag of nextjs
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
                port: ''
            }
        ]
    }
};

export default nextConfig;
