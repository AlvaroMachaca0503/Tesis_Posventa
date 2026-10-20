import sys,os
src,dst=sys.argv[1],sys.argv[2]
d=os.path.join(os.path.dirname(os.path.abspath(__file__)),'r75')
s=open(src,encoding='utf-8').read()
def rep(old,new,count=1):
    global s
    n=s.count(old);assert n==count,(old[:80],n);s=s.replace(old,new)
rep("</style></head>",open(os.path.join(d,'estilos.css'),encoding='utf-8').read()+"</style></head>")
layer='\n'.join(open(os.path.join(d,f),encoding='utf-8').read() for f in ['a_nav.js','b_table.js','c_km.js','d_metrics.js','e_reports.js','f_close.js','h_init.js'])
i=s.rindex("\nrender();\n</script>");s=s[:i]+"\n"+layer+s[i:]
rep("Visión integral R7.4 · demo local","Visión integral R7.5 · demo local")
rep("<title>R Motriz · Espacio de trabajo R7.4</title>","<title>R Motriz · Espacio de trabajo R7.5</title>")
open(dst,'w',encoding='utf-8').write(s);print('OK',len(s))
