const nav=document.getElementById('nav'),menuButton=document.getElementById('menuBtn'),mobileNav=document.getElementById('mobileNav');
addEventListener('scroll',()=>nav.classList.toggle('fixed',scrollY>40));
menuButton.addEventListener('click',()=>{const open=mobileNav.classList.toggle('open');document.body.classList.toggle('lock',open);menuButton.setAttribute('aria-expanded',String(open))});
const esc=(value='')=>{const node=document.createElement('span');node.textContent=String(value);return node.innerHTML};
const image=(post)=>[...(post.imagenes||[])].sort((a,b)=>a.posicion-b.posicion)[0];
function render(posts=[]){
  postCount.textContent=String(posts.length).padStart(2,'0');
  postsFeed.innerHTML=posts.length?posts.map(post=>{const media=image(post),date=post.publicado_en?new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(post.publicado_en)).toUpperCase():'';return `<article class="studio-post"><header><div class="post-avatar">SB</div><div><b>SKYBLOCK STUDIO</b><span>${esc(date)}</span></div><i>•••</i></header><div class="post-copy"><h2>${esc(post.titulo)}</h2><p>${esc(post.descripcion)}</p></div>${media?`<img src="${esc(media.url_segura)}" alt="${esc(media.texto_alternativo||post.titulo)}">`:''}<footer><button aria-label="Me gusta">♡ <span>Me gusta</span></button><button aria-label="Compartir">↗ <span>Compartir</span></button></footer></article>`}).join(''):'<div class="posts-empty"><h2>Aún no hay publicaciones.</h2><p>Las historias aparecerán aquí cuando se publiquen desde el panel.</p></div>';
}
render([]);
addEventListener('message',event=>{if(event.origin!==location.origin||event.data?.tipo!=='SKYBLOCK_DATOS_PUBLICOS')return;render(event.data.datos?.publicaciones||[])});
parent.postMessage({tipo:'SKYBLOCK_SOLICITAR_DATOS'},location.origin);
