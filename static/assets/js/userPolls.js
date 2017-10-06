window.onload = function() {
  let currentSortKey='expiresOn';   //set sorting defaults
  let currentSortDirection='asc';
  let lastSortKey;

  function sortAscNum(a,b) {
    if (a[1]>b[1]) { return 1; }
    else if (a[1]<b[1]) { return -1; }
    else { return 0; }
  }

  function sortDescNum(a,b) {
    if (a[1]<b[1]) { return 1; }
    else if (b[1]<a[1]) { return -1; }
    else { return 0; }
  }

  function sortAscText(a,b) {
    if (a[1].toLowerCase()>b[1].toLowerCase()) { return 1; }
    else if (a[1].toLowerCase()<b[1].toLowerCase()) { return -1; }
    else { return 0; }
  }

  function sortDescText(a,b) {
    if (a[1].toLowerCase()<b[1].toLowerCase()) { return 1; }
    else if (b[1].toLowerCase()<a[1].toLowerCase()) { return -1; }
    else { return 0; }
  }

  function sortPolls(pollArray,key,direction='asc') {
    //given data <pollArray>, sort by <key> in <direction>
    //returns 3D array with each element having [ID,sortedKey,data] so the sorted-by-key can be read by reading array data in order
    let sArr=[];
    pollArray.forEach((poll)=>{ sArr.push([poll['_id'],poll[key],poll]); });
    if (key==='pollName') { (direction==='asc') ? sArr=sArr.sort(sortAscText) : sArr=sArr.sort(sortDescText); }
    else { (direction==='asc') ? sArr=sArr.sort(sortAscNum) : sArr=sArr.sort(sortDescNum); }
    return sArr;
  }

  let headers=document.querySelectorAll('span.header');
  headers.forEach(h=>h.addEventListener('click',headerSort));
  function headerSort(e){
    if (e) {
      lastSortKey=currentSortKey;
      currentSortKey=e.target.id;
    }
    (currentSortDirection==='asc') ? currentSortDirection='desc' : currentSortDirection='asc';
    let sorted=sortPolls(Array.from(window.INITIAL_STATE.data),currentSortKey,currentSortDirection);
    generateRows(sorted);
    updateHeaders();
  }

  function generateRows(sRows) {
    let tBody=document.querySelector('table#pollList tbody');
    tBody.innerHTML=null;
    for (var i=0;i<sRows.length;i++){
      let expiresIn=sRows[i][2]['expiresOn']-Date.now();
      let expiryText;
      if (!sRows[i][2]['expiresOn']) { expiryText=`never expires`;}
      else { (expiresIn<=0) ? expiryText=`EXPIRED` : expiryText=`${Math.floor(expiresIn/(1000*60))} minute(s)`; }
      let row=document.createElement('tr');
      row.innerHTML+=`<td><a href="/p/${sRows[i][2]['hName']}">${sRows[i][2]['pollName']}</a></td> <td>${sRows[i][2]['totalVotes']}</td> <td>${sRows[i][2]['accessCt']}</td>`;
      row.innerHTML+=`<td>${expiryText}</td> <td><span id="delete"><a href="/d/${sRows[i][2]['hName']}">delete</a></span></td></tr>`;
      tBody.appendChild(row);
    }
  }

  function updateHeaders() {
    let now=document.querySelector(`span#${currentSortKey}`);
    let then=document.querySelector(`span#${lastSortKey}`);
    let arrow;
    (currentSortDirection==='asc') ? arrow='↑' : arrow='↓';
    now.textContent=`${now.dataset.title} ${arrow}`;
    if (then&&now!==then) {
      then.textContent=`${then.dataset.title}`;
    }
  }

//generate headers and rows with default values
  headerSort();
  updateHeaders();
}
