window.onload = function() {
  let choices={};
  let choiceBox=document.querySelector('div#choices');
  let choice=document.querySelector('input#choice');
  console.log(choice);
  choice.addEventListener('keydown', handleChoice);
  let message=document.querySelector('span#message');
  console.dir(message);

  function deleteChoice(e) {
    e.preventDefault();
    delete choices[e.target.id];
    updateChoiceBox();
  }

  function updateChoiceBox() {
    choiceBox.innerHTML=null;
    let c=Object.keys(choices);
    console.log(c);
    for (var i=0;i<c.length;i++){
      let s=document.createElement('span');
      s.classList.add('choice');
      s.innerHTML=`${c[i]} <a href="#" id="${c[i]}" class="remove">[remove]</a><br />`;
      choiceBox.appendChild(s);
    }
    let links=choiceBox.querySelectorAll('a');
    links.forEach((l)=>l.addEventListener('click', deleteChoice));
  }

  function handleChoice(e) {
    console.log(e.keyCode);
    console.log(choice.value);
    console.log(e.keyCode===13&&choice.value!=='');
    if (e.keyCode===13&&choice.value!=='') {
      console.log(e);
      let c=choice.value;
      c=c.replace(/\W/gi,' ');
      if(c.length>0) { choices[c.trim()]=1; } //don't add in the event that they enter only special characters and it's a blank string
      console.log(c===choice.value);
      if (c!==choice.value) { // message
        message.innerHTML=`Sorry, but special characters are not allowed.`;
        message.style.display='inline';
      }
      else {
        message.innerHTML=null;
        message.style.display='none';
      }
      choice.value=null;
      updateChoiceBox();
    }
  }

  let poll=document.querySelector('input#poll');
  let pName=document.querySelector('input#name');
  let form=document.querySelector('form#add');
  let button=document.querySelector('button#vote');

  button.addEventListener('mousedown', validateSubmit);
  form.addEventListener('submit', cancelIt);

  function cancelIt(e){
    e.preventDefault();
    return false;
  }

  function validateSubmit(e) {
    if (e.type==="mousedown") {
      console.log(e);
      let choicesToSubmit=Object.keys(choices);
      document.querySelector('input#choiceSubmit').value=choicesToSubmit;
      if (choicesToSubmit.length>1) {
        form.submit();
      }
      else {
        message.innerHTML=`Sorry, but you need at least two choices!`;
        message.style.display='inline';
      }
    }
    else {
      return;
    }
  }
}
