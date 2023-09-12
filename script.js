var requestQueue = [];
var liftList = [];
var floorList = [];
var schedulerStatus = "idle";


var liftXOrigin = 50;
var bHeight = 800;
var bWidth = 600;
var xOrigin = 20;
var yOrigin = -40;

var myBuilding = {
    canvas : document.createElement("canvas"),
    build : function() {
        this.canvas.width = bWidth;
        this.canvas.height = bHeight;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.frameNo = 0;
        this.interval = setInterval(updateCanvas, 30);
    },
    stop : function() {
        clearInterval(this.interval);
    },    
    clear : function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

function updateCanvas() {
    myBuilding.clear();
    for(var i=0; i<floorList.length; i++) {
        floorList[i].drawFloor();
    }
    for(var i=0; i<liftList.length; i++) {
        liftList[i].box.update();
    }
}


class LiftBox {
    liftId;
    xPosition;
    yPosition;
    height;
    width;
    ctx;
    constructor(liftId, height, width) {
        this.liftId = liftId;
        this.height = height;
        this.width = width;
        this.yPosition = yOrigin + bHeight;
        this.xPosition = liftXOrigin + (liftId * 100);
    }
    update() {
        var ctx = myBuilding.context;
        ctx.save();
        ctx.translate(this.xPosition, this.yPosition);
        ctx.fillStyle = "blue";
        ctx.fillRect(this.width / -2, this.height / -2, this.width, this.height);        
        ctx.restore();  
    }
}

function initializeSimulator() {
    myBuilding.build();
    console.log("Initializing simulator");
    var floorCount = document.getElementById("floorCount").value;
    for(var i=0; i<floorCount; i++) {
        var floor = new Floor(i);
        floor.drawFloor();
        floorList.push(floor);
    }
    var liftCount = document.getElementById("liftCount").value;
    for(var i=0; i<liftCount; i++) {
        liftList.push(new Lift(i));
    }
}

class Lift {
    id;
    liftStatus;
    currentFloor;
    doorStatus;
    box;
    interval;
    constructor(id) {
        this.id = id;
        this.liftStatus = "idle";
        this.currentFloor = floorList[0];
        this.doorStatus = "closed";
        this.box = new LiftBox(id, 50, 25);
    }
    move(newFloor) {
        this.liftStatus = "moving";
        var speed = newFloor.floorNumber > this.currentFloor.floorNumber ? -1 : 1;
        this.interval = setInterval(() => this.updateBoxPosition(speed, newFloor), 20);
    }
    updateBoxPosition(speed, targetFloor) {
        if(targetFloor.yPosition == this.box.yPosition) {
            // console.log("Clearing interval");
            clearInterval(this.interval);
            this.liftStatus = "idle"; // Need to decide where to set the lift to idle.
            this.currentFloor = targetFloor;
            console.log(new Date().getTime() + ": Lift " + this.id + " reached floor " + targetFloor.floorNumber);
            setTimeout(() => this.openDoor(targetFloor.floorNumber), 500);
        } else {
            this.box.yPosition += speed;
        }
    }
    openDoor(floor) {
        if(this.liftStatus != "idle") {
            console.log(new Date().getTime() + ": Lift " + this.id + " is moving towards " + floor + "Cannot open door");
            return;
        }
        console.log(new Date().getTime() + ": Opening door of lift " + this.id + " at floor " + this.currentFloor.floorNumber);
        this.doorStatus = "open";
    }
    closeDoor() {
        console.log("Closing door");
        this.doorStatus = "closed";
    }
}

class LiftRequest {
    requestFloor;
    requestDirection;
}
class Button {
    xPosition;
    yPosition;
    width;
    height;
    constructor(x, y, w, h) {
        this.xPosition = x;
        this.yPosition = y;
        this.width = w;
        this.height = h;
    }
    drawButtons(xfloorOffset, yfloorOffset) {
        var ctx = myBuilding.context;
        ctx.save();
        ctx.translate(xfloorOffset, yfloorOffset);
        ctx.fillStyle = "yellow";
        ctx.fillRect(this.xPosition, this.yPosition, this.width, this.height);
        ctx.restore(); 
    }
}
class Floor {
    floorNumber;
    upButton;
    downButton;
    yPosition;
    constructor(floorNumber) {
        this.floorNumber = floorNumber;
        this.yPosition = yOrigin + bHeight - (floorNumber) * 100;
        this.upButton = new Button(0, this.yPosition, 20, 10);
        this.downButton = new Button(0, this.yPosition + 15, 20, 10);
    }
    callLift() {
        // console.log("Calling lift");
        var requestSourceFloor = this;
        addRequestToQueue(requestSourceFloor);
    }
    drawFloor() {
        var ctx = myBuilding.context;
        ctx.save();
        ctx.translate(0, this.yPosition - yOrigin);
        ctx.fillRect(1/-2, 1 / -2, bWidth-30, 1);
        ctx.restore();
        this.upButton.drawButtons(10, -15);
        this.downButton.drawButtons(10, -15);
    }
}

function addRequestToQueue(requestSourceFloor) {
    // console.log("Adding request to queue");
    requestQueue.push(requestSourceFloor);
    processTheEntries();
}

function processTheEntries() {
    if(schedulerStatus == "idle") {
        // console.log("Total requests in queue: " + requestQueue.length);
        schedulerStatus = "busy";
        while(requestQueue.length > 0) {
            var requestFloor = requestQueue.shift();
            // console.log("Processing request for floor " + requestFloor.floorNumber);
            findNearestLift(requestFloor, function(nearestLift) {
                console.log(new Date().getTime() + ": Nearest Lift to floor " + requestFloor.floorNumber + " is ", nearestLift.id);
                nearestLift.move(requestFloor);
            });
        }
        schedulerStatus = "idle";
    }
}

function findNearestLift(requestFloor, callback) {
  // console.log(liftList);
  var nearestLift = null;
  var minDistance = floorList.length;
  
  for (var i = 0; i < liftList.length; i++) {
    if (liftList[i].liftStatus == "idle" && liftList[i].currentFloor.floorNumber!=requestFloor.floorNumber) {
      var distance = Math.abs(requestFloor.floorNumber - liftList[i].currentFloor.floorNumber);
      if (distance < minDistance) {
        minDistance = distance;
        nearestLift = liftList[i];
      }
    }
  }

  if (nearestLift !== null) {
    callback(nearestLift);
  } else {
    console.log(new Date().getTime() + ": No idle lift found for floor " + requestFloor.floorNumber + ". Waiting for 2 secs to check again");
    setTimeout(() => {
      findNearestLift(requestFloor, callback);
    }, 2000);
  }
}

function addNewLift() {
    liftList.push(new Lift(liftList.length+1));
}

function addNewFloor() {
    floorList.push(new Floor(floorList.length+1));
}