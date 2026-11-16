import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const apiTarget = env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8000";

    return {
        plugins: [tailwindcss()],
        server: {
            host: "0.0.0.0",
            proxy: {
                "/api": apiTarget,
                "/storage": apiTarget,
            },
        },
    };
});
