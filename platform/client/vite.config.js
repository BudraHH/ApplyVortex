import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        host: true,      // Needed for Docker mapping
        strictPort: true,
        port: 3000,
        watch: {
            usePolling: true, // <--- CRITICAL: fixes "changes not detected" in Docker
        }
    },
})
