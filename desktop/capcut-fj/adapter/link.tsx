import React from 'react';
import {useRouter} from './navigation';
export default function Link({href,children,prefetch,replace,scroll,...props}:any){const router=useRouter();return <a {...props} href={href.startsWith('/')?'#'+(href==='/'?'/projects':href):href} onClick={e=>{props.onClick?.(e);if(!e.defaultPrevented&&href.startsWith('/')){e.preventDefault();router.push(href);}}}>{children}</a>}
