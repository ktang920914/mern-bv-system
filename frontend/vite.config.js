import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import flowbiteReact from "flowbite-react/plugin/vite";
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  server:{
    host:'0.0.0.0',
    port:5173,
    https:{
      key: fs.readFileSync('C:/Users/jayan/Desktop/Bv System/server.key'),   // mkcert 私钥
      cert: fs.readFileSync('C:/Users/jayan/Desktop/Bv System/server.crt'),  // mkcert 证书
    },
    proxy:{
      '/api':{
        target:'https://localhost:3000',
        secure:false
      },
    },
  },
  plugins: [tailwindcss(), react(), flowbiteReact()],
})