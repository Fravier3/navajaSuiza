import {useSyncExternalStore} from 'react';
const subscribe=(cb:()=>void)=>{window.addEventListener('hashchange',cb);return()=>window.removeEventListener('hashchange',cb)};
export const getRoute=()=>location.hash.slice(1)||'/projects';
const navigate=(url:string)=>{location.hash=url==='/'?'/projects':url};
const router={push:navigate,replace:navigate,back:()=>history.back(),refresh:()=>location.reload(),prefetch:()=>{}};
export const useRouter=()=>router;
export const usePathname=()=>useSyncExternalStore(subscribe,getRoute);
export const useParams=()=>({project_id:usePathname().split('/')[2]});
export const useSearchParams=()=>new URLSearchParams();
