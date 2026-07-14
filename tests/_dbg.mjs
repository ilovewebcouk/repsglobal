import { PDFDocument, rgb, PDFName } from "pdf-lib";
import { inflateSync } from "node:zlib";
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input.url;
  if (url.startsWith("data:")) {
    const [meta, b64] = url.split(",", 2);
    return new Response(Buffer.from(b64, "base64"), { headers: { "content-type": meta.slice(5).split(";")[0] } });
  }
  return originalFetch(input, init);
};
const { renderCertificateFromBytes } = await import("/dev-server/src/lib/certificates/pdf.server.ts");
async function blank(){const d=await PDFDocument.create();d.addPage([595,842]).drawRectangle({x:0,y:0,width:595,height:842,color:rgb(1,1,1)});return d.save();}
const c=await blank(),u=await blank();
const out=await renderCertificateFromBytes({certPdfBytes:c,unitPdfBytes:u,fieldMap:{certificate:{images:[{field:"provider_logo",x:60,y:700,width:160,height:60}]},unit_summary:{list:{field:"unit_summary",x:60,y:120,maxWidth:480,fontSize:10}}}},{certificateNumber:"X",learnerName:"L",courseTitle:"T",courseLevel:3,repsCourseNumber:null,ofqualNumber:null,providerName:"P",providerLogoUrl:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",providerCenterNumber:null,issuedAt:new Date(),verificationUrl:"https://x",unitSummary:["A","B","C"]});
const doc=await PDFDocument.load(out);
for(let i=0;i<doc.getPageCount();i++){
  const p=doc.getPage(i);
  const arr=p.node.normalizedEntries().Contents.asArray();
  const dec=arr.map(r=>{const s=doc.context.lookup(r);const raw=Buffer.from(s.getContents());const f=s.dict.lookup(PDFName.of("Filter"));return (f&&f.toString().includes("FlateDecode"))?inflateSync(raw).toString("latin1"):raw.toString("latin1");}).join("\n");
  console.log("=== PAGE",i,"===\n",dec);
}
