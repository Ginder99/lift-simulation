var requestQueue;
var liftList;
var floorList;
var schedulerStatus;
var building;
var inputDiv;

function initializeSimulator() {
    console.log("Initializing simulator");
    requestQueue = [];
    liftList = [];
    floorList = [];
    schedulerStatus = "idle";
    building = document.getElementById("building");
    inputDiv = document.getElementById("input");
    inputDiv.style.display = "none";
    building = document.getElementById("building");
    var floorCount = parseInt(document.getElementById("floorCount").value);
    for(var i=floorCount-1; i>=0; i--) {
        var upBtn = document.createElement('button');
        upBtn.innerHTML = "Up";
        var downBtn = document.createElement('button');
        downBtn.innerHTML = "Down";
        if(i==0) {
            addFloor(i, upBtn, null);
        } else if (i==floorCount-1) {
            addFloor(i, null, downBtn);
        } else {
            addFloor(i, upBtn, downBtn);
        }
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
        this.box = new LiftBox(id);
    }
    move(newFloor) {
        this.liftStatus = "moving";
        var speed = newFloor.floorNumber > this.currentFloor.floorNumber ? 1 : -1;
        this.interval = setInterval(() => this.updateBoxPosition(speed, newFloor), 40);
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
        setTimeout(() => this.closeDoor(), 2500);
    }
    closeDoor() {
        console.log("Closing door");
        this.doorStatus = "closed";
    }
}

class LiftBox {
    liftId;
    xPosition;
    yPosition;
    height;
    width;
    constructor(liftId) {
        this.liftId = liftId;
        this.yPosition = 0;
        this.xPosition = liftId * 100;
    }
}

class LiftRequest {
    requestFloor;
    requestDirection;
}

class Floor {
    floorNumber;
    upButton;
    downButton;
    yPosition;
    floorDiv;
    constructor(floorNumber, upBtnDiv, downBtnDiv) {
        this.floorNumber = floorNumber;
        this.yPosition = (floorNumber) * 100;
        var newDiv = document.createElement('div');
        newDiv.setAttribute("class", "floor");
        var floorNum = document.createElement('p');
        floorNum.innerHTML = "Floor " + floorNumber;
        newDiv.append(floorNum);
        if(upBtnDiv!=null) {
            this.upButton = upBtnDiv;
            this.upButton.addEventListener('click', () => this.callLift());
            newDiv.append(upBtnDiv);
        }
        if(downBtnDiv!=null) {
            this.downButton = downBtnDiv;
            this.downButton.addEventListener('click', () => this.callLift());
            newDiv.append(downBtnDiv);
        }
        this.floorDiv = newDiv;
    }
    callLift() {
        // console.log("Calling lift");
        addRequestToQueue(this);
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
    if (liftList[i].liftStatus == "idle") {
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

function addFloor(floorNumber, upBtn, downBtn) {
    var floor = new Floor(floorNumber, upBtn, downBtn);
    floorList.unshift(floor);
    building.append(floor.floorDiv);
    return floor;
}