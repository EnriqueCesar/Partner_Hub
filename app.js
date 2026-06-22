const $ = (id)=>document.getElementById(id);
const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const rankOrder = ['Gerente','Subgerente','Supervisor','Barista'];
const data = (window.PARTNER_DATA||[]).map((p,i)=>({...p, _id:i, _mesDate:excelDate(p.mes), _ing:toDate(p.f_ingreso), _nac:toDate(p.f_nac)}));
let state = {region:'', month:'', store:'', tab:'partners'};
function excelDate(v){ const n=Number(v); if(!n) return null; return new Date(Date.UTC(1899,11,30+n)); }
function toDate(v){ if(!v) return null; const d=new Date(v+'T00:00:00'); return isNaN(d)?null:d; }
function unique(arr){ return [...new Set(arr.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'es')); }
function norm(s){ return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
function puestoGroup(p){ const x=norm(p.puesto_agrupado||p.puesto); if(x.includes('gerente')) return 'Gerente'; if(x.includes('sub')) return 'Subgerente'; if(x.includes('super')||x.includes('shift')) return 'Supervisor'; return 'Barista'; }
function monthKey(d){ return d ? `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}` : ''; }
function monthLabel(k){ if(!k) return 'Todos'; const [y,m]=k.split('-'); return `${monthNames[Number(m)-1]} ${y}`; }
function selectedMonthNumber(){ if(state.month){ return Number(state.month.split('-')[1]); } return new Date().getMonth()+1; }
function baseFiltered(ignoreStore=false){ return data.filter(p=>(!state.region||p.region===state.region)&&(!state.month||monthKey(p._mesDate)===state.month)&&((ignoreStore)||!state.store||p.tienda===state.store)); }
function init(){
  const regions=unique(data.map(p=>p.region)); fillSelect($('regionFilter'), regions, 'Todas las regiones'); state.region=regions.includes('CENTRO NORTE')?'CENTRO NORTE':(regions[0]||''); $('regionFilter').value=state.region;
  const months=unique(data.map(p=>monthKey(p._mesDate))).sort().reverse(); fillSelect($('monthFilter'), months, 'Todos los meses', monthLabel); state.month=months[0]||''; $('monthFilter').value=state.month;
  updateStores(); bind(); render();
}
function fillSelect(sel, items, first, labelFn=(x)=>x){ sel.innerHTML=`<option value="">${first}</option>`+items.map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(labelFn(x))}</option>`).join(''); }
function updateStores(){ const stores=unique(baseFiltered(true).map(p=>p.tienda)); fillSelect($('storeFilter'), stores, 'Todas las tiendas'); if(!stores.includes(state.store)) state.store=''; $('storeFilter').value=state.store; }
function bind(){
  $('regionFilter').onchange=e=>{state.region=e.target.value;updateStores();render()};
  $('monthFilter').onchange=e=>{state.month=e.target.value;updateStores();render()};
  $('storeFilter').onchange=e=>{state.store=e.target.value;render()};
  ['partnerSearch','annivSearch','birthSearch'].forEach(id=>$(id).oninput=render);
  document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab,.panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');$(b.dataset.tab).classList.add('active');state.tab=b.dataset.tab;render();});
}
function render(){ document.querySelectorAll('.monthName').forEach(x=>x.textContent=monthLabel(state.month)); renderPartners(); renderAnniv(); renderBirth(); }
function renderPartners(){ const rows=baseFiltered(); const total=rows.length, f=rows.filter(p=>p.sexo==='F').length, m=rows.filter(p=>p.sexo==='M').length; const pctF=total?Math.round(f/total*100):0; const pctM=total?100-pctF:0;
  $('kpis').innerHTML=`<div class="kpirow"><div class="kpi"><b>${total}</b><span>Partners</span></div><div class="kpi"><b>${unique(rows.map(p=>p.tienda)).length}</b><span>Tiendas</span></div><div class="kpi"><b>${rows.filter(p=>puestoGroup(p)==='Gerente').length}</b><span>Gerentes</span></div><div class="kpi"><b>${rows.filter(p=>puestoGroup(p)==='Supervisor').length}</b><span>Supervisores</span></div></div>`;
  $('donut').style.background=`conic-gradient(var(--green) ${pctF*3.6}deg,#dbe8df 0deg)`; $('donut').textContent=`${pctF}% F`;
  $('genderLegend').innerHTML=`<div class="legend"><div><b>${pctF}% Mujeres</b> · ${f}</div><div><b>${pctM}% Hombres</b> · ${m}</div></div>`;
  const q=norm($('partnerSearch').value); const filtered=rows.filter(p=>!q||norm(`${p.nombre} ${p.num_emp} ${p.puesto} ${p.tienda}`).includes(q));
  let html=''; rankOrder.forEach(g=>{ const arr=filtered.filter(p=>puestoGroup(p)===g).sort((a,b)=>a.nombre.localeCompare(b.nombre,'es')); if(arr.length){ html+=`<div class="group"><h3>${g} · ${arr.length}</h3>`+arr.map(personRow).join('')+'</div>'; }});
  $('partnerList').innerHTML=html||'<p>No hay partners con estos filtros.</p>';
}
function personRow(p){ return `<div class="person" onclick="showDetail(${p._id})"><div><b>${escapeHtml(p.nombre)}</b><br><small>${escapeHtml(p.puesto)} · ${escapeHtml(p.tienda)}</small></div><span class="badge"># ${escapeHtml(p.num_emp)}</span></div>`; }
function yearsAt(d){ if(!d) return 0; const now=new Date(); let y=now.getFullYear()-d.getFullYear(); const passed=(now.getMonth()>d.getMonth())||(now.getMonth()===d.getMonth()&&now.getDate()>=d.getDate()); return passed?y:y-1; }
function renderAnniv(){ const mon=selectedMonthNumber(); const q=norm($('annivSearch').value); const rows=baseFiltered().filter(p=>p._ing && p._ing.getMonth()+1===mon).map(p=>({...p, years:yearsAt(p._ing), day:p._ing.getDate()})).filter(p=>p.years>0).filter(p=>!q||norm(`${p.nombre} ${p.tienda} ${p.years}`).includes(q)).sort((a,b)=>a.day-b.day||a.nombre.localeCompare(b.nombre,'es')); $('annivList').innerHTML=rows.map(p=>eventRow(p,`${p.years} años`)).join('')||'<p>No hay aniversarios en este mes.</p>'; }
function renderBirth(){ const mon=selectedMonthNumber(); const q=norm($('birthSearch').value); const rows=baseFiltered().filter(p=>p._nac && p._nac.getMonth()+1===mon).map(p=>({...p, day:p._nac.getDate()})).filter(p=>!q||norm(`${p.nombre} ${p.tienda} ${p.day}`).includes(q)).sort((a,b)=>a.day-b.day||a.nombre.localeCompare(b.nombre,'es')); $('birthList').innerHTML=rows.map(p=>eventRow(p,`Día ${p.day}`)).join('')||'<p>No hay cumpleaños en este mes.</p>'; }
function eventRow(p,badge){ return `<div class="event" onclick="showDetail(${p._id})"><div class="day"><span>DÍA</span>${p.day}</div><div><b>${escapeHtml(p.nombre)}</b><br><small>${escapeHtml(p.tienda)} · ${escapeHtml(p.puesto)}</small></div><span class="badge">${escapeHtml(badge)}</span></div>`; }
function showDetail(id){ const p=data.find(x=>x._id===id); if(!p) return; $('detailBox').innerHTML=`<h2>${escapeHtml(p.nombre)}</h2><p><b># Empleado:</b> ${escapeHtml(p.num_emp)}</p><p><b>Tienda:</b> ${escapeHtml(p.tienda)}</p><p><b>Puesto:</b> ${escapeHtml(p.puesto)}</p><p><b>Jornada:</b> ${escapeHtml(p.turno)}</p><p><b>Región:</b> ${escapeHtml(p.region)}</p><p><b>DM:</b> ${escapeHtml(p.dm)}</p><p><b>Sexo:</b> ${p.sexo==='F'?'Femenino':p.sexo==='M'?'Masculino':escapeHtml(p.sexo)}</p><p><b>Ingreso:</b> ${p.f_ingreso||'N/D'} · ${yearsAt(p._ing)} años</p><p><b>Cumpleaños:</b> ${p._nac?`${p._nac.getDate()} de ${monthNames[p._nac.getMonth()]}`:'N/D'}</p>`; detailDialog.showModal(); }
function escapeHtml(s){ return String(s||'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m])); }
if('serviceWorker' in navigator){ navigator.serviceWorker.register('./sw.js'); }
init();
