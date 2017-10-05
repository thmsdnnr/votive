window.onload = function() {
  let myChart;
  let currentType;
  let keys=Object.keys(window.INITIAL_STATE.data[0].votes);
  let cArr = [[255,0,0,1.0],[255,153,0,1.0],[255,255,0,1.0],[0,255,0,1.0],[0,0,255,1.0],[75,0,130,1.0],[238,130,238,1.0]];//indigo//violet
  let rgbaC = ['rgba(255,0,0,1.0)','rgba(255,153,0,1.0)','rgba(255,255,0,1.0)','rgba(0,255,0,1.0)','rgba(0,0,255,1.0)','rgba(75,0,130,1.0)','rgba(238,130,238,1.0)'];
  let rainColors;
  let values=[];

  if (keys.length<8) {
    rainColors=rgbaC;
  }
  else if (keys.length<32) {
    let gradLength=Math.round((keys.length)/12);
    let rOra = generateGradient(cArr[1],cArr[0],gradLength);
    let oYel = generateGradient(cArr[2],cArr[1],gradLength);
    let yGre = generateGradient(cArr[3],cArr[2],gradLength);
    let gBlu = generateGradient(cArr[4],cArr[3],gradLength);
    let bIn = generateGradient(cArr[5],cArr[4],gradLength);
    let iVi = generateGradient(cArr[6],cArr[5],gradLength);
    rainColors=rOra.concat(oYel).concat(yGre).concat(gBlu).concat(bIn).concat(iVi);
  }
  else {
    let gradLength=Math.round((keys.length-2)/5);
    let rOra = generateGradient(cArr[1],cArr[0],gradLength);//slicing off the first three from each array
    rOra=rOra.slice(3,rOra.length-1); //tones down the dark colors at transitions
    let oYel = generateGradient(cArr[2],cArr[1],gradLength);
    oYel=oYel.slice(3,oYel.length-1);
    let yGre = generateGradient(cArr[3],cArr[2],gradLength);
    yGre=yGre.slice(3,yGre.length-1);
    let gBlu = generateGradient(cArr[4],cArr[3],gradLength);
    gBlu=gBlu.slice(3,gBlu.length-1);
    let bIn = generateGradient(cArr[5],cArr[4],gradLength);
    bIn=bIn.slice(3,bIn.length-1);
    let iVi = generateGradient(cArr[6],cArr[5],gradLength);
    iVi=iVi.slice(3,iVi.length-1);
    rainColors=rOra.concat(oYel).concat(yGre).concat(gBlu).concat(bIn).concat(iVi);
  }

  for (var i=0;i<keys.length;i++) {
    values[i]=window.INITIAL_STATE.data[0].votes[keys[i]];
  }

  const truncateKeys = (keyArr) => keyArr.map(e=>e.length>15 ? e.slice(0,12)+'...' : e);

  function genChart(cType='bar'){
    keys=truncateKeys(keys);
    currentType=cType;
    var ctx = document.querySelector('canvas.chart');
    var ticksOn=true;
    if ((cType=='pie'||cType=='doughnut')||cType=='polarArea') { ticksOn=false; }
    myChart = new Chart(ctx, {
      type: cType,
      data: {
          labels:keys,
          datasets: [{
              label: '# of Votes',
              data: values,
              backgroundColor: rainColors,
              borderColor: '#FFFFFF',
              borderWidth: 1
          }]
      },
      options: {
        legend: { display: false },
          scales: {
            xAxes: [{
              gridLines: { display: false },
              ticks: {display: ticksOn, stepSize: 1}
            }],
            yAxes: [{
              gridLines: { display: false },
              ticks: {display: ticksOn, stepSize: 5, beginAtZero: true},
              }]
          }
      }
  });
}
genChart();
  let toggles=document.querySelectorAll('button#chartToggle');
  toggles.forEach((t)=>t.addEventListener('click',function(e){
    if (e.target.value!==currentType){ //don't redraw if the same chart as currently up is selected again
      myChart.destroy();
      genChart(e.target.value);
    }
  }));

  function generateGradient(b,e,steps) { //TODO validate function inputs
    //returns an array of equidistant RGBA values (including start and end) in # steps (not including start & end)
    //e.g, generateGradient([0,0,0,1.0],[255,255,255,1.0],1) returns ['rgba(0,0,0,1.0)','rgba(128,128,128,1.0)','rgba(255,255,255,1.0)']
    let divFactor=steps+1;
    let gradArr=[];
    gradArr.push(`rgba(${b.join(",")})`);
    for (var i=1; i<divFactor; i++){
      let div=divFactor/i;
      gradArr.push(`rgba(${Math.floor(((b[0]+(e[0]-b[0])))/div)},${Math.floor(((b[1]+(e[1]-b[1])))/div)},${Math.floor(((b[2]+(e[2]-b[2])))/div)},${e[3]})`);
    }
    gradArr.push(`rgba(${e.join(",")})`);
    return gradArr;
  }

  function randomizeArray(arr) { //returns the array with elements ordered randomly
    //get random number in array index range
    let randomIndex=Math.floor(Math.random()*arr.length-1)+1;
    let randomArr=[];
    while (randomArr.length!=arr.length) {
      let randomIndex=Math.floor(Math.random()*arr.length-1)+1;
      if (randomArr.indexOf(arr[randomIndex])===-1) { randomArr.push(arr[randomIndex]); }
    }
    return randomArr;
  }
}
