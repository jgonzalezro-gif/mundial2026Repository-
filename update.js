const fs = require('fs');

const OPEN_WORLD_CUP_URL = 'https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main/football.matches.json';
const THESPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/123';
const BASE_FILE = 'data.json';

function norm(x){return String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim()}
const ALIAS={'mexico':'México','south africa':'Sudáfrica','rsa':'Sudáfrica','korea republic':'Corea del Sur','south korea':'Corea del Sur','czechia':'República Checa','czech republic':'República Checa','canada':'Canadá','bosnia and herzegovina':'Bosnia y Herzegovina','bosnia herzegovina':'Bosnia y Herzegovina','qatar':'Qatar','switzerland':'Suiza','brazil':'Brasil','morocco':'Marruecos','haiti':'Haití','scotland':'Escocia','usa':'Estados Unidos','united states':'Estados Unidos','united states of america':'Estados Unidos','paraguay':'Paraguay','australia':'Australia','turkiye':'Turquía','turkey':'Turquía','germany':'Alemania','curacao':'Curazao','cote divoire':'Costa de Marfil','ivory coast':'Costa de Marfil','ecuador':'Ecuador','netherlands':'Países Bajos','holland':'Países Bajos','japan':'Japón','sweden':'Suecia','tunisia':'Túnez','belgium':'Bélgica','egypt':'Egipto','iran':'Irán','ir iran':'Irán','new zealand':'Nueva Zelanda','spain':'España','cabo verde':'Cabo Verde','cape verde':'Cabo Verde','saudi arabia':'Arabia Saudita','uruguay':'Uruguay','france':'Francia','senegal':'Senegal','iraq':'Irak','norway':'Noruega','argentina':'Argentina','algeria':'Argelia','austria':'Austria','jordan':'Jordania','portugal':'Portugal','dr congo':'RD Congo','congo dr':'RD Congo','congo d r':'RD Congo','uzbekistan':'Uzbekistán','colombia':'Colombia','england':'Inglaterra','croatia':'Croacia','ghana':'Ghana','panama':'Panamá'};
function canon(x){let n=norm(x);return ALIAS[n]||x}
function num(v){if(v===undefined||v===null||v==='')return null;let n=Number(v);return Number.isFinite(n)?n:null}
function fin(x){let s=norm(x);return !s||['ft','finished','final','fulltime','aet','after penalties','ft pen'].some(v=>s.includes(v))}
function extract(data){if(Array.isArray(data))return data;if(data&&Array.isArray(data.matches))return data.matches;if(data&&Array.isArray(data.games))return data.games;if(data&&Array.isArray(data.events))return data.events;if(data&&Array.isArray(data.event))return data.event;if(data&&Array.isArray(data.response))return data.response;if(data&&data.data&&Array.isArray(data.data))return data.data;let a=[];if(data&&typeof data==='object')Object.values(data).forEach(v=>{if(Array.isArray(v))v.forEach(x=>a.push(x))});return a}
function parseMatch(it,src){if(Array.isArray(it))return{h:canon(it[0]),a:canon(it[1]),hg:num(it[2]),ag:num(it[3]),status:'array',src};let h=it.home_team||it.homeTeam||it.home||it.strHomeTeam||it.team1||it.home_name||it.homeTeamName;let a=it.away_team||it.awayTeam||it.away||it.strAwayTeam||it.team2||it.away_name||it.awayTeamName;let hg=it.home_score??it.homeScore??it.intHomeScore??it.score_home??it.goals_home??it?.score?.home;let ag=it.away_score??it.awayScore??it.intAwayScore??it.score_away??it.goals_away??it?.score?.away;let sc=it.score||it.result||it.final_score||it.strResult;if((hg===undefined||ag===undefined)&&typeof sc==='string'){let m=sc.match(/(\d+)\s*[-:]\s*(\d+)/);if(m){hg=m[1];ag=m[2]}}let status=it.status||it.match_status||it.phase||it.strStatus||it.status_short||it.state||'';return{h:canon(h),a:canon(a),hg:num(hg),ag:num(ag),status,src}}
async function getJSON(url){let r=await fetch(url,{headers:{'User-Agent':'Mundial2026GitHubAction/1.0'}});if(!r.ok)throw new Error('HTTP '+r.status+' '+url);return await r.json()}
function mergeIntoData(data, apiData, src){let updated=0;extract(apiData).forEach(raw=>{let m=parseMatch(raw,src);if(!m.h||!m.a||m.hg===null||m.ag===null)return;if(m.status!=='array'&&!fin(m.status))return;Object.keys(data.matches).forEach(g=>{let i=data.matches[g].findIndex(x=>(norm(x[0])===norm(m.h)&&norm(x[1])===norm(m.a))||(norm(x[0])===norm(m.a)&&norm(x[1])===norm(m.h)));if(i>=0){if(norm(data.matches[g][i][0])===norm(m.h)){data.matches[g][i][2]=m.hg;data.matches[g][i][3]=m.ag}else{data.matches[g][i][2]=m.ag;data.matches[g][i][3]=m.hg}data.matches[g][i][4]=src;updated++}})});return updated}
async function main(){
  let data = JSON.parse(fs.readFileSync(BASE_FILE,'utf8'));
  let logs=[]; let total=0;
  try{let j=await getJSON(OPEN_WORLD_CUP_URL+'?ts='+Date.now());let n=mergeIntoData(data,j,'OpenWorldCup2026');total+=n;logs.push({ok:true,msg:'OpenWorldCup2026 consultado. Marcadores aplicados: '+n});}catch(e){logs.push({ok:false,msg:'OpenWorldCup2026 falló: '+e.message});}
  try{
    let leagues=await getJSON(THESPORTSDB_BASE+'/all_leagues.php');
    let league=(leagues.leagues||[]).find(l=>norm(l.strLeague).includes('fifa world cup'))||(leagues.leagues||[]).find(l=>norm(l.strLeague).includes('world cup'));
    if(league&&league.idLeague){
      let urls=[THESPORTSDB_BASE+'/eventsseason.php?id='+league.idLeague+'&s=2026',THESPORTSDB_BASE+'/eventspastleague.php?id='+league.idLeague,THESPORTSDB_BASE+'/eventsnextleague.php?id='+league.idLeague];
      let tn=0;
      for(const u of urls){try{tn+=mergeIntoData(data,await getJSON(u),'TheSportsDB')}catch(e){logs.push({ok:false,msg:'TheSportsDB endpoint falló: '+e.message})}}
      total+=tn;logs.push({ok:true,msg:'TheSportsDB consultado. Marcadores aplicados: '+tn});
    }else logs.push({ok:false,msg:'TheSportsDB: no se encontró liga FIFA World Cup'});
  }catch(e){logs.push({ok:false,msg:'TheSportsDB falló: '+e.message});}
  data.updatedAt = new Date().toISOString();
  data.source = 'GitHub Actions automático. Total de marcadores aplicados en esta ejecución: '+total;
  data.logs = logs;
  fs.writeFileSync(BASE_FILE, JSON.stringify(data,null,2));
  console.log('data.json actualizado. Total aplicado:', total);
}
main().catch(e=>{console.error(e);process.exit(1)});
