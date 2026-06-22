const H=window.PARTNER_HEADERS;
const R=window.PARTNER_ROWS.map(r=>Object.fromEntries(H.map((h,i)=>[h,r[i]||'']))).filter(x=>x.nombre&&x.region);
const months=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const today=new Date();const currentMonth=today.getMonth()+1;const currentYear=today.getFullYear();
const $=id=>document.getElementById(id), uniq=a=>[...new Set(a.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
const roleOrder=['Gerente','Subgerente','Supervisor','Barista','Otros'];
const roleName=p=>/sub/i.test(p)?'Subgerente':/super/i.test(p)?'Supervisor':/bar/i.test(p)?'Barista':/gerente/i.test(p)?'Gerente':'Otros';
const roleRank=p=>{const i=roleOrder.indexOf(roleName(p));return i>=0?i:9};
const esc=s=>String(s||'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
function dateParts(s){if(!s)return null;const d=new Date(s+'T00:00:00');return isNaN(d)?null:{d,day:d.getDate(),month:d.getMonth()+1,year:d.getFullYear()}}
function fillSelect(el,items,all='Todas'){el.innerHTML=`<option value="">${all}</option>`+items.map(x=>`<option>${esc(x)}</option>`).join('')}
function monthOptions(el){el.innerHTML=`<option value="">Todos</option>`+months.map((m,i)=>`<option value="${i+1}" ${i+1==currentMonth?'selected':''}>${m}</option>`).join('')}
function init(){document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab,.panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');$(b.dataset.tab).classList.add('active')});
 ['pRegion','aRegion','bRegion'].forEach(id=>fillSelect($(id),uniq(R.map(x=>x.region))));
 ['aMonth','bMonth'].forEach(id=>monthOptions($(id)));
 fillSelect($('pRole'),roleOrder.filter(x=>x!='Otros'),'Todas');
 ['pRegion','pDM','pStore','pRole','pSearch','aRegion','aDM','aMonth','aSearch','bRegion','bDM','bMonth','bSearch'].forEach(id=>$(id)?.addEventListener('input',renderAll));
 renderAll();if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');}
function cascade(prefix){let region=$(prefix+'Region').value, oldDM=$(prefix+'DM').value, oldStore=$(prefix+'Store')?$(prefix+'Store').value:'';let list=R.filter(x=>!region||x.region==region), dms=uniq(list.map(x=>x.dm));fillSelect($(prefix+'DM'),dms,'Todos');if(dms.includes(oldDM))$(prefix+'DM').value=oldDM;list=list.filter(x=>!$(prefix+'DM').value||x.dm==$(prefix+'DM').value);if($(prefix+'Store')){let stores=uniq(list.map(x=>x.tienda));fillSelect($(prefix+'Store'),stores,'Todas');if(stores.includes(oldStore))$(prefix+'Store').value=oldStore;}}
function filterBase(prefix){let region=$(prefix+'Region')?.value||'',dm=$(prefix+'DM')?.value||'',store=$(prefix+'Store')?.value||'';return R.filter(x=>(!region||x.region==region)&&(!dm||x.dm==dm)&&(!store||x.tienda==store))}
function roleCounts(data){return Object.fromEntries(roleOrder.map(r=>[r,data.filter(x=>roleName(x.puesto)==r).length]));}
function barRows(counts){let max=Math.max(1,...Object.values(counts));return Object.entries(counts).filter(([k])=>k!='Otros'||counts[k]>0).map(([r,c])=>`<div class="barRow"><b>${esc(r)}</b><span>${c}</span><div><i style="width:${c/max*100}%"></i></div></div>`).join('')}
function ageCounts(data){let labels=['De 18 a 20 años','De 21 a 29 años','De 30 a 39 años','De 40 a 49 años','De 50 a 59 años','Mas de 60 años'];let counts=Object.fromEntries(labels.map(l=>[l,0]));data.forEach(x=>{let r=(x.rango||'').replace(/\.$/,'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');let key=labels.find(l=>r.includes(l.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')));if(key)counts[key]++;});return counts;}
function renderPartner(){cascade('p');let data=filterBase('p');let role=$('pRole').value, search=($('pSearch').value||'').toLowerCase();data=data.filter(x=>(!role||roleName(x.puesto)==role)&&(!search||(x.nombre+' '+x.num+' '+x.tienda).toLowerCase().includes(search)));
 let stores=uniq(data.map(x=>x.tienda)),dms=uniq(data.map(x=>x.dm)),rc=roleCounts(data);$('kPartners').textContent=data.length;$('kStores').textContent=stores.length;$('kDMs').textContent=dms.length;$('kGerentes').textContent=rc.Gerente;$('kSup').textContent=rc.Supervisor;$('kBar').textContent=rc.Barista;
 $('storeTitle').textContent=$('pStore').value||'Resumen Partner';$('storeMeta').textContent=[$('pRegion').value||'Todas las regiones',$('pDM').value||'Todos los DM',$('pRole').value||'Todas las posiciones'].join(' · ');
 let f=data.filter(x=>x.sexo=='F').length,m=data.filter(x=>x.sexo=='M').length,pct=data.length?Math.round(f/data.length*100):0;$('donut').style.setProperty('--pct',pct);$('donutPct').textContent=pct+'%';$('womenPct').textContent=pct+'% Mujeres';$('menPct').textContent=(data.length?Math.round(m/data.length*100):0)+'% Hombres';
 $('roleBars').innerHTML=barRows(rc);$('ageBars').innerHTML=barRows(ageCounts(data));
 let grouped={};data.sort((a,b)=>roleRank(a.puesto)-roleRank(b.puesto)||a.nombre.localeCompare(b.nombre,'es')).forEach(x=>(grouped[roleName(x.puesto)]??=[]).push(x));
 $('hierarchy').innerHTML=roleOrder.filter(r=>r!='Otros'||(grouped[r]||[]).length).map(r=>{let arr=grouped[r]||[];return `<article class="role"><h2>${r=='Barista'?'Baristas':r}<span class="badge">${arr.length}</span></h2>${arr.map(personCard).join('')||'<small>Sin partners</small>'}</article>`}).join('');}
function personCard(x){return `<div class="person" onclick='showDetail(${JSON.stringify(x).replaceAll("'","&#39;")})'><div><b>${esc(x.nombre)}</b><small>${esc(x.num)} · ${esc(x.puesto)} · ${esc(x.tienda)}</small></div><span class="badge">${esc(x.turno)}</span></div>`}
function yearsAt(s){let p=dateParts(s);if(!p)return 0;let y=currentYear-p.year;return Math.max(0,y)}
function ageAt(s){let p=dateParts(s);if(!p)return '';let a=currentYear-p.year;let thisYearBirthday=new Date(currentYear,p.month-1,p.day);if(today<thisYearBirthday)a--;return Math.max(0,a)}
function monthShort(n){return months[n-1].slice(0,3).toUpperCase()}
function filteredCelebrations(type){let pre=type=='a'?'a':'b';cascade(pre);let month=$(pre+'Month').value,search=($(pre+'Search').value||'').toLowerCase();return filterBase(pre).filter(x=>{let p=dateParts(type=='a'?x.ingreso:x.nac);return p&&(!month||p.month==+month)&&(!search||(x.nombre+' '+x.tienda).toLowerCase().includes(search))}).sort((x,y)=>{let px=dateParts(type=='a'?x.ingreso:x.nac),py=dateParts(type=='a'?y.ingreso:y.nac);return px.month-py.month||px.day-py.day||x.nombre.localeCompare(y.nombre,'es')});}
function renderCeleb(type){let pre=type=='a'?'a':'b', monthVal=$(pre+'Month').value, data=filteredCelebrations(type);$(pre+'MonthTitle').textContent=monthVal?months[+monthVal-1]:'Todo el año';$(pre+'Count').textContent=data.length+(type=='a'?' aniversarios':' cumpleaños')+(monthVal?'':' · todo el año');
 let limit=monthVal?28:48;let html=data.slice(0,limit).map(x=>{let p=dateParts(type=='a'?x.ingreso:x.nac), years=type=='a'?yearsAt(x.ingreso):ageAt(x.nac);return `<div class="celebration"><div class="day"><b>${String(p.day).padStart(2,'0')}</b><span>${monthShort(p.month)}</span></div><div class="who"><b>${esc(x.nombre)}</b><small>${esc(x.tienda)}</small></div><div class="years"><b>${years} ${years==1?'año':'años'}</b><small>${type=='a'?'en la marca':'edad'}</small></div></div>`}).join('')||'<div class="celebration empty"><div class="who"><b>Sin registros para este filtro</b><small>Ajusta Región, DM o Mes.</small></div></div>';
 $(pre+'List').innerHTML=html;}
function renderAll(){renderPartner();renderCeleb('a');renderCeleb('b')}
function showDetail(x){$('detailBody').innerHTML=`<h2>${esc(x.nombre)}</h2><p><b># Empleado:</b> ${esc(x.num)}</p><p><b>Puesto:</b> ${esc(x.puesto)}</p><p><b>Tienda:</b> ${esc(x.tienda)}</p><p><b>Centro de costos:</b> ${esc(x.cc)}</p><p><b>DM:</b> ${esc(x.dm)}</p><p><b>Región:</b> ${esc(x.region)}</p><p><b>Jornada:</b> ${esc(x.turno)}</p><p><b>Sexo:</b> ${x.sexo=='F'?'Femenino':x.sexo=='M'?'Masculino':esc(x.sexo)}</p><p><b>Edad:</b> ${esc(x.edad||ageAt(x.nac))} años · ${esc(x.rango||'')}</p><p><b>Ingreso:</b> ${esc(x.ingreso)} · ${yearsAt(x.ingreso)} años en la marca</p>`;$('detail').showModal()}
init();
