//Make connection
var socket = io.connect('http://localhost:4000');

//Query DOM
var output = document.getElementById('output');
var notice = document.getElementById('notice');
var list = document.getElementById('shift-list');
var orderWindow = document.getElementById('orders');
var notices = [];
var currentPos = 0;

var started = false;

//Listen for events
socket.on('users connected', function(data){
  output.innerHTML = '<p>Connections: ' + data + '</p>';
  socket.emit('notice request');
  socket.emit('shift request');
  socket.emit('order request');
});

//orders
socket.on('initial order', function(data){
  orderWindow.innerHTML ="";
  var i;
  for(i=0; i<data.length; i++){
    var logo = data[i].CustomerLogo;
    var custName = data[i].CustomerName;
    var itemCode = data[i].ItemCode;
    var itemName = data[i].ItemName;
    var produced = data[i].ProducedQuantity;
    var required = data[i].RequiredQuantity;
    var percentProduced;
    if (produced == 0){
      percentProduced = 0;
    }else{
      percentProduced = (produced/required)*100;
    }




    var entry = document.createElement('div');
    entry.className = "progress";
    var header = document.createElement('header');
    //header.className = "box-heading";
    header.appendChild(document.createTextNode(logo + "   " + custName + "   " + itemName));
    var bar = document.createElement('div');
    bar.className = "bar";
    var percent = document.createElement('div');
    percent.className = "percent";
    percent.appendChild(document.createTextNode(produced + " of " + required));
    percent.style.width = percentProduced.toString() + "%";
    console.log(percentProduced.toString());
    bar.appendChild(percent);
    entry.appendChild(header);
    entry.appendChild(bar);
    orderWindow.appendChild(entry);

  }
});

//Set first notice and setup interval to switch between notices
socket.on('initial notice', function(data){
  var rotation;
  notice.innerHTML ="";
  notices = data;
  notice.innerHTML = '<p>' + notices[0].FirstName + " " + notices[0].SecondName + ": " + notices[0].Description + '</p>';
  if(started){
    clearInterval(rotation);
    started = false;
  }
  rotation = setInterval(noticeRotation, 5000);
  started = true;
});

//Display employees on shift and color based on onsite or offsite
socket.on('initial shift', function(data){
  list.innerHTML ="";
  var i;
  for(i=0; i<data.length; i++){
    var firstName = data[i].FirstName;
    var secondName = data[i].SecondName;
    var entry = document.createElement('li');
    if(data[i].OnSiteStatus == 1){
      //green
      entry.style.color = '#b6dad2';
    }else{
      //red
      entry.style.color = '#dab6be';
    }
    entry.appendChild(document.createTextNode(firstName + " " + secondName));
    list.appendChild(entry);
  }
});

//Alternate between notices
function noticeRotation(){
  if(++currentPos >= notices.length){
    currentPos = 0;
  }
  notice.innerHTML = '<p>' + notices[currentPos].FirstName + " " + notices[currentPos].SecondName + ": " + notices[currentPos].Description + '</p>';
}
