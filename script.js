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
    building = document.getElementById("building");
    var floorCount = document.getElementById("floorCount").value;
    var liftCount = document.getElementById("liftCount").value;
    if(!inputValidation(floorCount, liftCount)) {
        return;
    }
    var backBtnDiv = document.createElement('div');
    backBtnDiv.setAttribute("class", "backDiv");
    var backButton = document.createElement('button');
    backButton.innerHTML = 'Back';
    backBtnDiv.append(backButton);
    backButton.addEventListener('click', () => goBack());
    building.append(backBtnDiv);
    var floorsDiv = document.createElement('div');
    floorsDiv.style.marginTop = '50px';
    building.append(floorsDiv);
    inputDiv.style.display = "none";
    for(var i=floorCount-1; i>=0; i--) {
        var upBtn = document.createElement('button');
        upBtn.setAttribute("class", "liftBtn");
        upBtn.innerHTML = "<";
        var downBtn = document.createElement('button');
        downBtn.setAttribute("class", "liftBtn");
        downBtn.innerHTML = ">";
        if(i==0) {
            addFloor(i, upBtn, null);
        } else if (i==floorCount-1) {
            addFloor(i, null, downBtn);
        } else {
            addFloor(i, upBtn, downBtn);
        }
    }
    for(var i=0; i<liftCount; i++) {
        liftList.push(new Lift(i));
    }
    building.style.display = "block";
}

function inputValidation(floorCount, liftCount) {
    if(floorCount=='' || liftCount == '') {
        alert("Please specify no. of lifts and floors.");
        return false;
    }
    if(floorCount < 2 || liftCount < 1) {
        alert("Please specify atleast 2 floors and 1 lift.");
        return false;
    }
}

function goBack() {
    document.getElementById("floorCount").value = '';
    document.getElementById("liftCount").value = '';
    while (building.firstChild) {
        building.removeChild(building.firstChild);
    }
    inputDiv.style.display = "block";
    building.style.display = "none";
}

class Lift {
    constructor(id) {
        this.id = id;
        this.liftStatus = "idle";
        this.currentFloor = floorList[0];
        this.doorStatus = "closed";
        this.box = new LiftBox(id);
        floorList[0].floorDiv.append(this.box.liftBoxDiv);
    }
    move(newFloor) {
        this.liftStatus = "moving";
        var speed = newFloor.floorNumber > this.currentFloor.floorNumber ? 1 : -1;
        this.liftInterval = setInterval(() => this.updateBoxPosition(speed, newFloor), 20);
    }
    updateBoxPosition(speed, targetFloor) {
        if(targetFloor.yPosition == this.box.yPosition) {
            clearInterval(this.liftInterval);
            this.currentFloor = targetFloor;
            // console.log(new Date().getTime() + ": Lift " + this.id + " reached floor " + targetFloor.floorNumber);
            this.liftStatus = "stopped";
            setTimeout(() => this.openDoor(targetFloor.floorNumber), 500);
        } else {
            this.box.yPosition += speed;
            this.box.liftBoxDiv.style.top = - (this.box.yPosition + (this.box.yPosition/100)) + "px";
        }
    }
    openDoor(floor) {
        if(this.liftStatus == "moving") {
            // console.log(new Date().getTime() + ": Lift " + this.id + " is moving towards " + floor + "Cannot open door");
            return;
        }
        // console.log(new Date().getTime() + ": Opening door of lift " + this.id + " at floor " + this.currentFloor.floorNumber);
        this.doorStatus = "open";
        this.doorsInterval = setInterval(() => this.updateDoorPositions(-1, 0), 30);
        setTimeout(() => this.closeDoor(), 3500);
        setTimeout(() => this.idle(), 5500);
    }
    closeDoor() {
        // console.log(new Date().getTime() + ": Closing door");
        this.doorStatus = "closed";
        this.doorsInterval = setInterval(() => this.updateDoorPositions(1, 26.5), 30);
    }
    idle() {
        // console.log(new Date().getTime() + ": Going Idle");
        this.liftStatus = "idle";
    }
    updateDoorPositions(speed, target) {
        var leftDoor = this.box.liftBoxDiv.childNodes[0];
        var rightDoor = this.box.liftBoxDiv.childNodes[1];
        if(target == leftDoor.width) {
            clearInterval(this.doorsInterval);
        } else {
            leftDoor.width+=(0.5 * speed);
            leftDoor.style.width = leftDoor.width + 'px';
            rightDoor.width+=(0.5 * speed);
            rightDoor.left-=(0.5 * speed);
            rightDoor.style.left = rightDoor.left + 'px';
            rightDoor.style.width = rightDoor.width + 'px';
        }
    }
}

class LiftBox {
    liftId;
    xPosition;
    yPosition;
    height;
    width;
    liftBoxDiv;
    constructor(liftId) {
        this.liftId = liftId;
        this.yPosition = 0;
        var boxDiv = document.createElement('div');
        boxDiv.setAttribute("class", "liftBox");
        var leftDoor = document.createElement('div');
        var rightDoor = document.createElement('div');
        leftDoor.setAttribute("class", "leftDoor");
        leftDoor.width = 26.5;
        rightDoor.setAttribute("class", "rightDoor");
        rightDoor.width = 26.5;
        rightDoor.left = 28.5;
        boxDiv.append(leftDoor, rightDoor);
        this.liftBoxDiv = boxDiv;
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
    constructor(floorNumber, upBtn, downBtn) {
        this.floorNumber = floorNumber;
        this.yPosition = (floorNumber) * 100;
        this.floorDiv = document.createElement('div');
        this.floorDiv.setAttribute("class", "floor");
        var flrInfoDiv = document.createElement('div');
        var floorNumDiv = document.createElement('div');
        floorNumDiv.innerHTML = floorNumber;
        var btnsDiv = document.createElement('div');
        btnsDiv.setAttribute("class", "btns");
        if(upBtn!=null) {
            this.upButton = upBtn;
            this.upButton.addEventListener('click', () => this.callLift());
            btnsDiv.append(upBtn);
        }
        if(downBtn!=null) {
            this.downButton = downBtn;
            this.downButton.addEventListener('click', () => this.callLift());
            btnsDiv.append(downBtn);
        }
        flrInfoDiv.append(floorNumDiv   );
        flrInfoDiv.append(btnsDiv);
        this.floorDiv.append(flrInfoDiv);
    }
    callLift() {
        addRequestToQueue(this);
    }
}

function addRequestToQueue(requestSourceFloor) {
    requestQueue.push(requestSourceFloor);
    processTheEntries();
}

function processTheEntries() {
    if(schedulerStatus == "idle") {
        schedulerStatus = "busy";
        while(requestQueue.length > 0) {
            var requestFloor = requestQueue.shift();
            findNearestLift(requestFloor, function(nearestLift) {
                // console.log(new Date().getTime() + ": Nearest Lift to floor " + requestFloor.floorNumber + " is ", nearestLift.id);
                nearestLift.move(requestFloor);
            });
        }
        schedulerStatus = "idle";
    }
}

function findNearestLift(requestFloor, callback) {
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
    // console.log(new Date().getTime() + ": No idle lift found for floor " + requestFloor.floorNumber + ". Waiting for 2 secs to check again");
    setTimeout(() => {
      findNearestLift(requestFloor, callback);
    }, 2000);
  }
}

function addFloor(floorNumber, upBtn, downBtn) {
    var floor = new Floor(floorNumber, upBtn, downBtn);
    floorList.unshift(floor);
    building.childNodes[1].append(floor.floorDiv);
    return floor;
}