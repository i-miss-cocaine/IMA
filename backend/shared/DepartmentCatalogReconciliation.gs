function buildDepartmentCatalogReconciliationReport_(input) {
  var cfg=input||{}, fail=function(code){return {valid:false,code:code,rows:[],exceptions:[],summary:null};};
  var time=function(v){if(v instanceof Date)return v.getTime();if(typeof v==="number")return v;if(v===undefined||v===null||v==="")return NaN;return Date.parse(String(v));};
  var active=function(r,states,now){
    if(!r||states.indexOf(String(r.status||"").trim().toUpperCase())<0)return false;
    var hs=r.validFrom!==undefined&&r.validFrom!==null&&r.validFrom!=="",he=r.validTo!==undefined&&r.validTo!==null&&r.validTo!=="";
    var st=hs?time(r.validFrom):NaN,en=he?time(r.validTo):NaN;
    return (!hs||(isFinite(st)&&st<=now))&&(!he||(isFinite(en)&&en>=now));
  };
  try {
    var institutionId=String(cfg.institutionId||"").trim(),domain=String(cfg.domain||"").trim(),now=time(cfg.now);
    var src=cfg.sourceCatalog||{},can=cfg.canonicalCatalog||{},auth=cfg.authorityDecision||{};
    if(!institutionId||!domain||!isFinite(now))return fail("DEPARTMENT_RECONCILIATION_SCOPE_INVALID");
    if(cfg.snapshotScopeVerified!==true||String(cfg.snapshotInstitutionId||"").trim()!==institutionId||String(cfg.snapshotDomain||"").trim()!==domain)return fail("DEPARTMENT_RECONCILIATION_SNAPSHOT_SCOPE_UNVERIFIED");
    if(cfg.crosswalkScopeVerified!==true||String(cfg.crosswalkInstitutionId||"").trim()!==institutionId||String(cfg.crosswalkDomain||"").trim()!==domain)return fail("DEPARTMENT_RECONCILIATION_CROSSWALK_SCOPE_UNVERIFIED");
    var sourceCatalogId=String(src.catalogId||"").trim(),canonicalCatalogId=String(can.catalogId||"").trim();
    if(!sourceCatalogId||!canonicalCatalogId||sourceCatalogId===canonicalCatalogId)return fail("DEPARTMENT_RECONCILIATION_CATALOG_PAIR_INVALID");
    if(String(auth.institutionId||"").trim()!==institutionId||String(auth.domain||"").trim()!==domain||String(auth.authorityCatalogId||"").trim()!==canonicalCatalogId)return fail("DEPARTMENT_AUTHORITY_DECISION_SCOPE_MISMATCH");
    var authAt=time(auth.approvedAt);
    if(auth.approved!==true||!String(auth.approvalReference||"").trim()||!String(auth.approvedBy||"").trim()||!String(auth.version||"").trim()||!isFinite(authAt)||authAt>now)return fail("DEPARTMENT_AUTHORITY_NOT_APPROVED");
    var states=Array.isArray(cfg.activeStates)?cfg.activeStates.map(function(x){return String(x||"").trim().toUpperCase();}).filter(Boolean):["ACTIVE","ACTIVO","ACTIVA","TRUE"];
    if(!states.length)return fail("DEPARTMENT_RECONCILIATION_ACTIVE_STATES_INVALID");
    var srcRows=Array.isArray(src.records)?src.records:[],canRows=Array.isArray(can.records)?can.records:[];
    var srcBy=Object.create(null),canBy=Object.create(null),i;
    for(i=0;i<srcRows.length;i++){var sr=srcRows[i]||{},sid=String(sr.id||"").trim();if(!sid)return fail("DEPARTMENT_RECONCILIATION_SOURCE_ID_MISSING");if(Object.prototype.hasOwnProperty.call(srcBy,sid))return fail("DEPARTMENT_RECONCILIATION_SOURCE_ID_AMBIGUOUS");srcBy[sid]=sr;}
    for(i=0;i<canRows.length;i++){var cr=canRows[i]||{},cid=String(cr.id||"").trim();if(!cid)return fail("DEPARTMENT_RECONCILIATION_CANONICAL_ID_MISSING");if(Object.prototype.hasOwnProperty.call(canBy,cid))return fail("DEPARTMENT_RECONCILIATION_CANONICAL_ID_AMBIGUOUS");canBy[cid]=cr;}
    var maps=Array.isArray(cfg.crosswalkRows)?cfg.crosswalkRows:[],bySource=Object.create(null);
    for(i=0;i<maps.length;i++){var mp=maps[i]||{};if(String(mp.institutionId||"").trim()!==institutionId||String(mp.domain||"").trim()!==domain||String(mp.sourceCatalog||"").trim()!==sourceCatalogId||String(mp.canonicalCatalog||"").trim()!==canonicalCatalogId)return fail("DEPARTMENT_RECONCILIATION_CROSSWALK_SCOPE_MISMATCH");var msid=String(mp.sourceId||"").trim();if(!msid)return fail("DEPARTMENT_RECONCILIATION_CROSSWALK_SOURCE_ID_MISSING");if(!Object.prototype.hasOwnProperty.call(bySource,msid))bySource[msid]=[];bySource[msid].push(mp);}
    var rows=[],exceptions=[],targetSources=Object.create(null),pending=[],ids=Object.keys(srcBy);
    for(i=0;i<ids.length;i++){
      var id=ids[i],record=srcBy[id],item={sourceCatalogId:sourceCatalogId,sourceId:id,sourceName:String(record.name||"").trim(),classification:"",candidateCanonicalIds:[],candidateCanonicalNames:[],approvalReferences:[],mappingEvidence:[],issues:[]};
      if(!active(record,states,now)){item.classification="CONFLICT";item.issues.push("SOURCE_NOT_ACTIVE_OR_EFFECTIVE");}
      else if(Object.prototype.hasOwnProperty.call(canBy,id)){
        if(!active(canBy[id],states,now)){item.classification="CONFLICT";item.issues.push("EXACT_ID_TARGET_NOT_ACTIVE_OR_EFFECTIVE");}
        else if(bySource[id]&&bySource[id].length){item.classification="CONFLICT";item.issues.push("EXACT_ID_HAS_CROSSWALK_ROW");}
        else{item.classification="EXACT_MATCH";item.candidateCanonicalIds=[id];item.candidateCanonicalNames=[String(canBy[id].name||"").trim()];if(!targetSources[id])targetSources[id]=[];targetSources[id].push(id);}
      }else{
        var sourceMaps=bySource[id]||[];
        if(!sourceMaps.length)item.classification="NO_CORRESPONDENCE";
        else{
          var candidates=[],validRows=true,seen=Object.create(null);
          for(var j=0;j<sourceMaps.length;j++){
            var map=sourceMaps[j],approvedAt=time(map.approvedAt),hasFrom=map.validFrom!==undefined&&map.validFrom!==null&&map.validFrom!=="",hasTo=map.validTo!==undefined&&map.validTo!==null&&map.validTo!=="",from=hasFrom?time(map.validFrom):NaN,to=hasTo?time(map.validTo):NaN;
            item.mappingEvidence.push({canonicalId:String(map.canonicalId||"").trim()||null,approvalReference:String(map.approvalReference||"").trim()||null,approvedBy:String(map.approvedBy||"").trim()||null,approvedAt:String(map.approvedAt||"").trim()||null,status:String(map.status||"").trim().toUpperCase(),validFrom:String(map.validFrom||"").trim()||null,validTo:String(map.validTo||"").trim()||null,approved:map.approved===true});
            var ok=map.approved===true&&!!String(map.approvalReference||"").trim()&&!!String(map.approvedBy||"").trim()&&isFinite(approvedAt)&&approvedAt<=now&&["ACTIVE","ACTIVO","ACTIVA"].indexOf(String(map.status||"").trim().toUpperCase())>=0&&!String(map.revokedAt||"").trim()&&(!hasFrom||(isFinite(from)&&from<=now))&&(!hasTo||(isFinite(to)&&to>=now));
            if(!ok){validRows=false;item.issues.push("CROSSWALK_NOT_APPROVED_ACTIVE_OR_EFFECTIVE");continue;}
            var target=String(map.canonicalId||"").trim();
            if(!target||!Object.prototype.hasOwnProperty.call(canBy,target)){validRows=false;item.issues.push("CANONICAL_TARGET_NOT_FOUND");continue;}
            if(!active(canBy[target],states,now)){validRows=false;item.issues.push("CANONICAL_TARGET_NOT_ACTIVE_OR_EFFECTIVE");continue;}
            if(Object.prototype.hasOwnProperty.call(seen,target)){validRows=false;item.issues.push("DUPLICATE_CROSSWALK_TARGET");continue;}
            seen[target]=true;candidates.push(target);item.approvalReferences.push(String(map.approvalReference).trim());
          }
          if(!validRows||!candidates.length)item.classification="CONFLICT";
          else{item.candidateCanonicalIds=candidates;item.candidateCanonicalNames=candidates.map(function(target){return String(canBy[target].name||"").trim();});candidates.forEach(function(target){if(!targetSources[target])targetSources[target]=[];targetSources[target].push(id);});item.classification=candidates.length>1?"RELATION_1_N":"APPROVED_EQUIVALENCE";}
        }
      }
      pending.push(item);
    }
    Object.keys(bySource).forEach(function(orphan){if(!Object.prototype.hasOwnProperty.call(srcBy,orphan))exceptions.push({sourceId:orphan,classification:"CONFLICT",issue:"CROSSWALK_SOURCE_NOT_FOUND"});});
    pending.forEach(function(item){
      if(item.classification==="APPROVED_EQUIVALENCE"||item.classification==="EXACT_MATCH"){if(item.candidateCanonicalIds.some(function(target){return (targetSources[target]||[]).length>1;}))item.classification="RELATION_N_1";}
      else if(item.classification==="RELATION_1_N"&&item.candidateCanonicalIds.some(function(target){return (targetSources[target]||[]).length>1;}))item.classification="RELATION_1_N_AND_N_1";
      rows.push(item);
    });
    var summary={exactMatches:0,approvedEquivalences:0,relation1N:0,relationN1:0,relation1NAndN1:0,noCorrespondence:0,conflicts:0,orphanCrosswalks:exceptions.length};
    rows.forEach(function(row){if(row.classification==="EXACT_MATCH")summary.exactMatches++;else if(row.classification==="APPROVED_EQUIVALENCE")summary.approvedEquivalences++;else if(row.classification==="RELATION_1_N")summary.relation1N++;else if(row.classification==="RELATION_N_1")summary.relationN1++;else if(row.classification==="RELATION_1_N_AND_N_1")summary.relation1NAndN1++;else if(row.classification==="NO_CORRESPONDENCE")summary.noCorrespondence++;else if(row.classification==="CONFLICT")summary.conflicts++;});
    summary.conflicts+=exceptions.length;
    var coverage=Object.keys(canBy).map(function(id){var linked=targetSources[id]||[];return {canonicalId:id,canonicalName:String(canBy[id].name||"").trim(),classification:linked.length?"MAPPED":"NO_CORRESPONDENCE",sourceIds:linked.slice()};});
    summary.unmappedCanonicalRecords=coverage.filter(function(row){return row.classification==="NO_CORRESPONDENCE";}).length;
    return {valid:true,code:"DEPARTMENT_RECONCILIATION_REPORT_READY",institutionId:institutionId,domain:domain,effectiveAt:new Date(now).toISOString(),sourceCatalogId:sourceCatalogId,canonicalCatalogId:canonicalCatalogId,authority:{catalogId:canonicalCatalogId,approvalReference:String(auth.approvalReference).trim(),approvedBy:String(auth.approvedBy).trim(),approvedAt:String(auth.approvedAt).trim(),version:String(auth.version).trim()},rows:rows,canonicalCoverage:coverage,exceptions:exceptions,summary:summary,writesPerformed:false,automaticResolutionPerformed:false};
  } catch(error){return fail("DEPARTMENT_RECONCILIATION_VALIDATION_FAILED");}
}