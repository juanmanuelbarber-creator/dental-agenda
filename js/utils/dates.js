const D = {
  today()     { return new Date().toISOString().split('T')[0] },
  short(d)    { if (!d) return ''; const [y,m,dd] = d.split('-'); return `${dd}/${m}/${y}` },
  hora(t)     { return t ? String(t).substring(0,5) + ' hs' : '' },
  format(d, opts={}) {
    if (!d) return ''
    return new Date(d+'T00:00:00').toLocaleDateString('es-AR',
      { weekday:'long', year:'numeric', month:'long', day:'numeric', ...opts })
  },
  monthLabel(d) {
    if (!d) return ''
    const [y,m] = d.split('-')
    return new Date(y, m-1, 1).toLocaleDateString('es-AR',{ month:'long', year:'numeric' })
  },
  prevDay(d)  { const dt=new Date(d+'T00:00:00'); dt.setDate(dt.getDate()-1); return dt.toISOString().split('T')[0] },
  nextDay(d)  { const dt=new Date(d+'T00:00:00'); dt.setDate(dt.getDate()+1); return dt.toISOString().split('T')[0] },
  edad(fn) {
    if (!fn) return null
    const h = new Date(), n = new Date(fn)
    let e = h.getFullYear()-n.getFullYear()
    if (h.getMonth()<n.getMonth()||(h.getMonth()===n.getMonth()&&h.getDate()<n.getDate())) e--
    return e
  }
}
