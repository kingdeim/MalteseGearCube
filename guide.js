"use strict";
// Lösungsanleitung: 8 Schritte nach der verbreiteten Methode (Quellen: Reddit r/Cubers „Maltese Gear
// Cube full solution“, TwistyPuzzles-Forum, Google-Docs-Zusammenfassung). Texte frei formuliert.
// Jeder Schritt hat eine Prüfung, die an der gerade angezeigten Stellung (qStates[pos]) läuft.
// Nutzt Funktionen und Zustand aus index.html (wird danach geladen).
const Guide=(()=>{
  // ---------- Prüfungen ----------
  const R3=M=>M.map(r=>r.map(Math.round));
  const eqM=(A,B)=>A.every((r,i)=>r.every((x,j)=>Math.abs(x-B[i][j])<1e-3));
  const homeSlot=(list,id)=>list.find(s=>s.name===id);
  // Lage des Würfels aus den Ecken: Sind alle Ecken untereinander gelöst, liefert das die
  // Ganz-Würfel-Drehung Q (die übrigen Prüfungen beziehen sich darauf), sonst null.
  function frame(st){
    const ref=st.corners.find(c=>c.id==="UFR"),Q=R3(ref.R);
    for(const c of st.corners){
      if(!eqM(R3(c.R),Q))return null;
      if(!near(mulMV(Q,homeSlot(SLOTS.corners,c.id).pos),c.pos))return null;
    }
    return Q;
  }
  const gearsEven=st=>st.gears.every(g=>gearQuarter(g)%2===0);
  const gearsSolved=(st,Q)=>st.gears.every(g=>{
    const h=homeSlot(SLOTS.gears,g.id);
    return near(mulMV(Q,h.f),g.f)&&near(mulMV(Q,h.d),g.d)&&gearQuarter(g)===0;});
  const edges=st=>st.ecs.filter(e=>e.type==="edge"),centers=st=>st.ecs.filter(e=>e.type==="center");
  const inEdgeSlots=st=>edges(st).every(e=>ecSlotByDir(e.dir).type==="edge");
  // Eine Kante ist „um 90° verdreht“, wenn ihre Farben nicht auf die beiden Seiten ihres Platzes zeigen
  function misaligned(st){
    let n=0;
    for(const e of edges(st)){
      const slot=ecSlotByDir(e.dir);if(slot.type!=="edge")continue;
      const faces=slot.name.split("").map(k=>FACES[k]);
      const ok=e.id.split("").every(k=>{const v=mulMV(e.R,FACES[k]);return faces.some(f=>dot(f,v)>0.9);});
      if(!ok)n++;
    }
    return n;
  }
  const placed=(list,Q)=>list.every(e=>near(ecSlotByDir(e.dir).dir,mulMV(Q,homeSlot(SLOTS.ecs,e.id).dir)));
  const edgesSolved=(st,Q)=>edges(st).every(e=>near(ecSlotByDir(e.dir).dir,mulMV(Q,homeSlot(SLOTS.ecs,e.id).dir))&&eqM(e.R,Q));
  // Prüfung je Schritt (kumulativ: ein Schritt gilt nur, wenn alle vorherigen erfüllt sind)
  const CHECKS=[
    (st,Q)=>!!Q,
    (st,Q)=>gearsEven(st),
    (st,Q)=>gearsSolved(st,Q),
    (st,Q)=>inEdgeSlots(st),
    (st,Q)=>misaligned(st)%2===0,
    (st,Q)=>misaligned(st)===0,
    (st,Q)=>placed(edges(st),Q),
    (st,Q)=>placed(centers(st),Q),
    (st,Q)=>edgesSolved(st,Q),
  ];
  function progress(st){
    const Q=frame(st),done=[];let ok=true;
    for(let i=0;i<CHECKS.length;i++){ok=ok&&!!Q&&CHECKS[i](st,Q);done.push(ok);}
    if(!Q)done.fill(false);
    return {done,misaligned:Q&&inEdgeSlots(st)?misaligned(st):null};
  }

  // ---------- Inhalte ----------
  // a = Algorithmus (Notation der App, Makros aus der Standardliste), p = Zweck {de,en,es}
  const A=(a,de,en,es)=>({a,p:{de,en,es}});
  const STEPS=[
    {title:{de:"1 · Ecken",en:"1 · Corners",es:"1 · Esquinas"},
     text:{de:"Löse zuerst die acht Ecken wie bei einem 2×2-Würfel – Zahnräder, Kanten und Mitten sind dabei noch egal. Gut zu wissen: Vierfachdrehungen wie <code>R4</code> lassen die Ecken unverändert und bewegen nur den Mittelring. Sie sind deshalb in allen späteren Schritten das wichtigste Werkzeug.",
           en:"First solve the eight corners like a 2×2 cube – gears, edges and centers don't matter yet. Good to know: quadruple turns such as <code>R4</code> leave the corners unchanged and only move the middle ring, which makes them the main tool in all later steps.",
           es:"Primero resuelve las ocho esquinas como en un cubo 2×2; engranajes, aristas y centros todavía no importan. Conviene saber: los giros cuádruples como <code>R4</code> no cambian las esquinas y solo mueven el anillo central, por eso son la herramienta principal en los pasos siguientes."},
     algs:[A("R U R' U R U2 R'","Sune: verdreht Ecken der oberen Schicht (2×2-OLL)","Sune: twists corners of the top layer (2×2 OLL)","Sune: orienta esquinas de la capa superior (OLL 2×2)"),
           A("R U R' U' R' F R2 U' R' U' R U R' F'","T-Perm: tauscht UFR ↔ UBR (benachbarte Ecken)","T perm: swaps UFR ↔ UBR (adjacent corners)","Perm. T: intercambia UFR ↔ UBR (esquinas adyacentes)"),
           A("F R U' R' U' R U R' F' R U R' U' R' F R F'","Y-Perm: tauscht UFR ↔ UBL (diagonale Ecken)","Y perm: swaps UFR ↔ UBL (diagonal corners)","Perm. Y: intercambia UFR ↔ UBL (esquinas diagonales)")]},
    {title:{de:"2a · Zahnräder: Parität",en:"2a · Gears: parity",es:"2a · Engranajes: paridad"},
     text:{de:"Jedes Zahnrad kann um 0°, 90°, 180° oder 270° verdreht sein. Bringe zuerst alle Zahnräder auf eine „gerade“ Verdrehung (0° oder 180°). Die folgenden Folgen wechseln die Parität bestimmter Zahnräder, ohne die Ecken zu verändern. Mit Vorbereitungszügen holst du die passenden Zahnräder an diese Stellen und machst die Vorbereitung danach rückgängig.",
           en:"Each gear can be turned by 0°, 90°, 180° or 270°. First bring all gears to an “even” rotation (0° or 180°). The sequences below switch the parity of certain gears without changing the corners. Use setup moves to bring the right gears to these places and undo the setup afterwards.",
           es:"Cada engranaje puede estar girado 0°, 90°, 180° o 270°. Primero lleva todos los engranajes a un giro «par» (0° o 180°). Las secuencias siguientes cambian la paridad de ciertos engranajes sin alterar las esquinas. Con movimientos de preparación lleva los engranajes adecuados a esas posiciones y deshaz la preparación después."},
     algs:[A("J J","Parität von FL, FR, BD, DB","Parity of FL, FR, BD, DB","Paridad de FL, FR, BD, DB"),
           A("U J J K' K' U'","Parität von FL, FR, RF, RB","Parity of FL, FR, RF, RB","Paridad de FL, FR, RF, RB"),
           A("(R' D' R D)4 D J J K' K' D' (D' R' D R)4","Parität von LF, LB, BD","Parity of LF, LB, BD","Paridad de LF, LB, BD"),
           A("(R' D' R D)4 D J J K' K' D' (D' R' D R)4 D K K J' J' D'","Parität von FL und FR","Parity of FL and FR","Paridad de FL y FR"),
           A("(R' D' R D)4 L D J J K' K' D' L' (D' R' D R)4 L D K K J' J' D' L'","Parität von FL, LU, LB, UL","Parity of FL, LU, LB, UL","Paridad de FL, LU, LB, UL")]},
    {title:{de:"2b · Zahnräder lösen",en:"2b · Solve the gears",es:"2b · Resolver engranajes"},
     text:{de:"Jetzt kommen die Zahnräder mit Dreierzyklen an ihre Plätze; manche Folgen drehen dabei ein Zahnrad um 180°. Die Varianten mit <code>C</code> statt <code>A</code> arbeiten mit LF statt RF. Wenn am Ende einzelne Zahnräder um 180° verdreht sind, hilft die letzte Folge.",
           en:"Now the gears go to their places with 3-cycles; some sequences also turn one gear by 180°. The variants with <code>C</code> instead of <code>A</code> work on LF instead of RF. If single gears are turned by 180° at the end, use the last sequence.",
           es:"Ahora los engranajes van a su sitio con ciclos de tres; algunas secuencias además giran un engranaje 180°. Las variantes con <code>C</code> en lugar de <code>A</code> trabajan con LF en vez de RF. Si al final quedan engranajes girados 180°, usa la última secuencia."},
     algs:[A("A' XL A XL","Dreierzyklus RF → DF → DL","3-cycle RF → DF → DL","Ciclo RF → DF → DL"),
           A("A' XR A XR","Dreierzyklus RF → DF → DR","3-cycle RF → DF → DR","Ciclo RF → DF → DR"),
           A("A' XB A XB","Dreierzyklus RF → DF → DB","3-cycle RF → DF → DB","Ciclo RF → DF → DB"),
           A("A XL A' XL","Dreierzyklus RF → DF → DL mit 180°-Drehung","3-cycle RF → DF → DL with a 180° turn","Ciclo RF → DF → DL con giro de 180°"),
           A("C' XL C XL","Dreierzyklus LF → DF → DL","3-cycle LF → DF → DL","Ciclo LF → DF → DL"),
           A("C XL C' XL","Dreierzyklus LF → DF → DL mit 180°-Drehung","3-cycle LF → DF → DL with a 180° turn","Ciclo LF → DF → DL con giro de 180°"),
           A("J4","Zwei Dreierzyklen (LF, FL, FR und BD, DB, BU)","Two 3-cycles (LF, FL, FR and BD, DB, BU)","Dos ciclos de tres (LF, FL, FR y BD, DB, BU)"),
           A("(R U R' U')8 J' J' R B4 R' J J R B4 R' (U R U' R')8 R B4 R' J' J' R B4 R' J J","Dreht FL und FR um 180°","Turns FL and FR by 180°","Gira FL y FR 180°")]},
    {title:{de:"3 · Kanten auf Kantenplätze",en:"3 · Edges to edge slots",es:"3 · Aristas a sus huecos"},
     text:{de:"Kanten und Mitten haben dieselbe Form und können die Plätze tauschen. Bringe alle Kanten auf Kantenplätze – dann sitzen automatisch alle Mitten auf Mittenplätzen. <code>W</code> ist hier das zentrale Werkzeug: Es lässt Ecken und Zahnräder in Ruhe.",
           en:"Edges and centers have the same shape and can swap places. Bring all edges to edge slots – then all centers automatically sit in center slots. <code>W</code> is the key tool here: it leaves corners and gears alone.",
           es:"Aristas y centros tienen la misma forma y pueden intercambiar posiciones. Lleva todas las aristas a huecos de arista; así todos los centros quedan en huecos de centro. <code>W</code> es la herramienta clave: no toca esquinas ni engranajes."},
     algs:[A("W","Tauscht F ↔ B und RF ↔ LB, dreht U und D","Swaps F ↔ B and RF ↔ LB, turns U and D","Intercambia F ↔ B y RF ↔ LB, gira U y D"),
           A("F R' W R F'","Tauscht U ↔ LB","Swaps U ↔ LB","Intercambia U ↔ LB")]},
    {title:{de:"4 · Parität",en:"4 · Parity",es:"4 · Paridad"},
     text:{de:"Zähle die Kanten, die um 90° verdreht sind (ihre Farben zeigen nicht auf die beiden Seiten ihres Platzes). Ist die Anzahl ungerade, wende die folgende Folge einmal an – sie dreht zusätzlich eine Kante um 90°.",
           en:"Count the edges that are turned by 90° (their colours don't point to the two sides of their slot). If the number is odd, apply the sequence below once – it additionally turns one edge by 90°.",
           es:"Cuenta las aristas giradas 90° (sus colores no apuntan a las dos caras de su hueco). Si el número es impar, aplica una vez la secuencia siguiente: gira además una arista 90°."},
     algs:[A("R' U F' W F U' R","Paritätskorrektur (dreht DL um 90°)","Parity fix (turns DL by 90°)","Corrección de paridad (gira DL 90°)")]},
    {title:{de:"5 · Kanten ausrichten (90°)",en:"5 · Orient edges (90°)",es:"5 · Orientar aristas (90°)"},
     text:{de:"Ab jetzt nur noch Vorbereitungszüge mit Doppel- oder Vierfachdrehungen (z. B. <code>U2</code>, <code>F4</code>) – einfache Drehungen würden Erreichtes zerstören. Bringe zwei um 90° verdrehte Kanten auf die gegenüberliegenden Plätze UB und DF und drehe sie gemeinsam. Wiederholen, bis keine Kante mehr um 90° verdreht ist.",
           en:"From now on, only use setup moves with double or quadruple turns (e.g. <code>U2</code>, <code>F4</code>) – single turns would destroy what you have achieved. Bring two edges that are turned by 90° to the opposite slots UB and DF and turn them together. Repeat until no edge is turned by 90° any more.",
           es:"A partir de aquí usa solo movimientos de preparación dobles o cuádruples (p. ej. <code>U2</code>, <code>F4</code>); los giros simples destruirían lo conseguido. Lleva dos aristas giradas 90° a los huecos opuestos UB y DF y gíralas juntas. Repite hasta que no quede ninguna arista girada 90°."},
     algs:[A("R' W R","Dreht UB und DF um 90°","Turns UB and DF by 90°","Gira UB y DF 90°"),
           A("W","Tauscht RF ↔ LB","Swaps RF ↔ LB","Intercambia RF ↔ LB"),
           A("R4 F' R4 F R4 W R4 F' R4 F R4","Tauscht LB ↔ FU","Swaps LB ↔ FU","Intercambia LB ↔ FU")]},
    {title:{de:"6 · Kanten platzieren",en:"6 · Place the edges",es:"6 · Colocar aristas"},
     text:{de:"Tausche die Kanten paarweise an ihre richtigen Plätze, weiterhin nur mit Doppel- oder Vierfachdrehungen als Vorbereitung.",
           en:"Swap the edges in pairs to their correct slots, still using only double or quadruple turns as setup moves.",
           es:"Intercambia las aristas por parejas hasta su sitio correcto, usando todavía solo giros dobles o cuádruples como preparación."},
     algs:[A("W","Tauscht RF ↔ LB","Swaps RF ↔ LB","Intercambia RF ↔ LB"),
           A("R4 F' R4 F R4 W R4 F' R4 F R4","Tauscht LB ↔ FU","Swaps LB ↔ FU","Intercambia LB ↔ FU")]},
    {title:{de:"7 · Mitten",en:"7 · Centers",es:"7 · Centros"},
     text:{de:"Bringe die Mitten mit einem Dreierzyklus an ihre Plätze.",
           en:"Bring the centers to their places with a 3-cycle.",
           es:"Lleva los centros a su sitio con un ciclo de tres."},
     algs:[A("(U L'2 W L2 U' B4)2","Dreierzyklus der Mitten L → F → R","3-cycle of centers L → F → R","Ciclo de centros L → F → R")]},
    {title:{de:"8 · Kanten drehen (180°)",en:"8 · Flip edges (180°)",es:"8 · Voltear aristas (180°)"},
     text:{de:"Zum Schluss werden Kanten, die richtig sitzen, aber falsch herum, umgedreht. Danach ist der Würfel gelöst.",
           en:"Finally, edges that are in the right place but flipped are turned over. After that the cube is solved.",
           es:"Por último se voltean las aristas que están en su sitio pero al revés. Después el cubo está resuelto."},
     algs:[A("R W W R'","Dreht FU und BD um","Flips FU and BD","Voltea FU y BD"),
           A("U' R F' W W F R' U","Dreht DL um","Flips DL","Voltea DL")]},
  ];
  const UI={
    de:{status:"Aktuelle Stellung:",done:"geschafft ✓",open:"noch offen",noCorners:"Ecken noch nicht gelöst",try:"▶ Ausprobieren",tryT:"Wirkung am gelösten Würfel zeigen",
        apply:"➜ Auf aktuelle Stellung",applyT:"Auf die gerade angezeigte Stellung anwenden",mis:"Um 90° verdrehte Kanten: {n}",
        src:"Methode und Algorithmen nach der Lösung von Reddit r/Cubers und dem TwistyPuzzles-Forum; die genaue Wirkung im Modell zeigt „Veränderungen“.",solved:"Gelöst! 🎉"},
    en:{status:"Current position:",done:"done ✓",open:"not yet",noCorners:"corners not solved yet",try:"▶ Try",tryT:"Show the effect on a solved cube",
        apply:"➜ On current position",applyT:"Apply to the position shown now",mis:"Edges turned by 90°: {n}",
        src:"Method and algorithms from the solution on Reddit r/Cubers and the TwistyPuzzles forum; “Changes” shows the exact effect in the model.",solved:"Solved! 🎉"},
    es:{status:"Posición actual:",done:"conseguido ✓",open:"pendiente",noCorners:"esquinas aún sin resolver",try:"▶ Probar",tryT:"Mostrar el efecto en un cubo resuelto",
        apply:"➜ En la posición actual",applyT:"Aplicar a la posición mostrada",mis:"Aristas giradas 90°: {n}",
        src:"Método y algoritmos de la solución de Reddit r/Cubers y del foro TwistyPuzzles; «Cambios» muestra el efecto exacto en el modelo.",solved:"¡Resuelto! 🎉"}};
  const u=(k,v={})=>(UI[LANG]||UI.en)[k].replace(/\{(\w+)\}/g,(_,n)=>v[n]??"");
  const esc=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");

  // ---------- Darstellung ----------
  let sel=0;try{sel=Math.min(STEPS.length-1,Math.max(0,+localStorage.getItem("mgcGuide")||0));}catch(e){}
  function render(){
    const root=document.getElementById("guide");if(!root||!qStates.length)return;
    const st=qStates[pos],pr=progress(st),s=STEPS[sel],L=LANG;
    let h=`<div class="gsteps" role="tablist">`+STEPS.map((x,i)=>`<button data-gs="${i}" class="${i===sel?"on":""} ${pr.done[i]?"ok":""}">${pr.done[i]?"✓ ":""}${x.title[L]}</button>`).join("")+`</div>`;
    h+=`<h3>${s.title[L]}</h3><p>${s.text[L]}</p>`;
    const status=pr.done[sel]?u("done"):pr.done[0]||sel===0?u("open"):u("noCorners");
    h+=`<p class="gstatus ${pr.done[sel]?"ok":""}"><b>${u("status")}</b> ${status}`+
       ((sel===4||sel===5)&&pr.misaligned!==null?` · ${u("mis",{n:pr.misaligned})}`:"")+
       (pr.done[STEPS.length-1]?` · <b>${u("solved")}</b>`:"")+`</p>`;
    h+=`<div class="galgs">`+s.algs.map((x,i)=>`<div class="galg"><code>${esc(x.a)}</code><span>${x.p[L]}</span>
      <span class="gbtn"><button data-ga="${i}" data-mode="try" title="${u("tryT")}">${u("try")}</button><button data-ga="${i}" data-mode="apply" title="${u("applyT")}">${u("apply")}</button></span></div>`).join("")+`</div>`;
    h+=`<p class="legend">${u("src")}</p>`;
    root.innerHTML=h;
  }
  // Algorithmus laden: „try“ = auf den gelösten Würfel, „apply“ = auf die angezeigte Stellung
  function load(alg,mode){
    if(mode==="apply"){
      const done=compress(quarters.slice(0,pos)).map(x=>x.label);
      $("setup").value=[appliedS,...done].filter(Boolean).join(" ");
    }else $("setup").value="";
    $("alg").value=alg;pos=0;compute();
    if(matchMedia("(max-width:760px)").matches)document.getElementById("nets").scrollIntoView({behavior:"smooth"});
  }
  function init(){
    const root=document.getElementById("guide");if(!root)return;
    root.addEventListener("click",e=>{
      const b=e.target.closest("button");if(!b)return;
      if(b.dataset.gs!==undefined){sel=+b.dataset.gs;try{localStorage.setItem("mgcGuide",sel);}catch(_){}render();}
      else if(b.dataset.ga!==undefined)load(STEPS[sel].algs[+b.dataset.ga].a,b.dataset.mode);
    });
    render();
  }
  return {init,render,progress};
})();
Guide.init();
