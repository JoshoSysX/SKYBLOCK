const nav=document.getElementById('nav'),menuButton=document.getElementById('menuBtn'),mobileNav=document.getElementById('mobileNav');
const postsFeed=document.getElementById('postsFeed'),postCount=document.getElementById('postCount');
const profileName=document.getElementById('postsProfileName'),profileBio=document.getElementById('postsProfileBio'),profileAvatar=document.getElementById('postsProfileAvatar'),profileCover=document.getElementById('postsProfileCover');
const defaultProfile={nombre:'SKYBLOCK STUDIO',biografia:'',ubicacion:'',intereses:''};

addEventListener('scroll',()=>nav.classList.toggle('fixed',scrollY>40));
menuButton.addEventListener('click',()=>{const open=mobileNav.classList.toggle('open');document.body.classList.toggle('lock',open);menuButton.setAttribute('aria-expanded',String(open))});
const esc=(value='')=>{const node=document.createElement('span');node.textContent=String(value);return node.innerHTML};
const images=(post)=>[...(post.imagenes||[])].sort((a,b)=>Number(a.posicion||0)-Number(b.posicion||0));
const likedKey=(id)=>`skyblock-post-liked-${id}`;
const isLiked=(id)=>localStorage.getItem(likedKey(id))==='1';
const publicPostsUrl=()=>`${location.origin}/posts`;
async function copyLink(url){
  if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(url);return true}catch{}}
  const field=document.createElement('textarea');field.value=url;field.setAttribute('readonly','');field.style.cssText='position:fixed;opacity:0;pointer-events:none';document.body.append(field);field.select();const copied=document.execCommand('copy');field.remove();return copied;
}

function applyProfile(raw={}) {
  const profile={...defaultProfile,...raw};
  profileName.textContent=profile.nombre;
  profileBio.textContent=profile.biografia;
  if(profile.avatar_url){profileAvatar.style.backgroundImage=`url("${String(profile.avatar_url).replace(/"/g,'%22')}")`;profileAvatar.textContent='';profileAvatar.classList.add('has-image')}else{profileAvatar.style.backgroundImage='';profileAvatar.textContent='SB';profileAvatar.classList.remove('has-image')}
  if(profile.portada_url){profileCover.style.backgroundImage=`linear-gradient(90deg,rgba(8,9,10,.38),rgba(8,9,10,.08)),url("${String(profile.portada_url).replace(/"/g,'%22')}")`;profileCover.classList.add('has-image')}else{profileCover.style.backgroundImage='';profileCover.classList.remove('has-image')}
}

function render(posts=[],profile={}){
  applyProfile(profile);
  postCount.textContent=String(posts.length).padStart(2,'0');
  postsFeed.innerHTML=posts.length?posts.map(post=>{
    const media=images(post),date=post.publicado_en?new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(post.publicado_en)).toUpperCase():'';
    const liked=isLiked(post.id);
    const carousel=media.length?`<div class="post-carousel" data-carousel><div class="post-carousel-track">${media.map((item)=>`<img src="${esc(item.url_segura)}" alt="${esc(item.texto_alternativo||post.titulo)}" loading="lazy" decoding="async">`).join('')}</div>${media.length>1?`<button class="post-carousel-arrow previous" type="button" data-carousel-previous aria-label="Foto anterior">←</button><button class="post-carousel-arrow next" type="button" data-carousel-next aria-label="Siguiente foto">→</button><div class="post-carousel-count">1 / ${media.length}</div>`:''}</div>`:'';
    return `<article class="studio-post" data-post-id="${esc(post.id)}"><header><div class="post-avatar${profile.avatar_url?' has-image':''}"${profile.avatar_url?` style="background-image:url('${esc(profile.avatar_url)}')"`:''}>SB</div><div><b>${esc(profile.nombre||defaultProfile.nombre)}</b><span>${esc(date)}</span></div></header><div class="post-copy"><h2>${esc(post.titulo)}</h2>${post.descripcion||post.contenido?`<p>${esc(post.descripcion||post.contenido)}</p>`:''}</div>${carousel}<footer><button type="button" class="post-action${liked?' liked':''}" data-like-post="${esc(post.id)}" aria-pressed="${liked}"><span aria-hidden="true">${liked?'♥':'♡'}</span> <em>${liked?'Te gusta':'Me gusta'}</em></button><button type="button" class="post-action" data-share-post="${esc(post.id)}"><span aria-hidden="true">↗</span><em>Compartir</em></button></footer></article>`
  }).join(''):'<div class="posts-empty"><h2>Aún no hay publicaciones.</h2><p>Las historias aparecerán aquí cuando se publiquen desde el panel.</p></div>';
}

postsFeed.addEventListener('click',async(event)=>{
  const carouselButton=event.target.closest('[data-carousel-next],[data-carousel-previous]');
  if(carouselButton){const track=carouselButton.closest('[data-carousel]').querySelector('.post-carousel-track');const direction=carouselButton.hasAttribute('data-carousel-next')?1:-1;track.scrollBy({left:direction*track.clientWidth,behavior:'smooth'});return}
  const like=event.target.closest('[data-like-post]');
  if(like){const id=like.dataset.likePost;const liked=!isLiked(id);liked?localStorage.setItem(likedKey(id),'1'):localStorage.removeItem(likedKey(id));like.classList.toggle('liked',liked);like.setAttribute('aria-pressed',String(liked));like.querySelector('span').textContent=liked?'♥':'♡';like.querySelector('em').textContent=liked?'Te gusta':'Me gusta';return}
  const share=event.target.closest('[data-share-post]');
  if(!share)return;
  const post=share.closest('.studio-post');const title=post?.querySelector('h2')?.textContent||'SKYBLOCK STUDIO';const text=post?.querySelector('.post-copy p')?.textContent||'';const url=publicPostsUrl();const label=share.querySelector('em');
  try{if(navigator.share){await navigator.share({title,text,url});label.textContent='Compartido'}else if(await copyLink(url)){label.textContent='Enlace copiado'}else throw new Error('copy-failed')}catch(error){if(error?.name==='AbortError'){label.textContent='Compartir';return}label.textContent=await copyLink(url)?'Enlace copiado':'No se pudo compartir'}finally{setTimeout(()=>{label.textContent='Compartir'},2200)}
});
postsFeed.addEventListener('scroll',(event)=>{const track=event.target.closest?.('.post-carousel-track');if(!track)return;const count=track.closest('[data-carousel]').querySelector('.post-carousel-count');if(count)count.textContent=`${Math.round(track.scrollLeft/track.clientWidth)+1} / ${track.children.length}`},true);

render([],defaultProfile);
addEventListener('message',event=>{if(event.origin!==location.origin||event.data?.tipo!=='SKYBLOCK_DATOS_PUBLICOS')return;render(event.data.datos?.publicaciones||[],event.data.datos?.perfil||defaultProfile)});
parent.postMessage({tipo:'SKYBLOCK_SOLICITAR_DATOS'},location.origin);
