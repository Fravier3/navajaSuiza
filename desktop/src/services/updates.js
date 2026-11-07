export function registerUpdates({base,toast,isWorking}) {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  let registration;
  let refreshing = false;
  const applyWaiting=()=>{
    if(registration.waiting&&!isWorking()){
      sessionStorage.setItem('navaja-update','1');registration.waiting.postMessage({type:'SKIP_WAITING'});
    }
  };
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(refreshing)return;
    if(isWorking()){toast('Hay una actualización. Guarda tu trabajo y vuelve a abrir Navaja Suiza para aplicarla.');return;}
    if(navigator.serviceWorker.controller && sessionStorage.getItem('navaja-update')==='1'){
      refreshing=true;sessionStorage.removeItem('navaja-update');location.reload();
    }
  });
  const check=async(manual=false)=>{
    try{
      if(!registration){
        registration=await navigator.serviceWorker.register(`${base}sw.js`,{scope:base});
        registration.addEventListener('updatefound',()=>{
          const installing=registration.installing;
          installing?.addEventListener('statechange',()=>{if(installing.state==='installed'&&navigator.serviceWorker.controller)applyWaiting();});
        });
      }
      await registration.update();
      if(registration.waiting){
        if(isWorking()){if(manual)toast('Guarda y cierra el editor antes de aplicar la actualización.');}
        else applyWaiting();
      }else if(manual)toast('Navaja Suiza está actualizada.');
    }catch{if(manual)toast('No pudimos comprobar actualizaciones. Revisa tu conexión.');}
  };
  window.addEventListener('load',()=>check());
  window.addEventListener('online',()=>check());
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
  document.querySelector('.check-updates').addEventListener('click',()=>check(true));
}
