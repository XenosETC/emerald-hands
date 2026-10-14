import {reviveDestination,WORLDS} from './core.js';
export function reviveGuidance(s){
 const destination=reviveDestination(s),world=WORLDS.find(w=>w.id===s.world).name;
 const label=destination==='cleared-arena'?'Recover in the cleared arena →':destination==='shrine'?'Return to the echo shrine →':'Return to Kek Academy →';
 const detail=destination==='cleared-arena'?'Your guardian victory remains. Uncollected arena rewards stay available.':destination==='shrine'?s.zone==='arena'?'Return to the '+world+' shrine approach. Your guardian attempt resets; cleared patrols remain.':'Return to the '+world+' shrine. Cleared patrols and uncollected ground rewards remain; surviving enemies recover.':s.world==='academy'?'Recover beside Goribbit at Kek Academy.':'No shrine attuned here. Recover at Kek Academy; this realm’s patrol resets.';
 return {destination,label,text:detail+' Recover with full health and Spirit. Earned XP, fragments, items, seals and quest progress stay with you.'};
}
