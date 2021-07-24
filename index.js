var express = require('express');
var mysql = require('mysql');
var socket = require('socket.io');
var mySQLEvents = require('mysql-events');

//App setup
var app = express();
var server = app.listen(4000, function(){
  console.log('listening to requests on port 4000');
})

//Static files
app.use(express.static('public'));

//Socket setup
var io = socket(server);

//databse setup
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "********",
  port: 3307,
  database: "tropostestdb"
});

//database for watcher
var dsn = {
  host: "localhost",
  user: "root",
  password: "jo87363875",
  port: 3307
};

//Log errors with connecting to db
con.connect(function(err){
  if (err) throw err;
  console.log("Connected to mySQL!");
});

//Listener for MySQL changes
var mysqlEventWatcher = mySQLEvents(dsn);
//Notice listener
var noticeWatcher = mysqlEventWatcher.add('tropostestdb.notice', function(oldRow, newRow, event){
  //row inserted
  if(oldRow === null){
    console.log("Row Inserted");
    getNotices();
  }

  //row deleted
  if(newRow === null){
    console.log("Row Deleted");
    getNotices();
  }

  //row updated
  if(oldRow !== null && newRow !== null){
    console.log("Row Updated");
    getNotices();
  }
});

//Shift Listener
var shiftWatcher = mysqlEventWatcher.add('tropostestdb.shiftemployee', function(oldRow, newRow, event){
  //row inserted
  if(oldRow === null){
    console.log("Row Inserted");
    getShift();
  }

  //row deleted
  if(newRow === null){
    console.log("Row Deleted");
    getShift();
  }

  //row updated
  if(oldRow !== null && newRow !== null){
    console.log("Row Updated");
    getShift();
  }
});

//Order listener
var orderWatcher = mysqlEventWatcher.add('tropostestdb.ordertable', function(oldRow, newRow, event){
  //row inserted
  if(oldRow === null){
    console.log("Row Inserted");
    getOrders();
  }

  //row deleted
  if(newRow === null){
    console.log("Row Deleted");
    getOrders();
  }

  //row updated
  if(oldRow !== null && newRow !== null){
    console.log("Row Updated");
    getOrders();
  }
});


//Global variables
var socketCount = 0;

io.sockets.on('connection', function(socket){
  console.log('made socket connection', socket.id);
  //Socket has connected, increase socket count
  socketCount++;
  //Let all sockets know how many are Connected and show notices
  io.sockets.emit('users connected', socketCount);

  socket.on('notice request', function(){
    console.log("notice requested");
    getNotices();
  });
  socket.on('shift request', function(){
    console.log("shift requested");
    getShift();
  });
  socket.on('order request', function(){
    console.log("orders requested");
    getOrders();
  });

  socket.on('disconnect', function(){
    console.log('lost connection to ', socket.id);
    //Decrease the socket count on a disconnect and emit
    socketCount--;
    io.sockets.emit('users connected', socketCount);
  });
});

function getNotices(){
  con.query("SELECT FirstName, SecondName, Description FROM notice JOIN Employee ON notice.Author = employee.EmployeeID", function (err, results, fields){
    if(err) throw err;
    console.log(results);
    //res = listResults(results);
    io.sockets.emit('initial notice', results);
  });
};

function getShift(){
  con.query("SELECT Employee.FirstName, Employee.SecondName, ShiftEmployee.OnSiteStatus FROM ShiftEmployee JOIN Employee ON ShiftEmployee.EmployeeID = Employee.EmployeeID WHERE ShiftID = 1", function (err, results, fields){
    if(err) throw err;
    console.log(results);
    //res = listResults(results);
    io.sockets.emit('initial shift', results);
  });
}

function getOrders(){
  con.query("SELECT Customer.CustomerLogo, Customer.CustomerName, OrderTable.ItemCode, Product.ItemName, ProducedQuantity, RequiredQuantity  FROM (OrderTable JOIN Customer ON OrderTable.CustomerID = Customer.CustomerID) JOIN Product ON OrderTable.ItemCode = Product.ItemCode", function (err, results, fields){
    if(err) throw err;
    console.log(results);
    //res = listResults(results);
    io.sockets.emit('initial order', results);
  });
}

function listResults(result){
  var i;
  var len = result.length;
  var list = "";
  for(i=0; i<len; i++){
    list += result[i].Description + "<br>";
  }
  console.log(list);
  io.sockets.emit('initial notice', list);
  //return list;
}
