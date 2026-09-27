const nav=document.getElementById('nav'),menuButton=document.getElementById('menuBtn'),mobileNav=document.getElementById('mobileNav');
const postsFeed=document.getElementById('postsFeed'),postCount=document.getElementById('postCount');
const profileName=document.getElementById('postsProfileName'),profileBio=document.getElementById('postsProfileBio'),profileLocation=document.getElementById('postsProfileLocation'),profileInterests=document.getElementById('postsProfileInterests'),profileAvatar=document.getElementById('postsProfileAvatar'),profileCover=document.getElementById('postsProfileCover');
const defaultProfile={nombre:'SKYBLOCK STUDIO',biografia:'Estudio creativo independiente. Construye. Crea. Domina.',ubicacion:'Tarapoto, Perú',intereses:'Cultura, ropa urbana y procesos creativos'};

addEventListener('scroll',()=>nav.classList.toggle('fixed',scrollY>40));
menuButton.addEventListener('click',()=>{const open=mobileNav.classList.toggle('open');document.body.classList.toggle('lock',open);menuButton.setAttribute('aria-expanded',String(open))});
const esc=(value='')=>{const node=document.createElement('span');node.textContent=String(value);return node.innerHTML};
const image=(post)=>[...(post.imagenes||[])].sort((a,b)=>Number(a.posicion||0)-Number(b.posicion||0))[0];
const likedKey=(id)=>`skyblock-post-liked-${id}`;
const isLiked=(id)=>localStorage.getItem(likedKey(id))==='1';

function applyProfile(raw={}) {
  const profile={...defaultProfile,...raw};
  profileName.textContent=profile.nombre;
  profileBio.textContent=profile.biografia;
  profileLocation.textContent=profile.ubicacion;
  profileInterests.textContent=profile.intereses;
  if(profile.avatar_url){profileAvatar.style.backgroundImage=`url("${String(profile.avatar_url).replace(/"/g,'%22')}")`;profileAvatar.classList.add('has-image')}else{profileAvatar.style.backgroundImage='';profileAvatar.classList.remove('has-image')}
  if(profile.portada_url){profileCover.style.backgroundImage=`linear-gradient(90deg,rgba(8,9,10,.38),rgba(8,9,10,.08)),url("${String(profile.portada_url).replace(/"/g,'%22')}")`;profileCover.classList.add('has-image')}else{profileCover.style.backgroundImage='';profileCover.classList.remove('has-image')}
}

function render(posts=[],profile={}){
  applyProfile(profile);
  postCount.textContent=String(posts.length).padStart(2,'0');
  postsFeed.innerHTML=posts.length?posts.map(post=>{
    const media=image(post),date=post.publicado_en?new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(post.publicado_en)).toUpperCase():'';
    const liked=isLiked(post.id);
    return `<article class="studio-post" data-post-id="${esc(post.id)}"><header><div class="post-avatar${profile.avatar_url?' has-image':''}"${profile.avatar_url?` style="background-image:url('${esc(profile.avatar_url)}')"`:''}>SB</div><div><b>${esc(profile.nombre||defaultProfile.nombre)}</b><span>${esc(date)}</span></div><i aria-hidden="true">•••</i></header><div class="post-copy"><h2>${esc(post.titulo)}</h2><p>${esc(post.descripcion||post.contenido||'')}</p></div>${media?`<img src="${esc(media.url_segura)}" alt="${esc(media.texto_alternativo||post.titulo)}" loading="lazy" decoding="async">`:''}<footer><button type="button" class="post-action${liked?' liked':''}" data-like-post="${esc(post.id)}" aria-pressed="${liked}"><span aria-hidden="true">${liked?'♥':'♡'}</span> <em>${liked?'Te gusta':'Me gusta'}</em></button><button type="button" class="post-action" data-share-post="${esc(post.id)}"><span aria-hidden="true">↗</span><em>Compartir</em></button></footer></article>`
  }).join(''):'<div class="posts-empty"><h2>Aún no hay publicaciones.</h2><p>Las historias aparecerán aquí cuando se publiquen desde el panel.</p></div>';
}

postsFeed.addEventListener('click',async(event)=>{
  const like=event.target.closest('[data-like-post]');
  if(like){const id=like.dataset.likePost;const liked=!isLiked(id);liked?localStorage.setItem(likedKey(id),'1'):localStorage.removeItem(likedKey(id));like.classList.toggle('liked',liked);like.setAttribute('aria-pressed',String(liked));like.querySelector('span').textContent=liked?'♥':'♡';like.querySelector('em').textContent=liked?'Te gusta':'Me gusta';return}
  const share=event.target.closest('[data-share-post]');
  if(!share)return;
  const post=share.closest('.studio-post');const title=post?.querySelector('h2')?.textContent||'SKYBLOCK STUDIO';const text=post?.querySelector('.post-copy p')?.textContent||'';
  try{if(navigator.share)await navigator.share({title,text,url:location.href});else{await navigator.clipboard.writeText(location.href);share.querySelector('em').textContent='Enlace copiado';setTimeout(()=>{share.querySelector('em').textContent='Compartir'},1800)}}catch(error){if(error?.name!=='AbortError')share.querySelector('em').textContent='No se pudo compartir'}
});

render([],defaultProfile);
addEventListener('message',event=>{if(event.origin!==location.origin||event.data?.tipo!=='SKYBLOCK_DATOS_PUBLICOS')return;render(event.data.datos?.publicaciones||[],event.data.datos?.perfil||defaultProfile)});
parent.postMessage({tipo:'SKYBLOCK_SOLICITAR_DATOS'},location.origin);
