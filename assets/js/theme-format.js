
(function (root) {
 'use strict';
 const keys=['background','main','accent','text','surface','surface2','border','muted'];
 const palettes={
  red:['0d0607','790f1d','ff9aa6','fff4f4','17090b','240b0e','790f1d','c7848c'],
  white:['e9edf2','6a727d','24282d','15181c','ffffff','e4e8ed','6a727d','59616b'],
  uwu:['25081a','bd2f82','ff9bd5','fff0fa','43102f','611545','bd2f82','eaa4cb'],
  blue:['030b18','145fa5','70c2ff','eef8ff','07182e','0b2748','145fa5','83b9e8'],
  pumpkin:['180c05','9b4613','ffb366','fff3e5','2b160a','40200c','9b4613','d9ae86'],
  black:['000000','292929','888888','eeeeee','050505','101010','292929','999999'],
  zen:['12042d','b335d4','ff84e8','ffffff','2d105e','5f1c89','b335d4','e7b8ff']
 };
 const validColors=value=>value&&typeof value==='object'&&keys.every(key=>/^#[0-9a-f]{6}$/i.test(value[key]||''));
 function colorsFor(name,custom){const palette=palettes[name];if(palette)return Object.fromEntries(keys.map((key,i)=>[key,'#'+palette[i]]));if(!validColors(custom))throw Error('This theme needs all eight colors.');return Object.fromEntries(keys.map(key=>[key,custom[key].toLowerCase()]));}
 function encode(colors){if(!validColors(colors))throw Error('This theme needs all eight colors.');return 'ODT1-'+keys.map(key=>colors[key].slice(1).toUpperCase()).join('-');}
 function decode(value){const code=String(value).trim();if(!/^ODT1-(?:[0-9a-f]{6}-){7}[0-9a-f]{6}$/i.test(code))throw Error('Paste the complete ODT1 code with all eight colors.');return Object.fromEntries(code.slice(5).split('-').map((hex,i)=>[keys[i],'#'+hex.toLowerCase()]));}
 function parseFile(value){
  if(!value||value.format!=='goobernet-theme'||value.version!==1||!validColors(value.colors))throw Error('This is not a supported Goobernet theme file.');
  const name=typeof value.name==='string'?value.name.trim().slice(0,40):'Imported theme';
  const theme=Object.keys(palettes).includes(value.theme)?value.theme:'custom';
  const image=value.background?.data||'';
  if(typeof image!=='string'||image.length>14*1024*1024||image&&!/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(image))throw Error('The theme background must be a PNG, JPG, WebP or GIF under 10 MB.');
  return {format:'goobernet-theme',version:1,name:name||'Imported theme',theme,colors:colorsFor('custom',value.colors),leaves:value.leaves===true,background:{data:image,mode:value.background?.mode==='tile'?'tile':'cover',darkness:Number.isFinite(value.background?.darkness)?Math.min(90,Math.max(0,value.background.darkness)):50}};
 }
 root.GooberThemeFormat={keys,palettes,validColors,colorsFor,encode,decode,parseFile};
})(globalThis);
