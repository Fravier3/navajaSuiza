import React,{useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {ThemeProvider} from 'next-themes';
import {TooltipProvider} from '../upstream-src/components/ui/tooltip';
import {Toaster} from '../upstream-src/components/ui/sonner';
import Projects from '../upstream-src/app/projects/page';
import Editor from '../upstream-src/app/editor/[project_id]/page';
import {usePathname} from './navigation';
import './style.css';
function App(){const route=usePathname();useEffect(()=>{parent.postMessage({type:'capcut-fj:ready'},location.origin)},[]);return <ThemeProvider attribute="class" defaultTheme="dark"><TooltipProvider><Toaster/>{route.startsWith('/editor/')?<Editor key={route}/>:<Projects/>}</TooltipProvider></ThemeProvider>}
window.addEventListener('error',e=>parent.postMessage({type:'capcut-fj:failed',error:e.message},location.origin));
createRoot(document.getElementById('root')!).render(<App/>);
