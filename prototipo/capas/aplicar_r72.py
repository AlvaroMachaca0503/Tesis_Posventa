import sys,os
src,dst=sys.argv[1],sys.argv[2]
d=os.path.join(os.path.dirname(os.path.abspath(__file__)),'r72')
s=open(src,encoding='utf-8').read()
def rep(old,new,count=1):
    global s
    n=s.count(old);assert n==count,(old[:80],n);s=s.replace(old,new)
rep("const total=o=>o.lines.every(l=>l.price!=null)?o.lines.reduce((s,l)=>s+l.qty*l.price,0):null;","const total=o=>r72OrderTotal(o);")
rep("</style></head>",open(os.path.join(d,'estilos.css'),encoding='utf-8').read()+"</style></head>")
layer='\n'.join(open(os.path.join(d,f),encoding='utf-8').read() for f in ['a_base.js','b_grid.js','c_events.js','d_cita_ods.js','e_views.js','f_timeline.js','g_reports.js','h_init.js'])
tail="db.settings??={};document.body.classList.add('r7-nohandles');\nrender();"
rep(tail,"db.settings??={};document.body.classList.add('r7-nohandles');\n"+layer+"\nrender();")
rep("<title>R Motriz · Espacio de trabajo</title>","<title>R Motriz · Espacio de trabajo R7.2</title>")
open(dst,'w',encoding='utf-8').write(s);print('OK',len(s))
