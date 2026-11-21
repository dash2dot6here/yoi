/* Local research prototype. AMap credentials are accepted at runtime only. */
'use strict';
const D=window.NIGHT_DATA, $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const COLORS=['#78bfb1','#95adee','#c394e5','#f3a66d','#df86a4','#d2c282','#729bd1','#7fb29a','#a1a8b4','#b39372'];
const state={lang:'en',night:new URLSearchParams(location.search).get('night')==='1'?1:0,hour:6,district:-1,category:3,subtype:'',mode:'points',size:1,tab:'explore',search:''};
const EN_DIST=['Furong','Tianxin','Yuelu','Kaifu','Yuhua','Wangcheng'],EN_CAT=['Convenience retail','Human healthcare','Bars & live music','Dining','Entertainment','Animal healthcare','Banks & ATMs','Hotels & homestays','Daily services','Specialty retail'];
const EN_SUB=['KTV & singing','Esports & internet cafés','Chess, cards & mahjong','Billiards','Cinemas','Foot care, massage & bathhouses','Multiple types / review','Other / review'];
let map=null,mass=null,polygons=[],playTimer=null,mapReady=false,mapLoading=false,toastTimer,cityBounds=null,cityMinZoom=10,cityView=null,correctingView=false;
// All valid coordinates in the six-district study sample define the city view.
const cityExtent=D.records.reduce((b,r)=>r[4]===null||r[5]===null?b:[Math.min(b[0],r[4]),Math.min(b[1],r[5]),Math.max(b[2],r[4]),Math.max(b[3],r[5])],[Infinity,Infinity,-Infinity,-Infinity]);
function syncZoomControls(){if(!mapReady)return;$('#zoomOut').disabled=map.getZoom()<=cityMinZoom+.01;$('#zoomIn').disabled=map.getZoom()>=19.99;}
function constrainCityView(){
 if(!map||!cityView||correctingView)return;
 const b=map.getBounds(),sw=b.getSouthWest(),ne=b.getNorthEast();
 const x0=sw.getLng(),y0=sw.getLat(),x1=ne.getLng(),y1=ne.getLat();
 const scale=Math.max((x1-x0)/(cityView[2]-cityView[0]),(y1-y0)/(cityView[3]-cityView[1]));
 correctingView=true;
 if(scale>1.0001){
  cityMinZoom=Math.min(20,Math.max(cityMinZoom,map.getZoom()+Math.log2(scale)));
  map.setZooms([cityMinZoom,20]);map.setZoom(cityMinZoom,true);
 }else{
  const dx=x0<cityView[0]?cityView[0]-x0:(x1>cityView[2]?cityView[2]-x1:0);
  const dy=y0<cityView[1]?cityView[1]-y0:(y1>cityView[3]?cityView[3]-y1:0);
  if(Math.abs(dx)>1e-6||Math.abs(dy)>1e-6){const c=map.getCenter();map.setCenter([c.getLng()+dx,c.getLat()+dy],true);}
 }
 correctingView=false;syncZoomControls();
}
const I={
 zh:{heroSubtitle:'午夜之后：长沙的另一面',subtypeLabel:'娱乐细分',explore:'地图探索',analysis:'夜间观察',method:'数据与方法',connect:'连接高德地图',title:'凌晨三点，<br>长沙还醒着吗？',intro:'以深夜餐饮为起点，探索长沙的夜宵、娱乐与生活服务。',heroMeta:'餐饮优先 · 十类夜间服务<br>真实营业时间样本 · 非实时客流',prototype:'LOCAL PROTOTYPE / 本地原型',weekday:'工作日 · 周三夜',weekend:'周末 · 周六夜',districtLabel:'区域',serviceLabel:'服务',reset:'餐饮优先 ↺',mapHeading:'此刻，哪里还亮着灯？',points:'商家点位',grid:'网格服务',mapEmptyTitle:'让真实的长沙，出现在地图上',mapEmptyDesc:'填入高德 Web端 Key 后加载在线底图。时间与统计已接入真实数据。',configure:'配置地图',howKey:'如何获取 Key？ ↗',notConnected:'○ 尚未连接高德',connected:'● 高德地图已连接',fit:'适配点位',gridSize:'网格面积',gridNote:'仅含当前夜晚全程可判断且有坐标的样本',composition:'夜间服务总览',businesses:'营业商家',listOrder:'按名称排序展示前30家；搜索仅作用于列表和点位图。',moveTime:'拖动时间，观察城市的变化',analysisHeading:'夜深之后，服务如何改变？',filterLinked:'区域与服务筛选联动',curveTitle:'工作日与周末，谁更晚睡？',pairedNote:'使用双夜全部9时点均可判断的同一批商家；不代表实际客流。',weekdayShort:'周三夜',weekendShort:'周六夜',retentionTitle:'哪种服务更早熄灯？',retentionNote:'当前夜晚21点营业基线中，各整点仍营业的比例；固定双夜可判断样本。',districtTitle:'同一时刻，不同的城市切面',districtNote:'当前夜晚、时点和服务；为便于比较，始终展示全部六区。',spaceTitle:'服务是否向少数片区集中？',spaceNote:'跟随当前区域与服务筛选；约1km²固定网格，使用当前夜晚全程可判断且有坐标的商家。',hhiNote:'HHI为各网格营业商家份额平方和，越高越集中；营业网格数不表示服务能力充足。',deeperHeading:'深夜，是谁在支撑？',brandTitle:'品牌与独立小店',brandNote:'依据店名线索识别；未识别不能当作独立店，不能据此计算真实连锁占比。',funTitle:'长沙味道与深夜线索',funNote:'名称关键词命中；小龙虾是菜品主题。此模块跟随区域、夜晚和时点，不跟随服务筛选。',touristTitle:'旅游旺区，会更晚睡吗？',touristNote:'现有数据可以描述区域差异，但没有游客量、租金或居民活动数据，暂时不能解释原因。',needsEvidence:'需要补充证据',methodHeading:'看见城市，也看见数据的边界。',download:'下载原统计表（含四类主线）↗',downloadShort:'统计表 ↗',guideTitle:'接入高德地图，只需两项配置',amapDocs:'查看高德官方说明 ↗',footer:'营业时间推算 · 采集日期待补充 · 本地研究原型',configTitle:'连接高德在线地图',configDesc:'配置仅用于当前页面，不写入项目文件。页面刷新后需要重新填写。',proxyLabel:'已有安全代理地址（可选，与安全码二选一）',loadMap:'加载地图',allDistricts:'六区合计',allServices:'全部十类',stores:'家',noResults:'当前筛选下没有匹配的营业商家。',search:'搜索商家名称 / 地址',loading:'正在连接高德…',mapError:'地图加载失败。请核对 Key、JS API 平台类型、安全配置、网络和控制台白名单。',needSecurity:'请填写 securityJsCode 或有效安全代理地址。',noPoints:'当前筛选下没有可定位商家。',gridToast:'网格营业商家',gridTypes:'服务类别数',coordinateMissing:'坐标缺失，无法定位；保留在数量统计中。'},
 en:{heroSubtitle:'After Midnight: The Other Side of Changsha',subtypeLabel:'Entertainment type',explore:'Explore',analysis:'Night insights',method:'Data & methods',connect:'Connect AMap',title:'At 3 AM,<br>is Changsha still awake?',intro:'Start with late-night dining. Explore food, entertainment and the services that keep Changsha awake.',heroMeta:'Dining first · 10 service categories<br>Reported opening hours · Not live footfall',prototype:'LOCAL RESEARCH PROTOTYPE',weekday:'Weekday · Wed night',weekend:'Weekend · Sat night',districtLabel:'District',serviceLabel:'Service',reset:'Dining first ↺',mapHeading:'Where are the lights still on?',points:'Businesses',grid:'Service grids',mapEmptyTitle:'Bring the real city into view',mapEmptyDesc:'Enter your AMap Web JS API configuration to load the basemap. Time filters and statistics already use the real dataset.',configure:'Configure map',howKey:'How do I get a Key? ↗',notConnected:'○ AMap not connected',connected:'● AMap connected',fit:'Fit businesses',gridSize:'Grid area',gridNote:'Uses geocoded records with all 9 hours known for this night',composition:'Night services overview',businesses:'Open businesses',listOrder:'First 30 in name order. Search affects only the list and business-point layer.',moveTime:'Move through the night',analysisHeading:'How does the city change after dark?',filterLinked:'Linked district & service filters',curveTitle:'Weekday or weekend: which stays awake?',pairedNote:'The same records with all 9 hours known on both nights. Reported hours, not observed activity.',weekdayShort:'Wed night',weekendShort:'Sat night',retentionTitle:'Which services wind down first?',retentionNote:'Share of the 21:00 baseline open at each hour, on the selected night. Uses the fixed paired sample.',districtTitle:'One hour. Six different districts.',districtNote:'Selected night, hour and service. All six districts remain visible for comparison.',spaceTitle:'Do services become more concentrated?',spaceNote:'Linked to district and service filters. Fixed ≈1km² grids; geocoded records with all hours known for this night.',hhiNote:'HHI is the sum of squared grid shares: higher means more concentrated. Occupied grids do not measure service capacity.',deeperHeading:'Who keeps the night going?',brandTitle:'Brands & independent shops',brandNote:'Name-based signals only. Unidentified does not mean independent; these are not verified chain shares.',funTitle:'Local flavors & after-dark clues',funNote:'Business-name keyword matches; crayfish is a food theme. Linked to district, night and hour, but not the service filter.',touristTitle:'Do visitor districts stay up later?',touristNote:'The data describes district differences. Without visitor counts, rents or residents’ activity, it cannot establish why.',needsEvidence:'Further evidence needed',methodHeading:'Understand the city. Understand the limits.',download:'Original statistics (four-service core) ↗',downloadShort:'Statistics ↗',guideTitle:'Connect AMap with two configuration values',amapDocs:'Official AMap setup guide ↗',footer:'Reported opening hours · Collection date unconfirmed · Local prototype',configTitle:'Connect the AMap basemap',configDesc:'Configuration stays in this page only. It is not written to project files. Enter it again after a reload.',proxyLabel:'Existing security proxy URL (optional alternative to code)',loadMap:'Load map',allDistricts:'All six districts',allServices:'All 10 services',stores:'',noResults:'No open businesses match these filters.',search:'Search business / address',loading:'Connecting to AMap…',mapError:'Map failed to load. Check the Key, Web JS API type, security configuration, network and domain allowlist.',needSecurity:'Enter securityJsCode or a valid security proxy URL.',noPoints:'No geocoded businesses under these filters.',gridToast:'Open businesses in grid',gridTypes:'Service categories',coordinateMissing:'Missing coordinates. Included in counts, but cannot be located.'}
};
const t=k=>I[state.lang][k]??k, en=()=>state.lang==='en', fmt=n=>Number(n).toLocaleString(en()?'en-US':'zh-CN'), pct=n=>(n*100).toFixed(1)+'%', esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cname=c=>en()?EN_CAT[c]:D.categories[c],dname=d=>en()?EN_DIST[d]:D.districts[d],hourText=i=>`${String(D.hours[i]).padStart(2,'0')}:00`,nightName=()=>state.night?'周末(周六夜)':'工作日(周三夜)';
const validPair=r=>[...r[10],...r[11]].every(v=>v!==-1), opened=r=>r[10+state.night][state.hour]===1;
const statusConflict=r=>/暂停营业|已停业|已关闭|歇业|已搬迁/.test(r[1]);
const filtered=(ignoreDistrict=false,ignoreCategory=false)=>D.records.filter(r=>(ignoreDistrict||state.district<0||r[2]===state.district)&&(ignoreCategory||state.category<0||r[3]===state.category)&&(ignoreCategory||!state.subtype||r[14]===state.subtype));
function toast(msg){$('#toast').textContent=msg;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4500);}
function setOptions(){
 $('#district').innerHTML=`<option value="-1">${t('allDistricts')}</option>`+D.districts.map((_,i)=>`<option value="${i}">${dname(i)}</option>`).join('');$('#district').value=state.district;
 $('#category').innerHTML=`<option value="-1">${t('allServices')}</option>`+[3,0,1,2,4,5,6,7,8,9].map(i=>`<option value="${i}">${cname(i)}${i===3?(en()?' · Focus':' · 重点'):''}</option>`).join('');$('#category').value=state.category;
 $('#entertainmentSubtype').innerHTML=`<option value="">${en()?'All entertainment':'全部娱乐细类'}</option>`+D.subtypes.map((s,i)=>`<option value="${esc(s)}">${en()?EN_SUB[i]:s}</option>`).join('');$('#entertainmentSubtype').value=state.subtype;$('#subtypeField').hidden=state.category!==4;
}
function guideHTML(){return en()?`<ol><li>Sign in at <a href="https://console.amap.com/" target="_blank" rel="noopener">AMap Console ↗</a> and complete its required verification.</li><li>Open Application Management / My Applications. Create an application, then add a Key with platform <strong>Web JS API</strong>.</li><li>Copy the Key and its securityJsCode into this form. Do not use a Web Service API Key.</li><li>If the console requests an allowlist, configure it for the local address you are opening. A map error needs to be checked against the console’s actual message.</li><li>Local testing can use the code directly. Use a server-side security proxy before a public release.</li></ol>`:`<ol><li>登录<a href="https://console.amap.com/" target="_blank" rel="noopener">高德开放平台控制台 ↗</a>，完成平台要求的认证。</li><li>进入“应用管理／我的应用”，创建应用，添加 Key，平台选择 <strong>Web端（JS API）</strong>。</li><li>把 Key 和对应的 securityJsCode 填入本表；不要选择 Web服务 API Key。</li><li>若控制台要求白名单，按当前打开的本地地址配置；具体限制以控制台和实际错误为准。</li><li>本地开发可直接填安全码；公开发布前改用服务端安全代理。</li></ol>`;}
function methods(){
 const cards=en()?[
 ['01 · The sample','87,792 cleaned AMap records; 82,425 in the ten displayed services, including 24,985 dining records. Dining is selected by default. Dianping has 6,888 records.'],
 ['02 · What “open” means','Opening hours imply scheduled service, not live activity. Intervals include the start and exclude the end. Cross-midnight periods check both the current and preceding day.'],
 ['03 · Two comparable nights','Wednesday 21:00–Thursday 05:00 versus Saturday 21:00–Sunday 05:00. Paired comparisons use records with all 18 time points known. They are not specific calendar dates.'],
 ['04 · Missing is not closed','Records missing opening hours were removed before this dataset was supplied. Unparsed schedules and unlisted weekdays remain unknown. No citywide coverage rate can be recovered.'],
 ['05 · Geography','AMap coordinates are GCJ-02. Missing coordinates are retained in counts but excluded from map layers. Grids use a local planar approximation with areas of about 1 or 3 km², not exact district boundaries.'],
 ['06 · Platform differences','Dianping’s coordinate system is unconfirmed, so it is not mapped. Its district sample is uneven and is not added to AMap counts. Interface labels are bilingual; original merchant names and addresses stay in Chinese.'],
 ['07 · Categories & brands','Ten services follow the original AMap classification. Human healthcare includes hospitals, clinics and pharmacies. Entertainment subtypes use name keywords; ambiguous and multiple matches are retained for review. Brand names are clues, not verified ownership.'],
 ['08 · Limits & provenance','Collection date is unconfirmed. Seasonal or ambiguous schedules are marked unknown; dated exceptions are ignored when a regular schedule is available. Tourism explanations need separate evidence. All figures derive from the supplied cleaned tables.']
 ]:[
 ['01 · 样本来自哪里','高德清洗后87,792条；十类展示82,425家，其中餐饮24,985家。默认优先展示餐饮。大众点评餐饮6,888条。'],
 ['02 · “营业”如何判断','根据标注营业时间推算，不是实时到店核验。区间含开始、不含结束；跨午夜同时检查当天与前一天延续的营业时段。'],
 ['03 · 两个可比较的夜晚','周三21:00—周四05:00，对比周六21:00—周日05:00。同样本比较要求双夜18个时点均可判断，不指某个具体日期。'],
 ['04 · 未知不等于关闭','数据提供前已删除营业时间缺失商家。无法解析、未列星期等保留未知；不能由现有表还原全市覆盖率。'],
 ['05 · 坐标与网格','高德坐标为GCJ-02。缺坐标商家保留在数量统计，排除在地图之外。约1或3km²网格为局部平面近似，不是行政区精确边界。'],
 ['06 · 两个平台分别使用','点评坐标系未确认，不进入主地图；各区样本差异较大，不与高德直接相加。界面提供中英切换，原始商家名和地址保留中文。'],
 ['07 · 类别与品牌识别','十类服务沿用高德原分类。医药服务包含医院、诊所、药店等。娱乐细分依据店名关键词；多重命中与未识别分别保留待核实。品牌线索不代表已核实连锁关系。'],
 ['08 · 分析边界','采集日期待补充。季节性、复杂或冲突时间标为未知；有常规时段时忽略日期例外。旅游原因需要另补证据；所有数量来自已提供的清洗表。']
 ];
 $('#methodCards').innerHTML=cards.map(([a,b])=>`<article class="panel"><h3>${a}</h3><p>${b}</p></article>`).join('');
 $('#guideSteps').innerHTML=guideHTML().replace(/^<ol>|<\/ol>$/g,'');$('#inlineGuide').innerHTML=guideHTML();
}
function translate(){
 document.documentElement.lang=en()?'en':'zh-CN';document.title=en()?'Changsha After Dark · What stays open at 3 AM?':'凌晨三点，长沙还醒着吗？ · 长沙夜生活地图';
 $$('[data-i18n]').forEach(el=>el.innerHTML=t(el.dataset.i18n));$('#language').textContent=en()?'中文 ↗':'EN ↗';$('#search').placeholder=t('search');$('#hour').setAttribute('aria-label',en()?'Night hour':'夜间整点');$('#play').setAttribute('aria-label',en()?'Play or pause timeline':'播放或暂停时间');
 setOptions();methods();update();
}
function bar(label,count,total,color){return `<div class="bar-row"><div class="bar-top"><span>${esc(label)}</span><span>${fmt(count)}</span></div><div class="bar-track"><div class="bar-fill" style="width:${total?count/total*100:0}%;background:${color}"></div></div></div>`;}
function lineChart(series,{percent=false,selected=true}={}){
 const compact=matchMedia('(max-width:760px)').matches;
 const width=compact?360:600,height=230,l=compact?43:51,r=compact?12:17,top=15,bottom=33,pw=width-l-r,ph=height-top-bottom;
 const vals=series.flatMap(s=>s.values.filter(v=>v!==null));const max=percent?1:(vals.some(v=>v>0)?Math.max(...vals)*1.08:1);
 let svg=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${en()?'Hourly data chart':'逐小时数据图'}">`;
 for(let j=0;j<=4;j++){const y=top+ph*j/4,v=max*(1-j/4);svg+=`<line x1="${l}" x2="${width-r}" y1="${y}" y2="${y}" stroke="#344052" stroke-dasharray="3 5"/><text x="${l-10}" y="${y+4}" fill="#9ba7b6" font-size="10" text-anchor="end">${percent?Math.round(v*100)+'%':fmt(Math.round(v))}</text>`;}
 if(selected){const x=l+state.hour*pw/8;svg+=`<line x1="${x}" x2="${x}" y1="${top}" y2="${top+ph}" stroke="#eeeae2" stroke-opacity=".25"/>`;}
 for(let i=0;i<9;i++){if(compact&&i%2)continue;svg+=`<text x="${l+i*pw/8}" y="${height-8}" fill="${i===state.hour?'#f3a66d':'#9ba7b6'}" font-size="10" text-anchor="middle">${hourText(i)}</text>`;}
 series.forEach(s=>{let path='';s.values.forEach((v,i)=>{if(v===null){path+=' ';return;}const x=l+i*pw/8,y=top+ph*(1-v/max);path+=`${i===0||s.values[i-1]===null?'M':'L'}${x.toFixed(2)},${y.toFixed(2)} `;});svg+=`<path d="${path.trim()}" fill="none" stroke="${s.color}" stroke-width="2.3"/>`;s.values.forEach((v,i)=>{if(v!==null)svg+=`<circle cx="${l+i*pw/8}" cy="${top+ph*(1-v/max)}" r="${i===state.hour?4:2}" fill="${s.color}"><title>${esc(s.name)} · ${hourText(i)}: ${percent?pct(v):fmt(v)}</title></circle>`;});});
 return svg+'</svg>';
}
let visibleOpen=[],mapPointRows=[];
function update(){
 const rows=filtered(),open=rows.filter(opened),known=rows.filter(r=>r[10+state.night][state.hour]!==-1),unknown=rows.length-known.length,geocoded=open.filter(r=>r[4]!==null&&r[5]!==null),baseline=rows.filter(r=>r[10+state.night][0]===1).length;
 const labels=en()?['Open at '+hourText(state.hour),'Share of known records','Compared with 21:00','Geocoded open businesses']:['当前标注营业','占可判断样本比例','相对21点营业数量','可定位营业商家'];
 const vals=[fmt(open.length),known.length?pct(open.length/known.length):'—',baseline?pct(open.length/baseline):'—',fmt(geocoded.length)];
 const feet=en()?['Scheduled hours, not live status',`${fmt(unknown)} unknown at this hour`,'May include newly opened shops',`${fmt(open.length-geocoded.length)} open records lack coordinates`]:['按营业时间推算，非实时核验',`${fmt(unknown)} 家此时段未知`,'可能包含后期开门商家',`${fmt(open.length-geocoded.length)} 家营业商家缺坐标`];
 const conflictCount=rows.filter(statusConflict).length;
 $('#statusNotice').textContent=en()?`Data review: ${fmt(conflictCount)} records in this selection have closure / relocation words in their names. Records are retained and counts follow reported hours, matching the workbook. Status conflicts are flagged; verify before visiting.`:`数据核验提醒：当前筛选中 ${fmt(conflictCount)} 家名称含暂停营业／已关闭／搬迁等字样。已保留并标注状态冲突，数量沿用表格营业时间，与Excel保持一致。到店前请核实。`;
 $('#kpis').innerHTML=labels.map((l,i)=>`<div class="kpi"><div class="kpi-label">${l}</div><div class="kpi-value">${vals[i]}${[0,3].includes(i)?`<small>${t('stores')}</small>`:''}</div><div class="kpi-foot">${feet[i]}</div></div>`).join('');
 $('#timeBadge').textContent=hourText(state.hour);$('#largeTime').innerHTML=hourText(state.hour).replace(':','<span>:')+'</span>';$('#hour').value=state.hour;
 $('#nightRange').textContent=state.night?(en()?'Sat 21:00 → Sun 05:00':'周六21:00 → 周日05:00'):(en()?'Wed 21:00 → Thu 05:00':'周三21:00 → 周四05:00');
 $('#hourLabels').innerHTML=D.hours.map((_,i)=>`<button data-hour="${i}" class="${i===state.hour?'active':''}">${hourText(i)}</button>`).join('');
 const serviceOpen=filtered(false,true).filter(opened);
 $('#composition').innerHTML=[3,0,1,2,4,5,6,7,8,9].map(i=>`<button class="service-bar ${state.category===i?'selected':''}" data-service="${i}">${bar(cname(i),serviceOpen.filter(r=>r[3]===i).length,serviceOpen.length,COLORS[i])}</button>`).join('');
 $('#compositionScope').textContent=en()?'All 10 services in this district at this hour. Click a category to explore; bar lengths use the 10-service total.':'当前区域、时点的十类服务总览；点击类别切换。条形以十类营业合计为分母。';
 $('#subtypeField').hidden=state.category!==4;
 $('#legend').innerHTML=state.mode==='points'?COLORS.flatMap((c,i)=>state.category<0||state.category===i?[`<span><i class="dot" style="background:${c}"></i>${cname(i)}</span>`]:[]).join(''):`<span><i class="dot orange"></i>${en()?'Color = open-business count · Click a grid for details':'颜色深浅表示营业数量 · 点击网格查看详情'}</span>`;
 $('#mapStatus').textContent=mapReady?t('connected'):(mapLoading?t('loading'):t('notConnected'));$('#mapStatus').classList.toggle('ready',mapReady);
 const query=state.search.toLowerCase().trim();visibleOpen=open.filter(r=>!query||(r[1]+' '+r[6]).toLowerCase().includes(query)).sort((a,b)=>a[1].localeCompare(b[1],'zh-CN'));
 mapPointRows=visibleOpen.filter(r=>r[4]!==null&&r[5]!==null);
 $('#listCount').textContent=fmt(visibleOpen.length)+(en()?' results':' 家');
 $('#merchantList').innerHTML=visibleOpen.slice(0,30).map(r=>`<button class="merchant" data-id="${r[0]}"><strong>${esc(r[1])}</strong><span><i class="dot" style="background:${COLORS[r[3]]}"></i>${dname(r[2])} · ${cname(r[3])}${r[4]===null?(en()?' · No location':' · 缺坐标'):''}${statusConflict(r)?(en()?' · Status conflict':' · 状态待核实'):''}</span></button>`).join('')||`<p class="empty-list">${t('noResults')}</p>`;
 $('#scopeNote').textContent=en()?`Counts use ${fmt(rows.length)} retained records under the district/service filters. Map points show ${fmt(mapPointRows.length)} open geocoded records after search. Unknown schedules are not treated as closed. Source: AMap; collection date unconfirmed.`:`当前区域／服务筛选包含 ${fmt(rows.length)} 家样本；搜索后点位图可展示 ${fmt(mapPointRows.length)} 家营业商家。未知时段不计为关闭。来源：高德；采集日期待补充。`;
 $('#gridControls').hidden=state.mode!=='grid';
 updateAnalysis(rows,open);updateMap();if(window.renderStory)window.renderStory();
}
function updateAnalysis(rows,open){
 const pair=rows.filter(validPair),curves=[0,1].map(n=>D.hours.map((_,i)=>pair.filter(r=>r[10+n][i]===1).length));
 $('#trendChart').innerHTML=lineChart(curves.map((v,i)=>({name:t(i?'weekendShort':'weekdayShort'),values:v,color:i?COLORS[1]:COLORS[3]})));
 const a=curves[0][state.hour],b=curves[1][state.hour],delta=b-a;
 $('#pairedInsight').textContent=en()?`${fmt(pair.length)} paired records · At ${hourText(state.hour)}, Sat ${delta>=0?'+':''}${fmt(delta)} vs Wed${a?' ('+(delta>=0?'+':'')+pct(delta/a)+')':''}.`:`同样本 ${fmt(pair.length)} 家 · ${hourText(state.hour)} 周末比工作日 ${delta>=0?'多':'少'} ${fmt(Math.abs(delta))} 家${a?'（'+(delta>=0?'+':'')+pct(delta/a)+'）':''}。`;
 const ret=COLORS.map((color,c)=>{const ss=pair.filter(r=>r[3]===c&&r[10+state.night][0]===1);return {name:cname(c),color,values:D.hours.map((_,i)=>ss.length?ss.filter(r=>r[10+state.night][i]===1).length/ss.length:null)};});
 $('#retentionChart').innerHTML=lineChart(ret,{percent:true});$('#retentionLegend').innerHTML=ret.filter((_,c)=>state.category<0||c===state.category).map(s=>`<span><i class="dot" style="background:${s.color}"></i>${s.name}</span>`).join('');
 const ds=filtered(true).filter(opened);const counts=D.districts.map((_,i)=>ds.filter(r=>r[2]===i).length),max=Math.max(1,...counts);
 $('#districtChart').innerHTML=counts.map((v,i)=>`<div class="district-bar"><span>${dname(i)}</span><div class="bar-track"><div class="bar-fill" style="background:${state.district===i?COLORS[3]:'#6b809f'};width:${v/max*100}%"></div></div><span class="number">${fmt(v)}</span></div>`).join('');
 const spatial=spatialSeries(rows),sp=spatial[state.hour];
 $('#spaceStats').innerHTML=`<div class="space-metrics"><div><strong>${sp.hhi===null?'—':sp.hhi.toFixed(4)}</strong><span>HHI</span></div><div><strong>${fmt(sp.occupied)}</strong><span>${en()?'Occupied grids':'营业网格数'}</span></div><div><strong>${sp.top===null?'—':pct(sp.top)}</strong><span>${en()?'Top 10% grid share':'前10%网格商家占比'}</span></div></div>`;
 $('#spaceChart').innerHTML=lineChart([{name:'HHI',values:spatial.map(r=>r.hhi),color:COLORS[3]}]);
 // HHI needs decimal axis labels instead of integer rounding.
 const svg=$('#spaceChart svg');const ticks=[...svg.querySelectorAll('text')].slice(0,5),sm=(Math.max(...spatial.map(r=>r.hhi||0))||1)*1.08;ticks.forEach((el,i)=>el.textContent=(sm*(1-i/4)).toFixed(3));
 const bc=['品牌关键词命中','同名多店候选','未识别'],bl=en()?['Brand keyword match','Repeated-name candidate','Unidentified']:bc;
 $('#brandBars').innerHTML=bc.map((v,i)=>bar(bl[i],open.filter(r=>r[9]===v).length,open.length,[COLORS[3],COLORS[1],'#657285'][i])).join('');
 const kw=['茶颜悦色','金色印象','黑色经典','小龙虾'];
 $('#funFacts').innerHTML=kw.map((v,i)=>{const rr=D.tables['特色关键词'].rows.find(r=>r[0]===v&&r[2]===nightName()&&r[3]===(state.district<0?'六区合计':D.districts[state.district]));const label=en()?['Chayan Yuese · 茶颜悦色','Golden Impression · 金色印象','Black Classic · 黑色经典','Crayfish · 小龙虾'][i]:v;return `<div class="fun-row">${label}<span>${fmt(rr[5+state.hour])}</span></div>`;}).join('');
}
const spatialCache=new Map();
function spatialSeries(rows){
 const key=[state.district,state.category,state.subtype,state.night].join('|');if(spatialCache.has(key))return spatialCache.get(key);
 const universe=new Set(rows.filter(r=>r[4]!==null&&r[12]).map(r=>r[12]));
 const fixed=rows.filter(r=>r[4]!==null&&r[12]&&r[10+state.night].every(v=>v!==-1));
 const result=D.hours.map((_,i)=>{const counts=new Map();for(const r of fixed)if(r[10+state.night][i]===1)counts.set(r[12],(counts.get(r[12])||0)+1);const values=[...counts.values()].sort((a,b)=>b-a),total=values.reduce((a,b)=>a+b,0),k=Math.max(1,Math.ceil(universe.size*.1));return {occupied:counts.size,hhi:total?values.reduce((s,v)=>s+(v/total)**2,0):null,top:total?values.slice(0,k).reduce((a,b)=>a+b,0)/total:null};});
 spatialCache.set(key,result);return result;
}
function showDetail(id){
 const r=D.records.find(x=>x[0]===Number(id));if(!r)return;
 const labs=en()?['District','Service','Address','Reported hours','Source row','Location']:['行政区','服务类别','地址','原营业时间','高德来源行','定位'];
 $('#merchantDetail').innerHTML=`<p class="eyebrow">${hourText(state.hour)} / ${en()?'REPORTED OPEN':'标注营业'}</p><h2>${esc(r[1])}</h2>${statusConflict(r)?`<p class="status-notice">${en()?'Name indicates a closure or relocation status. Opening hours may be stale; verify before visiting.':'名称提示停业或搬迁状态，营业时间可能已过期，到店前请核实。'}</p>`:''}<div class="detail-meta">${[dname(r[2]),cname(r[3]),r[6],r[7],r[0],r[4]===null?t('coordinateMissing'):`GCJ-02 · ${r[4]}, ${r[5]}`].map((v,i)=>`<p>${labs[i]}<br><strong>${esc(v)}</strong></p>`).join('')}</div>`;
 if(r[4]!==null&&mapReady)map.setZoomAndCenter(16,[r[4],r[5]]);
 $('#detailDialog').showModal();
}
function gridCenter(key,size){const [,x,y]=key.split('_');return [112+(Number(x)+.5)*size/(6371.0088*Math.cos(28.2*Math.PI/180))*180/Math.PI,27+(Number(y)+.5)*size/6371.0088*180/Math.PI];}
function updateMap(){
 if(!mapReady)return;
 if(polygons.length){map.remove(polygons);polygons=[];}
 if(state.mode==='points'){
  mass.setData(mapPointRows.map(r=>({lnglat:[r[4],r[5]],style:r[3],id:r[0]})));mass.show();
 }else{
  mass.hide();const counts=new Map(),size=state.size===1?1:Math.sqrt(3),idx=state.size===1?12:13;
  for(const r of filtered())if(r[4]!==null&&r[10+state.night].every(v=>v!==-1)&&opened(r)){const key=r[idx];if(!key)continue;if(!counts.has(key))counts.set(key,{total:0,types:new Set()});const c=counts.get(key);c.total++;c.types.add(r[3]);}
  const max=Math.max(1,...[...counts.values()].map(c=>c.total));
  for(const [key,c] of counts){const [lon,lat]=gridCenter(key,size),dx=size/2/(6371.0088*Math.cos(28.2*Math.PI/180))*180/Math.PI,dy=size/2/6371.0088*180/Math.PI;
   const p=new AMap.Polygon({path:[[lon-dx,lat-dy],[lon+dx,lat-dy],[lon+dx,lat+dy],[lon-dx,lat+dy]],strokeColor:'#f3a66d',strokeOpacity:.45,strokeWeight:1,fillColor:'#f3a66d',fillOpacity:.15+.65*Math.sqrt(c.total/max),zIndex:80});
   p.on('click',()=>toast(`${key} · ${t('gridToast')}: ${fmt(c.total)} · ${t('gridTypes')}: ${c.types.size}`));polygons.push(p);
  }map.add(polygons);
 }
}
function loadScript(url){return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.onload=resolve;script.onerror=()=>reject(new Error('network'));document.head.appendChild(script);});}
async function connectMap(event){
 event.preventDefault();if(mapLoading)return;
 const key=$('#amapKey').value.trim(),code=$('#amapCode').value.trim(),proxy=$('#amapProxy').value.trim();
 if(!code&&!proxy){$('#configMessage').textContent=t('needSecurity');return;}
 if(mapReady){toast(en()?'Reload the page to change map credentials.':'更换地图配置请先刷新页面。');return;}
 mapLoading=true;$('#submitConfig').disabled=true;$('#configMessage').textContent=t('loading');update();
 try{
  window._AMapSecurityConfig=proxy?{serviceHost:proxy}:{securityJsCode:code};
  if(!window.AMapLoader)await Promise.race([loadScript('https://webapi.amap.com/loader.js'),new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),20000))]);
  const A=await Promise.race([window.AMapLoader.load({key,version:'2.0',plugins:['AMap.Scale']}),new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),20000))]);
  if(map)map.destroy();
  map=new A.Map('map',{zoom:11,center:[112.98,28.20],mapStyle:'amap://styles/darkblue',lang:en()?'en':'zh_cn',viewMode:'2D',resizeEnable:true});
  cityBounds=new A.Bounds([cityExtent[0],cityExtent[1]],[cityExtent[2],cityExtent[3]]);
  map.setBounds(cityBounds,true,[16,16,16,16]);
  cityMinZoom=map.getZoom();
  const initial=map.getBounds(),sw=initial.getSouthWest(),ne=initial.getNorthEast();
  cityView=[sw.getLng(),sw.getLat(),ne.getLng(),ne.getLat()];
  map.setZooms([cityMinZoom,20]);
  map.setLimitBounds(cityBounds);
  map.on('zoomend',syncZoomControls);
  map.on('moveend',constrainCityView);map.on('zoomend',constrainCityView);map.on('resize',constrainCityView);
  map.addControl(new A.Scale());
  mass=new A.MassMarks([],{opacity:.92,zIndex:120,cursor:'pointer',style:COLORS.map((_,i)=>({url:new URL(`point-3.svg`,location.href).href,anchor:new A.Pixel(4,4),size:new A.Size(8,8)}))});
  mass.on('click',e=>showDetail(e.data.id));mass.setMap(map);
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('tiles-timeout')),20000);map.on('complete',()=>{clearTimeout(timer);resolve();});});
  mapReady=true;syncZoomControls();$('#mapEmpty').hidden=true;$('#configDialog').close();$('#configMessage').textContent='';$('#amapKey').value='';$('#amapCode').value='';$('#amapProxy').value='';toast(t('connected'));
 }catch(err){$('#configMessage').textContent=t('mapError');$('#mapEmpty').hidden=false;if(map){map.destroy();map=null;}mapReady=false;}
 finally{mapLoading=false;$('#submitConfig').disabled=false;update();}
}
function changeTab(tab){
 if(window.scrollStoryTo){window.scrollStoryTo(tab);return;}
 state.tab=tab;$$('.tab-panel').forEach(el=>el.hidden=el.id!==tab);$$('.nav').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
 // A single shared time control follows the active content, keeping comparisons interactive.
 const timeline=$('.timeline');if(tab==='analysis')$('#analysis .section-heading').after(timeline);else if(tab==='explore')$('#explore .scope-note').before(timeline);timeline.hidden=tab==='method';
 if(tab!=='explore'&&playTimer)stopPlay();if(tab==='explore'&&mapReady)setTimeout(()=>map.resize(),30);
}
function stopPlay(){clearInterval(playTimer);playTimer=null;$('#play').textContent='▶';}
function openConfig(){if(mapReady){toast(en()?'AMap is already connected. Reload to change credentials.':'地图已连接；更换配置可刷新后重新填写。');return;}$('#configDialog').showModal();}
$$('.nav').forEach(b=>b.onclick=()=>changeTab(b.dataset.tab));
$('#language').onclick=()=>{state.lang=en()?'zh':'en';translate();};
$$('[data-night]').forEach(b=>b.onclick=()=>{state.night=Number(b.dataset.night);$$('[data-night]').forEach(x=>x.classList.toggle('active',x===b));update();});
$('#district').onchange=e=>{state.district=Number(e.target.value);update();};$('#category').onchange=e=>{state.category=Number(e.target.value);state.subtype='';$('#entertainmentSubtype').value='';update();};
$('#entertainmentSubtype').onchange=e=>{state.subtype=e.target.value;update();};
$('#composition').onclick=e=>{const b=e.target.closest('[data-service]');if(b){state.category=Number(b.dataset.service);state.subtype='';setOptions();update();}};
$('#reset').onclick=()=>{state.district=-1;state.category=3;state.subtype='';state.search='';$('#search').value='';setOptions();update();};
$('#hour').oninput=e=>{stopPlay();state.hour=Number(e.target.value);update();};
$('#hourLabels').onclick=e=>{const b=e.target.closest('[data-hour]');if(b){stopPlay();state.hour=Number(b.dataset.hour);update();}};
$('#play').onclick=()=>{if(playTimer){stopPlay();return;}$('#play').textContent='Ⅱ';playTimer=setInterval(()=>{state.hour=(state.hour+1)%9;update();},1500);};
$('#search').oninput=e=>{state.search=e.target.value;update();};$('#merchantList').onclick=e=>{const b=e.target.closest('[data-id]');if(b)showDetail(b.dataset.id);};
$$('[data-mode]').forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;$$('[data-mode]').forEach(x=>x.classList.toggle('active',x===b));update();});
$('#gridSize').onchange=e=>{state.size=Number(e.target.value);update();};
$('#zoomIn').onclick=()=>{if(mapReady)map.setZoom(Math.min(20,map.getZoom()+1),true);};
$('#zoomOut').onclick=()=>{if(mapReady)map.setZoom(Math.max(cityMinZoom,map.getZoom()-1),true);};
$('#connect').onclick=openConfig;$('#connectEmpty').onclick=openConfig;
$('#guideOpen').onclick=()=>{openConfig();$('#inlineGuide').hidden=false;};$('#dialogGuide').onclick=()=>$('#inlineGuide').hidden=!$('#inlineGuide').hidden;
$('#configClose').onclick=()=>$('#configDialog').close();$('#detailClose').onclick=()=>$('#detailDialog').close();$('#configForm').onsubmit=connectMap;
$('#fit').onclick=()=>{if(!mapReady){openConfig();return;}if(!mapPointRows.length){toast(t('noPoints'));return;}let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;mapPointRows.forEach(r=>{minX=Math.min(minX,r[4]);maxX=Math.max(maxX,r[4]);minY=Math.min(minY,r[5]);maxY=Math.max(maxY,r[5]);});if(minX===maxX&&minY===maxY)map.setZoomAndCenter(15,[minX,minY]);else map.setBounds(new AMap.Bounds([minX,minY],[maxX,maxY]),false,[45,45,45,45]);};
translate();
