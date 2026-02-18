const fs=require('fs');
const path=require('path');
const {createClient}=require('@supabase/supabase-js');

function env(){const o={};for(const l of fs.readFileSync('.env.local','utf8').split(/\r?\n/)){if(!l||l.trim().startsWith('#')||!l.includes('='))continue;const i=l.indexOf('=');let v=l.slice(i+1).trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);o[l.slice(0,i).trim()]=v;}return o;}

function norm(s=''){return s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function titleEq(a,b){return norm(a)===norm(b);}

const REQUEST_ADD=[
  'Red Wine','Sweet Almond Oil','Grape Seed Oil','Avocado Oil','Jojoba Oil','SCI Powder','CAPB','Flax Seeds','Sambar Onion Powder','Rose Essential Oil','Rosemary Essential Oil'
];
const REMOVE_EXACT=['Coffee Powder','Flax Seeds'];

async function main(){
  const e=env();
  const sup=createClient(e.NEXT_PUBLIC_SUPABASE_URL,e.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});

  const {data:all,error}=await sup.from('products').select('id,product_id,title_en,title_te,current_price,mrp,unit_value,unit_type,is_active,image_url,created_at').order('created_at',{ascending:true});
  if(error) throw error;

  const byTitle=(t)=>all.filter(p=>titleEq(p.title_en,t));
  const updates=[];
  const additions=[];
  const removals=[];
  const dedupes=[];

  // Add-if-missing with alias normalization
  const aliases={
    'Grape Seed Oil':['Grapeseed Oil'],
    'CAPB':['Coco Betaine'],
    'Sambar Onion Powder':['Sambar Onions'],
    'Rose Essential Oil':['Rose Essential Oil'],
    'Sweet Almond Oil':['Sweet Almond Oil'],
    'Red Wine':['Red Wine'],
    'Avocado Oil':['Avocado Oil'],
    'Jojoba Oil':['Jojoba Oil'],
    'SCI Powder':['SCI Powder'],
    'Rosemary Essential Oil':['Rosemary Essential Oil'],
    'Flax Seeds':['Flax Seeds','Flax Seeds Powder'],
  };

  function existsByNames(names){
    return all.find(p=>names.some(n=>titleEq(p.title_en,n)));
  }

  // clean naming for existing aliased records requested as add
  const renameTargets=[
    {from:'Grapeseed Oil',to:'Grape Seed Oil'},
    {from:'Sambar Onions',to:'Sambar Onion Powder'},
  ];
  for(const r of renameTargets){
    const rec=all.find(p=>titleEq(p.title_en,r.from));
    if(rec){
      await sup.from('products').update({title_en:r.to,updated_at:new Date().toISOString()}).eq('id',rec.id);
      updates.push({product_id:rec.product_id,field:'title_en',from:r.from,to:r.to});
      rec.title_en=r.to;
    }
  }

  // add new products that truly do not exist after alias checks, excluding Flax Seeds due remove directive
  const seedAdds=[
    {title_en:'SCI Powder', title_te:'?????? ?????', unit_value:50, unit_type:'gm', mrp:199, current_price:150, shipping_charges:70, stock_quantity:100},
    {title_en:'CAPB', title_te:'???????', unit_value:100, unit_type:'ml', mrp:99, current_price:70, shipping_charges:70, stock_quantity:100},
    {title_en:'Rosemary Essential Oil', title_te:'???????? ?????????? ?????', unit_value:15, unit_type:'ml', mrp:249, current_price:200, shipping_charges:70, stock_quantity:100}
  ];
  for(const a of seedAdds){
    const found=existsByNames([a.title_en]);
    if(!found){
      // create unique product_id prefix BC
      const ids=all.map(p=>p.product_id).filter(pid=>/^BC\d+$/.test(pid)).map(pid=>parseInt(pid.slice(2),10));
      let n=Math.max(...ids,0)+1; let pid='';
      do{pid=`BC${String(n).padStart(3,'0')}`; n++;}while(all.some(p=>p.product_id===pid));

      const row={
        product_id:pid,
        title_en:a.title_en,
        title_te:a.title_te,
        description_en:`${a.title_en} for cosmetic and personal-care formulations.`,
        description_te:`${a.title_te} ?????????? ??????? ?????????????.`,
        specifications_en:`${a.unit_value} ${a.unit_type}`,
        specifications_te:null,
        usage_en:'Use as per formulation requirement.',
        usage_te:null,
        image_url:null,
        additional_images:null,
        mrp:a.mrp,
        current_price:a.current_price,
        shipping_charges:a.shipping_charges,
        stock_quantity:a.stock_quantity,
        is_active:true,
        is_best_seller:false,
        is_new:true,
        unit_value:a.unit_value,
        unit_type:a.unit_type
      };
      const {data:ins,error:insErr}=await sup.from('products').insert(row).select('id,product_id,title_en').single();
      if(insErr) throw insErr;
      additions.push(ins);
      all.push({...row,id:ins.id,created_at:new Date().toISOString()});
    }
  }

  // Remove specified products completely (exact match)
  const toRemove=all.filter(p=>REMOVE_EXACT.some(t=>titleEq(p.title_en,t)));
  if(toRemove.length){
    const removeIds=toRemove.map(p=>p.id);

    // cleanup dependent tables likely referencing product_id UUID
    const maybeTables=['product_sections','reviews','cart_items','wishlist','recently_viewed_products','recently_viewed'];
    for(const tbl of maybeTables){
      const res=await sup.from(tbl).delete().in('product_id',removeIds);
      if(res.error && !String(res.error.message||'').includes('relation') && !String(res.error.message||'').includes('does not exist')){
        // ignore non-existing tables only
      }
    }

    const {error:delErr}=await sup.from('products').delete().in('id',removeIds);
    if(delErr) throw delErr;
    removals.push(...toRemove.map(p=>({product_id:p.product_id,title_en:p.title_en})));
  }

  // Remove duplicate Dalchini Chekka Powder / Dalchini Chekka (keep oldest)
  const dalchini=all.filter(p=>titleEq(p.title_en,'Dalchini Chekka Powder')||titleEq(p.title_en,'Dalchini Chekka'))
                    .sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
  if(dalchini.length>1){
    const keep=dalchini[0];
    const dups=dalchini.slice(1);
    const dupIds=dups.map(p=>p.id);
    for(const tbl of ['product_sections','reviews','cart_items','wishlist']){
      const res=await sup.from(tbl).delete().in('product_id',dupIds);
      if(res.error && !String(res.error.message||'').includes('relation')){}
    }
    const {error:delDupErr}=await sup.from('products').delete().in('id',dupIds);
    if(delDupErr) throw delDupErr;
    dedupes.push({kept:{product_id:keep.product_id,title_en:keep.title_en},removed:dups.map(p=>({product_id:p.product_id,title_en:p.title_en}))});
  }

  // Price updates
  // Any Essential Oil 15ml = 200
  const essential=all.filter(p=>/essential oil/i.test(p.title_en||'') && Number(p.unit_value)===15 && (p.unit_type||'').toLowerCase()==='ml');
  if(essential.length){
    const ids=essential.map(p=>p.id);
    await sup.from('products').update({current_price:200,updated_at:new Date().toISOString()}).in('id',ids);
    updates.push({rule:'Any Essential Oil 15ml',updated_count:ids.length,current_price:200});
  }

  // Banana 50g = 100
  const banana=all.filter(p=>/banana/i.test(p.title_en||'') && Number(p.unit_value)===50 && (p.unit_type||'').toLowerCase()==='gm');
  if(banana.length){
    await sup.from('products').update({current_price:100,updated_at:new Date().toISOString()}).in('id',banana.map(x=>x.id));
    updates.push({rule:'Banana 50g',updated_count:banana.length,current_price:100});
  }

  // Pomegranate Seeds Powder 50g = 150
  const pomegranate=all.filter(p=>titleEq(p.title_en,'Pomegranate Seeds Powder') && Number(p.unit_value)===50 && (p.unit_type||'').toLowerCase()==='gm');
  if(pomegranate.length){
    await sup.from('products').update({current_price:150,updated_at:new Date().toISOString()}).in('id',pomegranate.map(x=>x.id));
    updates.push({rule:'Pomegranate Seeds Powder 50g',updated_count:pomegranate.length,current_price:150});
  }

  // Red Sandal 50g = 150 (match Red Sandal Powder/Red Sandalwood Powder)
  const redSandal=all.filter(p=>/red sandal/i.test(p.title_en||'') && Number(p.unit_value)===50 && (p.unit_type||'').toLowerCase()==='gm');
  if(redSandal.length){
    await sup.from('products').update({current_price:150,updated_at:new Date().toISOString()}).in('id',redSandal.map(x=>x.id));
    updates.push({rule:'Red Sandal 50g',updated_count:redSandal.length,current_price:150});
  }

  // Red Wine 50ml = 100
  const redWine=all.filter(p=>titleEq(p.title_en,'Red Wine'));
  if(redWine.length){
    await sup.from('products').update({current_price:100,unit_value:50,unit_type:'ml',updated_at:new Date().toISOString()}).in('id',redWine.map(x=>x.id));
    updates.push({rule:'Red Wine 50ml',updated_count:redWine.length,current_price:100,unit_value:50,unit_type:'ml'});
  }

  // Dedupe Rose Essential Oil: keep EO001 if present, delete others
  const rose=all.filter(p=>titleEq(p.title_en,'Rose Essential Oil')).sort((a,b)=>a.product_id==='EO001'?-1:b.product_id==='EO001'?1:0);
  if(rose.length>1){
    const keep=rose[0];
    const dups=rose.slice(1);
    const dupIds=dups.map(x=>x.id);
    for(const tbl of ['product_sections','reviews','cart_items','wishlist']){
      await sup.from(tbl).delete().in('product_id',dupIds);
    }
    const {error:dr}=await sup.from('products').delete().in('id',dupIds);
    if(dr) throw dr;
    dedupes.push({kept:{product_id:keep.product_id,title_en:keep.title_en},removed:dups.map(d=>({product_id:d.product_id,title_en:d.title_en}))});
  }

  // final verification snapshot
  const {data:final,error:fErr}=await sup.from('products').select('id,product_id,title_en,current_price,mrp,unit_value,unit_type,is_active,image_url').order('title_en');
  if(fErr) throw fErr;

  const missingImages=final.filter(p=>!p.image_url).map(p=>({product_id:p.product_id,title_en:p.title_en,is_active:p.is_active}));

  // duplicate titles check
  const dupMap={};
  for(const p of final){const k=norm(p.title_en);dupMap[k]=(dupMap[k]||[]).concat(p);} 
  const duplicates=Object.values(dupMap).filter(arr=>arr.length>1).map(arr=>arr.map(x=>({product_id:x.product_id,title_en:x.title_en,is_active:x.is_active})));

  const summary={
    timestamp:new Date().toISOString(),
    added_products:additions,
    removed_products:removals,
    dedupe_actions:dedupes,
    price_updates:updates.filter(u=>u.rule),
    naming_updates:updates.filter(u=>u.field==='title_en'),
    unresolved_duplicate_titles:duplicates,
    products_without_images:missingImages,
    total_products_after:final.length
  };

  fs.writeFileSync(path.resolve(process.cwd(),'supabase','requested_catalog_update_report.json'),JSON.stringify(summary,null,2));
  console.log(JSON.stringify(summary,null,2));
}

main().catch(e=>{console.error('FAILED',e);process.exit(1);});
