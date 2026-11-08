import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/postcss';
import path from 'node:path';
const here=import.meta.dirname;
export default defineConfig({base:'./',plugins:[react()],resolve:{alias:{'@/feedback/components/feedback-popover':path.join(here,'adapter/feedback.tsx'),'@':path.join(here,'upstream-src'),'next/navigation':path.join(here,'adapter/navigation.tsx'),'next/link':path.join(here,'adapter/link.tsx'),'next/image':path.join(here,'adapter/image.tsx'),'content-collections':path.join(here,'adapter/content.ts')}},define:{'process.env.NODE_ENV':JSON.stringify('production')},css:{postcss:{plugins:[tailwind()]}},build:{outDir:'../public/tools/capcut-fj',emptyOutDir:true,target:'esnext',sourcemap:false}});
