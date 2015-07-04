
var CANVAS_WIDTH = 640;
var CANVAS_HEIGHT = 480;
var CANVAS_FLIP = 'landscape';
var SCALE = CANVAS_HEIGHT/10;

var canvas;
var Game = {};
var Touch;
var lastTouch = new Vector2D(0,0);
var currBlock = new Vector2D(0,0);
var lastBlock = new Vector2D(0,0);
var backBlock = new Vector2D(0,0);
var dragBlock = new Vector2D(0,0);
var allMove = false;
var heldBlock = -1;
var Slide = new Vector2D(0,0);
var Press = false;
var Debug = {};

$(document).ready(function(){
    
    // GENERATE CANVAS
    var canvasElement = document.getElementById('game');
    canvas = canvasElement.getContext("2d");

    canvasElement.width = CANVAS_WIDTH;
    canvasElement.height = CANVAS_HEIGHT;
    
    // GENERATE GAMELOOP
    Game = {
        gems: 0,
        rails: 0,
        zones: 0,
        gem: {},
        rail: {},
        zone: {}
    };

    var FPS = 30;
    initiate();
    setInterval(function() {
        update();
        draw();
    }, 1000/FPS);
    
    canvasElement.addEventListener('mousemove', function(evt) {
        var rect = canvasElement.getBoundingClientRect();
        Touch = new Vector2D(evt.clientX - rect.left, evt.clientY - rect.top);
    }, false);
    
    $('#game').mousedown(function(){
        Press = true;
        lastTouch = Touch;
        dragBlock = Touch.align(SCALE);
        lastBlock = Touch.align(SCALE);
    });
    $('#game').mouseup(function(){
        Press = false;
        heldBlock = -1;
    });
    $('#game').mouseleave(function(){
        Press = false;
        heldBlock = -1;
    });
    $('#game').mouseout(function(){
        Press = false;
        heldBlock = -1;
    });
    
});

/*
 * *****************************************
 *      MATH OBJECTS
 * *****************************************
 */

function Vector2D(x,y) {
    this.x = x;
    this.y = y;
    this.length = Math.sqrt(Math.pow(this.x,2)+Math.pow(this.y,2));
    this.dir = Math.atan2(this.x,-this.y) * 180 / Math.PI;
    
    this.add = function(vector) {
        return new Vector2D(this.x+vector.x,this.y+vector.y);
    };
    
    this.sub = function(vector) {
        return new Vector2D(this.x-vector.x,this.y-vector.y);
    };
    
    this.diff = function(vector) {
        return new Vector2D(Math.abs(this.x-vector.x),Math.abs(this.y-vector.y));
    };
    
    this.same = function(vector) {
        if (this.x===vector.x && this.y===vector.y) {
            return true;
        } else {
            return false;
        }
    };
    
    this.notsame = function(vector) {
        if (this.x!==vector.x || this.y!==vector.y) {
            return true;
        } else {
            return false;
        }
    };
    
    this.align = function(width) {
        return new Vector2D(Math.round(this.x/width)*width,Math.round(this.y/width)*width);
    };
    
    this.swap = function() {
        x = this.x;
        y = this.y;
        this.x = y;
        this.y = x;
    };
    
    this.face = function() {
        if (this.dir>-45 && this.dir<=45) {
            return new Vector2D(0,1); // DOWN
        } else if (this.dir>45 && this.dir<=135){
            return new Vector2D(-1,0); // LEFT
        } else if (this.dir>-135 && this.dir<=-45) {
            return new Vector2D(1,0); // RIGHT
        } else {
            return new Vector2D(0,-1); // UP
        }
    };
    
    this.slide = function(length) {
        if (this.length<length){
            return new Vector2D(0,0); // STAY
        }
        if (this.dir>-45 && this.dir<=45) {
            return new Vector2D(0,1); // DOWN
        } else if (this.dir>45 && this.dir<=135){
            return new Vector2D(-1,0); // LEFT
        } else if (this.dir>-135 && this.dir<=-45) {
            return new Vector2D(1,0); // RIGHT
        } else {
            return new Vector2D(0,-1); // UP
        }
    };
    
    this.scale = function(scale) {
        return new Vector2D(this.x*scale,this.y*scale);
    };
}

function Area2D(x,y,w,h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    
    this.add = function(area) {
        return new Area2D(this.x+area.x,this.y+area.y,this.w+area.w,this.h+area.h);
    };
    
    this.swap = function() {
        x = this.x;
        y = this.y;
        w = this.w;
        h = this.h;
        this.x = y;
        this.y = x;
        this.w = h;
        this.h = w;
    };
    
    this.inside = function(vector) {
        if (vector.x>=this.x &&
            vector.x<this.x+this.w &&
            vector.y>=this.y &&
            vector.y<this.y+this.h) {
            return true;
        } else {
            return false;
        }
    };
    
    this.expand = function(vector) {
        return new Area2D(this.x,this.y,this.w+vector.x,this.h+vector.y);
    };
    
    this.shift = function(vector) {
        return new Area2D(this.x+vector.x,this.y+vector.y,this.w,this.h);
    };
    
    this.draw = function(color) {
        canvas.fillStyle = color;
        canvas.fillRect(this.x,this.y,this.w,this.h);
    };
    
    this.outline = function(color,width) {
        canvas.fillStyle = color;
        canvas.fillRect(this.x,this.y,this.w,width); // UP
        canvas.fillRect(this.x+this.w-width,this.y,width,this.h); // RIGHT
        canvas.fillRect(this.x,this.y+this.h-width,this.w,width); // DOWN
        canvas.fillRect(this.x,this.y,width,this.h); // LEFT
    };
}

/*
 * *****************************************
 *      BASIC METHODS
 * *****************************************
 */

var All = {
    gems: {
        each: function(each) {
            for (i=0;i<Game.gems;i++){
                each(i);
            }
        },
        row: function(n,each) {
            for (i=0;i<Game.gems;i++){
                if (Game.gem[i].point.y===n) {
                    each(i);
                }
            }
        },
        col: function(n,each) {
            for (i=0;i<Game.gems;i++){
                if (Game.gem[i].point.x===n) {
                    each(i);
                }
            }
        }
    },
    rails: function(each) {
        for (i=0;i<Game.rails;i++){
            each(i);
        }
    },
    zones: function(each) {
        for (i=0;i<Game.zones;i++){
            each(i);
        }
    }
};

/*
 * *****************************************
 *      MAIN METHODS
 * *****************************************
 */

function initiate() {
    Game.gem[0] = new Gem('ruby',new Vector2D(0,1));
    Game.gem[1] = new Gem('saphire',new Vector2D(1,0));
    Game.gem[2] = new Gem('emerald',new Vector2D(2,1));
    Game.gem[3] = new Gem('topaz',new Vector2D(3,2));
    Game.gem[4] = new Gem('moonstone',new Vector2D(4,3));
    Game.gem[5] = new Gem('diamond',new Vector2D(5,4));
    Game.gem[6] = new Gem('rock',new Vector2D(6,5));
    Game.gem[7] = new Gem('diamond',new Vector2D(7,6));
    Game.gem[8] = new Gem('rock',new Vector2D(8,7));
    Game.gem[9] = new Gem('rock',new Vector2D(9,8));
    Game.gem[10] = new Gem('rock',new Vector2D(10,7));
    
    // TODO make a puzzle generator based on a JSON file.
}

function update() {
    var checkBlock = new Vector2D(Math.round(Touch.x/SCALE)*SCALE,Math.round(Touch.y/SCALE)*SCALE);
    var blockDiff = dragBlock.diff(currBlock).length/SCALE;
    if (checkBlock.same(dragBlock)) {
        dragBlock = currBlock;
    }
    if (checkBlock.notsame(currBlock)) {
        lastBlock = currBlock;
    }
    Debug.diff = dragBlock.diff(currBlock).length/SCALE;
    Debug.moveface = dragBlock.diff(currBlock).length/SCALE>1;
    if (dragBlock.same(lastBlock)) {
        Slide = dragBlock.sub(currBlock).slide(SCALE/2);
    } else {
        Slide = dragBlock.sub(lastBlock).slide(SCALE/2);
    }
    if (checkBlock.same(dragBlock)) {
        Slide = new Vector2D(0,0);
    }
    if (dragBlock.notsame(currBlock)) {
        dragBlock = dragBlock.add(Slide.scale(SCALE));
    }
    if (blockDiff>1) {
        lastBlock = currBlock.add(currBlock.sub(lastBlock).face().scale(SCALE));
    }
    currBlock = checkBlock;
    
    
    
    
    
    All.gems.each(function(i){
        Game.gem[i].update();
    });
    All.rails(function(i){
        Game.rail[i].update();
    });
    All.zones(function(i){
        Game.zone[i].update();
    });
    
}

function draw() {
    canvas.fillStyle = '#FFF';
    canvas.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    
    canvas.fillStyle = "#000";
    canvas.font = "bold 10px Arial";
    var text;
    switch (Slide.y){
        case -1:
            text = "up";
            break;
        case 1:
            text = "down";
            break;
        default:
            switch (Slide.x){
                case -1:
                    text = "left";
                    break;
                case 1:
                    text = "right";
                    break;
                case 0:
                    text = "stay";
                    break;
            }
            break;
    }
    canvas.fillText(text+", "+Debug.diff+", "+Debug.moveface,3,8);
    canvas.fillText("("+((lastBlock.x/SCALE)-1)+","+((lastBlock.y/SCALE)-1)+")",3,20);
    canvas.fillText("("+((currBlock.x/SCALE)-1)+","+((currBlock.y/SCALE)-1)+")",3,32);
    canvas.fillText("("+((dragBlock.x/SCALE)-1)+","+((dragBlock.y/SCALE)-1)+")",3,44);
    canvas.fillText(heldBlock,3,56);
    
    
    All.gems.each(function(i){
        Game.gem[i].draw();
    });
    All.rails(function(i){
        Game.rail[i].draw();
    });
    All.zones(function(i){
        Game.zone[i].draw();
    });
    
    /*
    canvas.fillStyle = "#0F0";
    canvas.fillRect(lastTouch.x-5,lastTouch.y-5,10,10);
    
    canvas.fillStyle = "#0FF";
    canvas.fillRect(dragBlock.x-7,dragBlock.y-7,14,14);
    
    canvas.fillStyle = "#666";
    canvas.fillRect(lastBlock.x-5,lastBlock.y-5,10,10);
    
    canvas.fillStyle = "#333";
    canvas.fillRect(currBlock.x-5,currBlock.y-5,10,10);
    
    /*canvas.fillStyle = "#000";
    canvas.beginPath();
    canvas.moveTo(lastTouch.x,lastTouch.y);
    canvas.lineTo(Touch.x,Touch.y);
    canvas.stroke();
    
    canvas.fillStyle = "#000";
    canvas.fillRect(Touch.x-2,Touch.y-2,4,4);
    */
}



/*
 * *****************************************
 *      GAME OBJECTS
 * *****************************************
 */

function Gem(type,point) {
    this.id = Game.gems+1;
    Game.gems++;
    this.point = point;
    this.psudo = point;
    this.type = type;
    this.held = false;
    this.sliding = false;
    this.up = false;
    this.down = false;
    this.left = false;
    this.right = false;
    
    this.update = function() {
        
        var touch = new Area2D((this.point.x*SCALE)+(SCALE/2),(this.point.y*SCALE)+(SCALE/2),SCALE,SCALE);
        
        if (Press && touch.inside(Touch)) {
            if (heldBlock===-1) {
                All.gems.each(function (i){
                    Game.gem[i].held = false;
                });
                heldBlock = this.id;
                this.held = true;
            }
        }
        
        if (this.held) {
            this.hold();
        }
        
        if (this.sliding) {
            this.slide();
        }
        
    };
    
    this.hold = function() {
        
        
        //this.point = this.point.scale(SCALE).scale(1/SCALE).sub(sub).add(Slide);
        //this.point = dragBlock.sub(sub).scale(1/SCALE);
        var sub = new Vector2D(1,1);
        if (this.point.scale(SCALE).same(currBlock)) {
            this.point = currBlock.scale(1/SCALE).sub(sub);
        } else {
            this.point = this.point.add(Slide);
        }
        
        All.gems.each(function(i){
            Game.gem[i].sliding = false;
        });
        All.gems.row(this.point.y,function(i){
            Game.gem[i].sliding = true;
        });
        All.gems.col(this.point.x,function(i){
            Game.gem[i].sliding = true;
        });
        this.sliding = false;
        
        if (!Press){
            this.held = false;
        }
    };
    
    this.slide = function() {
        
        /*if (allMove) {
            this.point = this.point.add(Slide);
        }*/
        
        var sub = new Vector2D(1,1);
        if (this.point.scale(SCALE).same(currBlock)) {
            this.point = currBlock.scale(1/SCALE).sub(sub);
        } else {
            this.point = this.point.add(Slide);
        }
        
        //var sub = new Vector2D(1,1);
        //var offset = dragBlock.sub(this.point.scale(SCALE));
        //this.point = this.point.scale(SCALE).add(offset).scale(1/SCALE).sub(sub);
        
        //var sub = new Vector2D(SCALE,SCALE);
        //this.point = dragBlock.sub(sub).scale(1/SCALE);
        
        // TODO fix how gems slide, they currently just shift upwards, also check the slide value, it might be wonky
        // Maybe make an offset vector using currBlock relative to this.point and maintain that relativity
        
        if (!Press || (currBlock.x!==this.point.x && currBlock.y!==this.point.y)){
            this.sliding = false;
        }
    };
    
    this.draw = function() {
        var touch = new Area2D((this.point.x*SCALE)+(SCALE/2),(this.point.y*SCALE)+(SCALE/2),SCALE,SCALE);
        if (Press && touch.inside(Touch)) {
            touch.outline("#0FF",1);
        } else {
            touch.outline("#08F",1);
        }
        switch (this.type) {
            case 'ruby':        canvas.fillStyle = "#FF2222";break;
            case 'saphire':     canvas.fillStyle = "#0044FF";break;
            case 'emerald':     canvas.fillStyle = "#00FF00";break;
            case 'topaz':       canvas.fillStyle = "#FFD700";break;
            case 'moonstone':   canvas.fillStyle = "#FFA500";break;
            case 'diamond':     canvas.fillStyle = "#00DDFF";break;
            case 'rock':        canvas.fillStyle = "#607080";break;
        }
        canvas.fillRect((this.point.x*SCALE)+(SCALE/2)+5,(this.point.y*SCALE)+(SCALE/2)+5,SCALE-10,SCALE-10);
        canvas.fillStyle = "#000";
        canvas.font = "bold 10px Arial";
        var textLoc = new Vector2D((this.point.x*SCALE)+(SCALE/2)+7,(this.point.y*SCALE)+(SCALE/2)+15);
        canvas.fillText("("+this.point.x+","+this.point.y+")",textLoc.x,textLoc.y);
        canvas.fillText("H:"+this.held,textLoc.x,textLoc.y+11);
        canvas.fillText("S:"+this.sliding,textLoc.x,textLoc.y+22);
    };
}

function Rail(point,up,right,down,left) {
    this.id = Game.rails+1;
    Game.rails++;
    this.point = point;
    this.up = up;
    this.down = down;
    this.left = left;
    this.right = right;
    
    this.update = function() {
        
    };
    
    this.draw = function() {
        
    };
}

function Zone(type,point) {
    this.id = Game.zone+1;
    Game.zone++;
    this.point = point;
    this.type = type;
    
    this.update = function() {
        
    };
    
    this.draw = function() {
        
    };
}

