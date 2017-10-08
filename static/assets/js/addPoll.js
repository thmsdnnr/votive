window.onload = function() {
  let choices={};
  let choiceBox=document.querySelector('div#choices');
  let choice=document.querySelector('input#choice');
  let timeToVote=document.querySelector('input#ttv');
  choice.addEventListener('keydown', handleChoice);
  let message=document.querySelector('span#message');

  function deleteChoice(e) {
    e.preventDefault();
    delete choices[e.target.id];
    updateChoiceBox();
  }

  function updateChoiceBox() {
    choiceBox.innerHTML=null;
    let c=Object.keys(choices);
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
    if (e.keyCode===13&&choice.value!=='') {
      let c=choice.value;
      c=c.replace(/\W/gi,' ');
      if(c.length>0) { choices[c.trim()]=1; } //don't add in the event that they enter only special characters and it's a blank string
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
  let button=document.querySelector('button#sub');

  button.addEventListener('mousedown', validateSubmit);
  form.addEventListener('submit', cancelIt);

  function cancelIt(e){
    e.preventDefault();
    return false;
  }

  function validateSubmit(e) {
    if (e.type==="mousedown") {
      let choicesToSubmit=Object.keys(choices);
      document.querySelector('input#choiceSubmit').value=choicesToSubmit;
      if (!pName.value||!pName.value.match(/[0-9a-z]/gi)) {
        message.innerHTML=`Sorry, but your poll must have a title!<br />`;
        message.style.display='inline';
        return false;
      }
      else if (choicesToSubmit.length<2) {
        message.innerHTML=`Sorry, but you need at least two choices!<br />`;
        message.style.display='inline';
        return false;
      }
      else if (timeToVote.value) {
        if (timeToVote.value<=1) {
        message.innerHTML=`Sorry, but you have to give people time to vote!<br />`;
        message.style.display='inline';
        return false;
        }
        else if (timeToVote.value>8766) {
          message.innerHTML=`Sorry, but you can only run polls for a maximum of one year.<br />`;
          message.style.display='inline';
          return false;
        }
      }
      pName.value=pName.value.trim();
      form.submit();
    }
  }
}
