const script = document.createElement('script');
script.innerHTML = `(()=>{window.eval(updateProgenyTableData.toString().replace(/\\bsaleTable\\b/g,'progenyListTable'))})()`;
document.body.appendChild(script);