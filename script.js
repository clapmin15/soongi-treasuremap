// 11주차 강의자료: querySelector -> addEventListener -> classList.toggle
import { firebaseConfig, ADMIN_UIDS } from './firebase-config.js';
// Load Firebase separately so navigation still works if the CDN is unavailable.
let initializeApp, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut;
let getDatabase, ref, onValue, push, set, update, remove;
const hamburger = document.querySelector('#hamburger');
const menu = document.querySelector('.menu');
hamburger.addEventListener('click', () => {
  menu.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', menu.classList.contains('open'));
});

const loginDialog = document.querySelector('#loginDialog');
const authOpen = document.querySelector('#authOpen');
const logoutBtn = document.querySelector('#logoutBtn');
const loginStatus = document.querySelector('#loginStatus');
authOpen.addEventListener('click', () => { menu.classList.remove('open'); hamburger.setAttribute('aria-expanded','false'); loginDialog.showModal(); });
document.querySelector('#loginClose').addEventListener('click', () => loginDialog.close());

const configured = Boolean(firebaseConfig.apiKey && firebaseConfig.databaseURL && firebaseConfig.projectId && firebaseConfig.appId );
let auth, database, isAdmin = false;
const region = document.body.dataset.region;
const adminTools = document.querySelector('#adminTools');
const dataStatus = document.querySelector('#dataStatus');
const placesList = document.querySelector('#placesList');
const placeCount = document.querySelector('#placeCount');
const placeForm = document.querySelector('#placeForm');
let entries = {}, editingId = null, previousPhoto = '', busy = false, previewVersion = 0;

function updateAdminUI(user) {
  isAdmin = Boolean(user && ADMIN_UIDS.includes(user.uid));
  authOpen.hidden = Boolean(user);
  logoutBtn.hidden = !user;
  if (adminTools) adminTools.hidden = !isAdmin;
  if (user && !isAdmin) loginStatus.textContent = '이 계정은 관리자 권한이 없습니다.';
  if (!isAdmin && placeForm) resetForm();
  renderPlaces();
}

function makeText(tag, className, content) {
  const el = document.createElement(tag); el.className = className; el.textContent = content; return el;
}
function renderPlaces() {
  if (!placesList) return;
  placesList.replaceChildren();
  const sorted = Object.entries(entries).filter(([,item]) => item && typeof item === 'object').sort((a,b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));
  placeCount.textContent = `${sorted.length}개의 보물`;
  if (!sorted.length) { placesList.append(makeText('p','empty','아직 기록된 장소가 없어요. 첫 번째 보물을 기다리는 중! 🗺️')); return; }
  for (const [id, item] of sorted) {
    const card = makeText('article','place-card','');
    if (safePhoto(item.photo)) { const img = document.createElement('img'); img.className='photo'; img.src=item.photo; img.alt=`${item.name || '장소'} 사진`; img.loading='lazy'; card.append(img); }
    else card.append(makeText('div','photo-placeholder','📷'));
    const body = makeText('div','card-body','');
    body.append(makeText('h3','',item.name || '이름 없는 장소'),makeText('p','address',item.address || ''),makeText('p','review',item.review || ''));
    if (isAdmin) {
      const expand = makeText('button','card-expand','⚙️ 카드 관리 메뉴 열기'); expand.type='button'; expand.setAttribute('aria-expanded','false');
      const controls=makeText('div','card-controls',''); controls.hidden=true;
      const edit=makeText('button','secondary','수정');edit.type='button';
      const del=makeText('button','secondary','삭제');del.type='button';
      expand.addEventListener('click',()=>{controls.hidden=!controls.hidden;expand.setAttribute('aria-expanded',String(!controls.hidden));});
      edit.addEventListener('click',()=>editPlace(id,item));
      del.addEventListener('click',async()=>{if (!isAdmin || busy || del.disabled) return; if (!confirm(`“${item.name}” 기록을 삭제할까요?`))return;del.disabled=true;try{await remove(ref(database,`places/${region}/${id}`));}catch(e){alert('삭제 실패: '+e.message);}finally{del.disabled=false;}});
      controls.append(edit,del);body.append(expand,controls);
    }
    card.append(body);placesList.append(card);
  }
}
function editPlace(id,item){
  if (!isAdmin || busy) return;
  previewVersion++;
  editingId=id;previousPhoto=safePhoto(item.photo)?item.photo:'';
  document.querySelector('#removePhoto').checked=false;
  document.querySelector('#removePhotoLabel').hidden=!previousPhoto;
  showPreview(previousPhoto);
  document.querySelector('#placeName').value=item.name||'';
  document.querySelector('#placeAddress').value=item.address||'';
  document.querySelector('#placeReview').value=item.review||'';
  document.querySelector('#placePhoto').value='';
  document.querySelector('#formTitle').textContent='보물 기록 수정하기';
  placeForm.hidden=false;document.querySelector('#formToggle').setAttribute('aria-expanded','true');placeForm.scrollIntoView({behavior:'smooth',block:'start'});
}
function resetForm(){ previewVersion++; showPreview(''); document.querySelector('#removePhotoLabel').hidden=true; editingId=null;previousPhoto='';placeForm.reset();placeForm.hidden=true;document.querySelector('#formTitle').textContent='새로운 장소 기록하기';document.querySelector('#formToggle').setAttribute('aria-expanded','false');document.querySelector('#formStatus').textContent=''; }
if (placeForm) {
  document.querySelector('#formToggle').addEventListener('click',()=>{if (!isAdmin || busy)return;placeForm.hidden=!placeForm.hidden;document.querySelector('#formToggle').setAttribute('aria-expanded',String(!placeForm.hidden));});
  document.querySelector('#cancelBtn').addEventListener('click',()=>{if(!busy)resetForm();});
  document.querySelector('#placePhoto').addEventListener('change', previewPhoto);
  document.querySelector('#removePhoto').addEventListener('change',()=>{if(!document.querySelector('#placePhoto').files[0]) showPreview(document.querySelector('#removePhoto').checked?'':previousPhoto);});
  placeForm.addEventListener('submit',async event=>{
    event.preventDefault();if(!isAdmin || !database || busy)return;
    const status=document.querySelector('#formStatus');const targetId=editingId; const userId=auth.currentUser?.uid; busy=true; setFormBusy(true);status.textContent='보물을 저장하는 중...';
    try {
      const photoFile=document.querySelector('#placePhoto').files[0];
      const photo=photoFile?await compressPhoto(photoFile):(document.querySelector('#removePhoto').checked?'':previousPhoto);
      if (!isAdmin || auth.currentUser?.uid !== userId) throw new Error('관리자 로그인을 다시 확인해 주세요.');
      if (targetId && !entries[targetId]) throw new Error('이미 삭제된 기록이에요. 취소 후 새로 등록해 주세요.');
      const item={name:document.querySelector('#placeName').value.trim(),address:document.querySelector('#placeAddress').value.trim(),review:document.querySelector('#placeReview').value.trim(),photo,createdAt:targetId?(entries[targetId]?.createdAt||Date.now()):Date.now()};
      if(!item.name||!item.address||!item.review)throw new Error('모든 내용을 입력해 주세요.');
      if(item.name.length>60 || item.address.length>160 || item.review.length>300)throw new Error('입력 가능한 글자 수를 초과했어요.');
      if(targetId)await update(ref(database,`places/${region}/${targetId}`),item);
      else await set(push(ref(database,`places/${region}`)),item);
      resetForm();dataStatus.textContent=targetId?'기록을 수정했어요.':'새로운 보물을 저장했어요.';
    } catch(e){status.textContent='저장 실패: '+e.message;} finally {busy=false;setFormBusy(false);}
  });
}
// 강의자료 외 추가 기능: 사진을 작게 압축해 Realtime Database에 저장.
// 별도 Storage 요금제 설정 없이 시험할 수 있지만 사진이 많으면 DB 사용량이 늘어납니다.
function compressPhoto(file){
  return new Promise((resolve,reject)=>{
    if(file.size>20*1024*1024){reject(new Error('사진은 20MB 이하로 선택해 주세요.'));return;}
    if(!/^image\/(jpeg|png|webp|gif)$/.test(file.type)){reject(new Error('JPG, PNG, WebP, GIF 사진을 선택해 주세요.'));return;}
    const img=new Image();const url=URL.createObjectURL(file);
    img.onload=()=>{try{
      if (!img.width || !img.height) throw new Error('사진 크기를 읽지 못했어요.');
      const max=640,scale=Math.min(1,max/Math.max(img.width,img.height));
      const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);
      canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
      const result=canvas.toDataURL('image/jpeg',0.65);
      URL.revokeObjectURL(url);
      if(result.length>170000)reject(new Error('사진이 너무 커요. 더 작은 사진을 선택해 주세요.'));
      else resolve(result);
    }catch(e){URL.revokeObjectURL(url);reject(e);}};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('사진을 읽지 못했어요.'));};img.src=url;
  });
}
document.querySelector('#loginForm').addEventListener('submit',async e=>{
  e.preventDefault();if(!auth){loginStatus.textContent='Firebase 설정을 먼저 완료해 주세요.';return;}
  const submit=e.currentTarget.querySelector('button[type=submit]'); if(submit.disabled)return;submit.disabled=true;loginStatus.textContent='로그인 중...';
  try{const result=await signInWithEmailAndPassword(auth,document.querySelector('#loginEmail').value.trim(),document.querySelector('#loginPassword').value);if(!ADMIN_UIDS.includes(result.user.uid)){await signOut(auth);throw new Error('관리자로 지정되지 않은 계정이에요.');}loginStatus.textContent='';document.querySelector('#loginPassword').value='';loginDialog.close();}
  catch(error){loginStatus.textContent='로그인 실패: '+error.message;}finally{submit.disabled=false;}
});
logoutBtn.addEventListener('click',async()=>{try{if(auth)await signOut(auth);}catch(error){alert('로그아웃 실패: '+error.message);return;}menu.classList.remove('open');hamburger.setAttribute('aria-expanded','false');if(placeForm)resetForm();});

function safePhoto(value) {
  return typeof value === 'string' && (value.startsWith('https://') || /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value));
}
function setFormBusy(value) {
  for (const el of placeForm.querySelectorAll('input,textarea,button')) el.disabled=value;
  document.querySelector('#formToggle').disabled=value;
}
function showPreview(photo) {
  const preview=document.querySelector('#photoPreview');
  if(!preview)return;
  preview.hidden=!photo;
  if(photo)preview.src=photo;else preview.removeAttribute('src');
}
async function previewPhoto() {
  const version=++previewVersion;
  const file=document.querySelector('#placePhoto').files[0];
  const status=document.querySelector('#formStatus');status.textContent='';
  if(!file){showPreview(document.querySelector('#removePhoto').checked?'':previousPhoto);return;}
  try { const photo=await compressPhoto(file); if(version===previewVersion)showPreview(photo); }
  catch(error){if(version===previewVersion){document.querySelector('#placePhoto').value='';showPreview(previousPhoto);status.textContent=error.message;}}
}
async function connectFirebase() {
if (!configured) {
  loginStatus.textContent='Firebase 설정이 아직 연결되지 않았어요. README를 확인해 주세요.';
  if (dataStatus) dataStatus.textContent='🔧 Firebase 연결 전입니다. README의 설정 방법을 따라 주세요.';
  renderPlaces();
} else {
  try {
    ({ initializeApp } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'));
    ({ getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js'));
    ({ getDatabase, ref, onValue, push, set, update, remove } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js'));
    const app=initializeApp(firebaseConfig);auth=getAuth(app);database=getDatabase(app);
    onAuthStateChanged(auth,updateAdminUI);
    if(['top','middle','bottom','secret'].includes(region))onValue(ref(database,`places/${region}`),snapshot=>{entries=snapshot.val()||{};dataStatus.textContent='';renderPlaces();},error=>{entries={};renderPlaces();dataStatus.textContent='기록을 불러오지 못했어요: '+error.message;});
  }catch(e){if(dataStatus)dataStatus.textContent='Firebase 연결 오류: '+e.message;loginStatus.textContent=e.message;}
}

}
connectFirebase();
