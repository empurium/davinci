!function(){var a=Handlebars.template,l=Handlebars.templates=Handlebars.templates||{};l["event-grid"]=a(function(a,l,t,e,s){this.compilerInfo=[4,">= 1.0.0"],t=this.merge(t,a.helpers),s=s||{};var h,d,n="",i="function",c=this.escapeExpression;return n+='<div class="event-grid" id="',(d=t._id)?h=d.call(l,{hash:{},data:s}):(d=l&&l._id,h=typeof d===i?d.call(l,{hash:{},data:s}):d),n+=c(h)+'">\n	<img class="img-rounded" data-url="/',(d=t.slug)?h=d.call(l,{hash:{},data:s}):(d=l&&l.slug,h=typeof d===i?d.call(l,{hash:{},data:s}):d),n+=c(h)+'" src="/thumb/',(d=t.slug)?h=d.call(l,{hash:{},data:s}):(d=l&&l.slug,h=typeof d===i?d.call(l,{hash:{},data:s}):d),n+=c(h)+"/",(d=t.thumb)?h=d.call(l,{hash:{},data:s}):(d=l&&l.thumb,h=typeof d===i?d.call(l,{hash:{},data:s}):d),n+=c(h)+'?size=220x220" width="220" height="220" />\n	<small>'+c((h=l&&l.files,h=null==h||h===!1?h:h.length,typeof h===i?h.apply(l):h))+"</small>\n	<h5>",(d=t.name)?h=d.call(l,{hash:{},data:s}):(d=l&&l.name,h=typeof d===i?d.call(l,{hash:{},data:s}):d),n+=c(h)+"</h5>\n</div>\n"})}();