
var CANVAS_WIDTH = 1010; // 640 // 1010 // 480
var CANVAS_HEIGHT = 660; // 480 // 660 // 320
var CANVAS_FLIP = 'landscape';
var SCALE = CANVAS_HEIGHT/10;

var canvas;
var Game = {};
var puzzles = [];
for (i=0;i<33;i++){
    puzzles[i] = ''+(i+1)+'';
}
var victoryProgress = [];
for (var i in puzzles){
    victoryProgress[i] = false;
}
var Touch = new Vector2D(0,0);
var Slide = new Vector2D(0,0);
var pressTrail = [];
var progress = 0;
var Press = false;
var Tap = false;
var Debug = {};
var MENU = new Menu();
var EDIT = new Edit();
var victory = false;
var victoryDrawn = false;



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

    var FPS = 60;
    initiate();
    setInterval(function() {
        update();
        draw();
    }, 1000/FPS);
    
    canvasElement.addEventListener('mousemove', function(evt) {
        var rw = document.getElementById('game').offsetWidth;
        var rh = document.getElementById('game').offsetHeight;
        var rect = canvasElement.getBoundingClientRect();
        Touch = new Vector2D((evt.clientX*(CANVAS_WIDTH/rw)) - rect.left, (evt.clientY*(CANVAS_HEIGHT/rh)) - rect.top);
    }, false);
    
    canvasElement.addEventListener('touchmove', function(evt){
        evt.preventDefault();
        setTouch(evt);
    },false);
    
    canvasElement.addEventListener('touchstart', function(evt){
        evt.preventDefault();
        setTouch(evt);
        press();
    },false);
    
    canvasElement.addEventListener('touchend', function(evt){
        evt.preventDefault();
        setTouch(evt);
        unPress();
    },false);
    
    canvasElement.addEventListener('touchcancel', function(evt){
        evt.preventDefault();
        setTouch(evt);
        unPress();
    },false);
    
    canvasElement.addEventListener('touchleave', function(evt){
        evt.preventDefault();
        setTouch(evt);
        unPress();
    },false);
    
    $('#game').mousedown(function(){
        press();
    });
    $('#game').mouseup(function(){
        unPress();
    });
    $('#game').mouseleave(function(){
        unPress();
    });
    $('#game').mouseout(function(){
        unPress();
    });
    
});

function setTouch(evt){
    var canvasElement = document.getElementById('game');
    var touches = evt.changedTouches;
    var last = touches[touches.length-1];
    var rect = canvasElement.getBoundingClientRect();
    var rw = document.getElementById('game').offsetWidth;
    var rh = document.getElementById('game').offsetHeight;
    Touch = new Vector2D((last.pageX*(CANVAS_WIDTH/rw)) - rect.left,(last.pageY*(CANVAS_HEIGHT/rh)) - rect.top);
}

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
        return new Vector2D(y,x);
    };
    
    this.reverse = function() {
        return new Vector2D(this.x*-1,this.y*-1);
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
    
    this.scale = function(scale) {
        return new Area2D(this.x*scale,this.y*scale,this.w*scale,this.h*scale);
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
 *      GRAPHIC OBJECTS
 * *****************************************
 */

function Sprite(x,y,src) {
    
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

function foreach(limit,each) {
    for (i=0;i<limit;i++){
        each(i);
    }
}

function isset(val) {
    if (typeof(val) !== "undefined" && val !== null) {
        return true;
    } else {
        return false;
    }
}

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function press() {
    Press = true;
    Tap = true;
}

function unPress() {
    Press = false;
    Tap = false;
    pressTrail = [];
    progress = 0;
}

function loadPuzzle(name) {
    unloadPuzzle();
    iniPuzzMenu();
    victory = false;
    //var raw = $.getJSON('puzzles/'+name+'.json');
    //var puzzle = raw.data;
    //console.log(raw);
    $.ajax({
        url: 'puzzles/'+name+'.json',
        dataType: 'text',
        success: function(data) {
            var puzzle = JSON.parse(data);
            foreach(puzzle.zone.length,function(i){
                Game.zone[i] = new Zone(
                        puzzle.zone[i].type,
                        new Vector2D(puzzle.zone[i].point.x,puzzle.zone[i].point.y)
                    );
            });
            foreach(puzzle.gem.length,function(i){
                Game.gem[i] = new Gem(
                        puzzle.gem[i].type,
                        new Vector2D(puzzle.gem[i].point.x,puzzle.gem[i].point.y)
                    );
            });
            foreach(puzzle.rail.length,function(i){
                Game.rail[i] = new Rail(
                        new Vector2D(puzzle.rail[i].point.x,puzzle.rail[i].point.y),
                        puzzle.rail[i].up,
                        puzzle.rail[i].down,
                        puzzle.rail[i].left,
                        puzzle.rail[i].right
                    );
            });
            Game.name = puzzle.name;
        }
    });
    
}

function unloadPuzzle() {
    Game = {
        gems: 0,
        rails: 0,
        zones: 0,
        gem: {},
        rail: {},
        zone: {}
    };
}

function iniList() {
    unloadPuzzle();
    MENU.clear();
    MENU.mode = 'list';
    MENU.add(
        new Area2D(
            CANVAS_WIDTH-(SCALE/2)-(SCALE*2),
            CANVAS_HEIGHT-(SCALE*3),
            SCALE*2,
            SCALE*1
            ),
        '#DDD','previous',true,function(){
            MENU.prev();
        });
    MENU.add(
        new Area2D(
            CANVAS_WIDTH-(SCALE/2)-(SCALE*2),
            CANVAS_HEIGHT-(SCALE/2)-(SCALE*1),
            SCALE*2,
            SCALE*1
            ),
        '#DDD','next',true,function(){
            MENU.next();
        });
    var xo = 0;
    var yo = 0;
    var po = 0;
    for (k=0;k<puzzles.length;k++){
        
        
        var puzz = puzzles[k];
        var c = '#E66';
        if (victoryProgress[k+1]){
            c = '6E6';
        }
        MENU.add(
            new Area2D(
                (SCALE/4)+((xo)*(SCALE*2)),
                (SCALE/4)+((yo)*(SCALE*2))+((po)*(CANVAS_HEIGHT)),
                SCALE*1.8,
                SCALE*1.8
                ),
            c,puzz,true,function(){
                iniPuzzMenu();
            });
        
        xo++;
        if (xo>5){
            xo = 0;
            if (yo>2) {
                yo = 0;
                po++;
            } else {
                yo++;
            }
        }
    }
}

function iniPuzzMenu() {
    MENU.clear();
    MENU.mode = 'puzz';
    MENU.add(
        new Area2D(
            CANVAS_WIDTH-(SCALE/2)-(SCALE*2),
            CANVAS_HEIGHT-(SCALE*3),
            SCALE*2,
            SCALE*1
            ),
        '#DDD','restart',true,function(){
            loadPuzzle(MENU.currentPuzzle);
        });
    MENU.add(
        new Area2D(
            CANVAS_WIDTH-(SCALE/2)-(SCALE*2),
            CANVAS_HEIGHT-(SCALE/2)-(SCALE*1),
            SCALE*2,
            SCALE*1
            ),
        '#DDD','menu',true,function(){
            iniList();
        });
    if (EDIT.active) {
        EDIT.menu();
    }
}

/*
 * *****************************************
 *      MAIN METHODS
 * *****************************************
 */

function initiate() {
    /*
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
    
    Game.zone[0] = new Zone('ruby',new Vector2D(1,2));
    
    Game.rail[0] = new Rail(new Vector2D(2,2),false,false,true,false);
    Game.rail[1] = new Rail(new Vector2D(1,2),false,false,false,true);
    Game.rail[2] = new Rail(new Vector2D(8,2),false,false,false,false);
    */
    
    
    // TODO: design puzzles for testing
    
    // TODO LATER: graphics and sound
    
    iniList();
    MENU.limit = Math.ceil(puzzles.length/(4*6))-1;
            
    //loadPuzzle('2');
    
}

function update() {
    
    if (Press){
        var current = Touch.align(SCALE);
        if (pressTrail.length!==0) {
            var trail = pressTrail[pressTrail.length-1];
            if (current.notsame(trail)){
                // if moved by more than one step
                if (trail.diff(current).length>SCALE) {
                    var dir = current.sub(trail).dir;
                    // if moving not diagnoally
                    if (dir===180 || dir===0 || dir===90 || dir===-90) {
                        // iterate points until destination is reached
                        var face = trail.sub(current).face();
                        var it = pressTrail.length;
                        while (current.notsame(pressTrail[it-1])){
                            it = pressTrail.length;
                            pressTrail[it] = pressTrail[it-1].add(face.scale(SCALE));
                        }
                    } else {
                        unPress();
                    }
                } else {
                    // continue normally
                    pressTrail[pressTrail.length] = current;
                }
            }
        } else {
            pressTrail[0] = current;
        }
    }
    
    if (EDIT.active){
        victory = false;
    }
    
    if (victory && !victoryDrawn && MENU.mode === 'puzz'){
        MENU.add(
        new Area2D(
            CANVAS_WIDTH-(SCALE/2)-(SCALE*2),
            (SCALE/2),
            SCALE*2,
            SCALE*6
            ),
        '#1A1','Solved!',true,function(){
            if (puzzles.length===MENU.currentPuzzle) {
                iniList();
            } else {
                MENU.currentPuzzle++;
                loadPuzzle(MENU.currentPuzzle);
            }
        });
        victoryProgress[MENU.currentPuzzle] = true;
        victoryDrawn = true;
        victory = false;
    }
    
    if (!victory) {
        while (pressTrail.length-1>progress){
            var a = pressTrail[pressTrail.length-2];
            var b = pressTrail[pressTrail.length-1];
            var face = a.sub(b).face();
            var go = true;
            if (!EDIT.active) {
            //console.log('##### PROGRESSING #####');
            Debug.goNum = 0;
            Debug.num = 0;
            Debug.sub = 0;
            Debug.i = 0;
            if (a.x===b.x){ // if virtical
                /*All.gems.col((a.x/SCALE)-1,function(i){
                    Debug.sub++;
                    var g = Game.gem[i];
                    if (!g.check(face)) {
                        go = false;
                        Debug.goNum++;
                    }
                    Debug.num++;
                });
                All.gems.col((a.x/SCALE)-1,function(i){
                    if (go) {
                        var g = Game.gem[i];
                        g.point = g.point.add(face);
                        Debug.last = 'good';
                    } else {
                        Debug.last = 'bad';
                    }
                    Debug.i++;
                });*/
                for (j=Game.gems-1;j>=0;j--){
                    //console.log('beep in  ('+j+')');
                    var g = Game.gem[j];
                    //console.log(Game.gem[j]);
                    if (g.point.x===(a.x/SCALE)-1) {
                        Debug.sub++;
                        if (!g.check(face)) {
                            go = false;
                            Debug.goNum++;
                        }
                        Debug.num++;
                    }
                    //console.log('beep out ('+j+')');
                }
                for (i=Game.gems-1;i>=0;i--){
                    var g = Game.gem[i];
                    if (g.point.x===(a.x/SCALE)-1) {
                        if (go) {
                            g.point = g.point.add(face);
                            Debug.last = 'good';
                        } else {
                            Debug.last = 'bad';
                        }
                        Debug.i++;
                    }
                }
            }
            if (a.y===b.y){ // if horizontal
                for (j=Game.gems-1;j>=0;j--){
                    //console.log('beep in  ('+j+')');
                    var g = Game.gem[j];
                    //console.log(Game.gem[j]);
                    if (g.point.y===(a.y/SCALE)-1) {
                        Debug.sub++;
                        if (!g.check(face)) {
                            go = false;
                            Debug.goNum++;
                        }
                        Debug.num++;
                    }
                    //console.log('beep out ('+j+')');
                }
                for (i=Game.gems-1;i>=0;i--){
                    var g = Game.gem[i];
                    if (g.point.y===(a.y/SCALE)-1) {
                        if (go) {
                            g.point = g.point.add(face);
                            Debug.last = 'good';
                        } else {
                            Debug.last = 'bad';
                        }
                        Debug.i++;
                    }
                }
            }
            /*console.log('all '+Debug.last);
            console.log('total false: '+Debug.goNum);
            console.log('total checked: '+Debug.sub);
            console.log('total checked again: '+Debug.num);
            console.log('total moved: '+Debug.i);*/
            //console.log(Game);
            } else {
                if (EDIT.mode === 'rail'){
                    if (EDIT.append){
                        var sub = new Vector2D(1,1);
                        a = a.scale(1/SCALE).sub(sub);
                        b = b.scale(1/SCALE).sub(sub);
                        // get rail direction for a
                        var adir = b.sub(a);
                        // get rail direction for b
                        var bdir = a.sub(b);
                        // check location c
                        var repa = false;
                        for(var k in Game.rail){
                            if (Game.rail[k].point.same(a)) {
                                Game.rail[k].set(adir,true);
                                repa = true;
                            }
                        }
                        if (!repa) {
                            Game.rail[Game.rails] = new Rail(a,false,false,false,false);
                            Game.rail[Game.rails-1].set(adir,true);
                        }
                            // true: set rail direction
                            // false: create rail with the direction
                        // check location d
                        var repb = false;
                        for(var k in Game.rail){
                            if (Game.rail[k].point.same(b)) {
                                Game.rail[k].set(bdir,true);
                                repb = true;
                            }
                        }
                        if (!repb) {
                            Game.rail[Game.rails] = new Rail(b,false,false,false,false);
                            Game.rail[Game.rails-1].set(bdir,true);
                        }
                            // true: set rail direction
                            // false: create rail with the direction
                    }
                }
            }
            progress++;
        }
    }
    
    
    All.gems.each(function(i){
        Game.gem[i].update();
    });
    All.rails(function(i){
        Game.rail[i].update();
    });
    All.zones(function(i){
        Game.zone[i].update();
    });
    
    var allSolved = true;
    var n = 0;
    for (var t in Game.zone){
        n++;
        if (!Game.zone[t].solved) allSolved = false;
    }
    if (allSolved && n!==0){
        victory = true;
    }
    
    MENU.update();
    EDIT.update();
    Tap = false;
}

function draw() {
    canvas.fillStyle = '#FFF';
    canvas.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (MENU.mode === 'puzz') {
        canvas.fillStyle = '#EEE';
        canvas.fillRect(SCALE/4,SCALE/4,(SCALE*11)+(SCALE/2),CANVAS_HEIGHT-(SCALE/2));
    }
    
    All.zones(function(i){
        Game.zone[i].draw();
    });
    All.rails(function(i){
        Game.rail[i].draw();
    });
    All.gems.each(function(i){
        Game.gem[i].draw();
    });
    
    if (isset(Game.name)){
        canvas.fillStyle = '#000';
        canvas.font = "bold 24px Arial";
        //canvas.fillText(Game.name+' ('+pressTrail.length+') ('+progress+')',4,16);
        canvas.fillText(Game.name,4,20);
        canvas.fillText(MENU.currentPuzzle,4,46);
    }
    
    MENU.draw();
    
    /*foreach(pressTrail.length,function(i){
        canvas.fillStyle = '#FFA500';
        canvas.fillRect(pressTrail[i].x-5,pressTrail[i].y-5,10,10);
        if (i!==0){
            canvas.beginPath();
            canvas.moveTo(pressTrail[i].x,pressTrail[i].y);
            canvas.lineTo(pressTrail[i-1].x,pressTrail[i-1].y);
            canvas.strokeStyle = '#FFA500';
            canvas.stroke();
        }
        canvas.fillStyle = "#000";
        canvas.font = "bold 10px Arial";
        var p = pressTrail[i];
        canvas.fillText("("+(p.scale(1/SCALE).x-1)+","+(p.scale(1/SCALE).y-1)+")",p.x+10,p.y);
    });
     /**/
    
    //canvas.fillStyle = "#000";
    //canvas.fillRect(Touch.x-2,Touch.y-2,4,4);
    
}



/*
 * *****************************************
 *      GAME OBJECTS
 * *****************************************
 */

function Gem(type,point) {
    this.id = Game.gems;
    Game.gems++;
    this.point = point;
    this.psudo = point;
    this.type = type;
    
    this.update = function() {
        var px = ((this.point.x*1)+(this.psudo.x*3))/4;
        var py = ((this.point.y*1)+(this.psudo.y*3))/4;
        this.psudo = new Vector2D(px,py);
        
    };
    
    this.check = function(face) {
        var here = false;
        var there = false;
        var point = this.point;
        /*for (i=Game.rails-1;i>-1;i--){
            var r = Game.rail[i];
            if (point.same(r.point) && r.face(face)) {
                here = true;
            }
            if (point.add(face).same(r.point) && r.face(face.reverse())) {
                there = true;
            }
        }
        /**/
        
        All.rails(function(i){
            var r = Game.rail[i];
            if (point.same(r.point) && r.face(face)) {
                here = true;
            }
            if (point.add(face).same(r.point) && r.face(face.reverse())) {
                there = true;
            }
        });
        /**/
        if (here && there){
            //console.log('  good ('+this.id+')');
            return true;
        } else {
            //console.log('  bad ('+this.id+')');
            return false;
        }
    };
    
    this.draw = function() {
        
        switch (this.type) {
            case 'ruby':        canvas.fillStyle = "#FF2222";break;
            case 'saphire':     canvas.fillStyle = "#0044FF";break;
            case 'emerald':     canvas.fillStyle = "#00FF00";break;
            case 'topaz':       canvas.fillStyle = "#FFD700";break;
            case 'moonstone':   canvas.fillStyle = "#FFA500";break;
            case 'diamond':     canvas.fillStyle = "#00DDFF";break;
            case 'rock':        canvas.fillStyle = "#607080";break;
        }
        //console.log(this.type);
        //canvas.fillRect((this.point.x*SCALE)+(SCALE/2)+5,(this.point.y*SCALE)+(SCALE/2)+5,SCALE-10,SCALE-10);
        canvas.fillRect((this.psudo.x*SCALE)+(SCALE/2)+5,(this.psudo.y*SCALE)+(SCALE/2)+5,SCALE-10,SCALE-10);
        
        
        /*canvas.fillStyle = "#000";
        canvas.font = "bold 10px Arial";
        var textLoc = new Vector2D((this.point.x*SCALE)+(SCALE/2)+7,(this.point.y*SCALE)+(SCALE/2)+15);
        canvas.fillText("("+this.point.x+","+this.point.y+")",textLoc.x,textLoc.y);*/
    };
}

function Rail(point,up,down,left,right) {
    this.id = Game.rails;
    Game.rails++;
    this.point = point;
    this.up = up;
    this.down = down;
    this.left = left;
    this.right = right;
    
    this.update = function() {
        
    };
    
    this.face = function(vector) {
        if (vector.same(new Vector2D(0,-1))) return this.up;
        if (vector.same(new Vector2D(0,1))) return this.down;
        if (vector.same(new Vector2D(-1,0))) return this.left;
        if (vector.same(new Vector2D(1,0))) return this.right;
    };
    
    this.set = function(vector,there) {
        if (vector.same(new Vector2D(0,-1))) this.up = there;
        if (vector.same(new Vector2D(0,1))) this.down = there;
        if (vector.same(new Vector2D(-1,0))) this.left = there;
        if (vector.same(new Vector2D(1,0))) this.right = there;
    };
    
    this.draw = function() {
        canvas.fillStyle = "#222";
        if (this.up)
            canvas.fillRect((this.point.x*SCALE)+((SCALE/2)*2)-2,(this.point.y*SCALE)+(SCALE/2),4,(SCALE/2)+2);
        if (this.down)
            canvas.fillRect((this.point.x*SCALE)+((SCALE/2)*2)-2,(this.point.y*SCALE)+((SCALE/2)*2)-2,4,(SCALE/2)+2);
        if (this.left)
            canvas.fillRect((this.point.x*SCALE)+(SCALE/2),(this.point.y*SCALE)+((SCALE/2)*2)-2,(SCALE/2)+2,4);
        if (this.right)
            canvas.fillRect((this.point.x*SCALE)+((SCALE/2)*2)-2,(this.point.y*SCALE)+((SCALE/2)*2)-2,(SCALE/2)+2,4);
        if (!this.up && !this.down && !this.left && !this.right)
            canvas.fillRect((this.point.x*SCALE)+((SCALE/2)*2)-2,(this.point.y*SCALE)+((SCALE/2)*2)-2,4,4);
    };
}

function Zone(type,point) {
    this.id = Game.zones;
    Game.zones++;
    this.point = point;
    this.type = type;
    this.solved = false;
    
    this.update = function() {
        this.solved = false;
        for(var m in Game.gem){
            if (Game.gem[m].point.same(this.point) && Game.gem[m].type===this.type) {
                this.solved = true;
            }
        }
    };
    
    this.draw = function() {
        var color;
        switch (this.type) {
            case 'ruby':        color = "#FF2222";break;
            case 'saphire':     color = "#0044FF";break;
            case 'emerald':     color = "#00FF00";break;
            case 'topaz':       color = "#FFD700";break;
            case 'moonstone':   color = "#FFA500";break;
            case 'diamond':     color = "#00DDFF";break;
            case 'rock':        color = "#607080";break;
        }
        var figure = new Area2D((this.point.x*SCALE)+(SCALE/2),(this.point.y*SCALE)+(SCALE/2),SCALE,SCALE);
        figure.outline(color,5);
        /*canvas.fillStyle = "#000";
        canvas.font = "bold 10px Arial";
        var textLoc = new Vector2D((this.point.x*SCALE)+(SCALE/2)+7,(this.point.y*SCALE)+(SCALE/2)+15);
        canvas.fillText("("+this.point.x+","+this.point.y+")",textLoc.x,textLoc.y);*/
    };
}



function Menu() {
    this.currentPuzzle = '';
    this.mode = 'list';
    this.page = 0;
    this.limit = 0;
    this.buttons = [];
    
    this.clear = function() {
        this.buttons = [];
        victoryDrawn = false;
        this.page = 0;
    };
    
    this.add = function(area,color,text,active,event) {
        this.buttons[this.buttons.length] = new Button(area,color,text,active,event);
    };
    
    this.prev = function() {
        if (this.page!==0){
            this.page--;
            for (i=2;i<this.buttons.length;i++){
                this.buttons[i].area.y+=CANVAS_HEIGHT;
            }
        }
    };
    
    this.next = function() {
        if (this.page<this.limit){
            this.page++;
            for (i=2;i<this.buttons.length;i++){
                this.buttons[i].area.y-=CANVAS_HEIGHT;
            }
        }
    };
    
    this.update = function() {
        // update buttons
        for (i=0;i<this.buttons.length;i++){
            this.buttons[i].update();
        }
    };
    
    this.draw = function() {
        // draw buttons
        for (i=0;i<this.buttons.length;i++){
            this.buttons[i].draw();
        }
    };
}

function Button(area,color,text,active,event) {
    this.area = area;
    this.psudo = area;
    this.color = color;
    this.text = text;
    this.event = event;
    this.active = active;
    
    this.update = function() {
        if (this.area.inside(Touch) && Tap && this.active){
            if (isNumber(this.text)){
                MENU.currentPuzzle = this.text;
                loadPuzzle(this.text);
            }
            this.event();
            Tap = false;
            Press = false;
        }
        var px = ((this.area.x*1)+(this.psudo.x*3))/4;
        var py = ((this.area.y*1)+(this.psudo.y*3))/4;
        this.psudo = new Area2D(px,py,this.area.w,this.area.h);
    };
    
    this.draw = function() {
        this.psudo.draw(this.color);
        canvas.fillStyle = '#000';
        canvas.font = "bold 24px Arial";
        canvas.fillText(this.text,this.psudo.x+12,this.psudo.y+(this.psudo.h/2)+8);
    };
}

function Edit() {
    this.mode = 'gem';
    this.type = 'ruby';
    this.active = false;
    this.append = true;
    this.gems =  [
            'ruby',
            'saphire',
            'emerald',
            'topaz',
            'moonstone',
            'diamond',
            'rock'
        ];
    
    this.activate = function() {
        this.active = true;
        if (MENU.mode === 'puzz'){
            this.menu();
        }
    };
    this.on = function() {
        this.activate();
    };
    
    this.deactivate = function() {
        this.active = false;
        iniPuzzMenu();
    };
    this.off = function() {
        this.deactivate();
    };
    
    this.menu = function() {
        MENU.add(
            new Area2D(
                CANVAS_WIDTH-(SCALE*2),
                (SCALE*.2),
                SCALE*1,
                SCALE*1
                ),
            '#4E4','add',true,function(){
                EDIT.append = true;
            });
        MENU.add(
            new Area2D(
                CANVAS_WIDTH-(SCALE*1),
                (SCALE*.2),
                SCALE*1,
                SCALE*1
                ),
            '#E44','del',true,function(){
                EDIT.append = false;
            });
        MENU.add(
            new Area2D(
                CANVAS_WIDTH-(SCALE*2),
                (SCALE*1.2),
                SCALE*2,
                SCALE*1
                ),
            '#E44','rail',true,function(){
                EDIT.mode = 'rail';
            });
        MENU.add(
            new Area2D(
                CANVAS_WIDTH-(SCALE*2),
                (SCALE*2.2),
                SCALE*2,
                SCALE*1
                ),
            '#E44','gem',true,function(){
                EDIT.mode = 'gem';
            });
        MENU.add(
            new Area2D(
                CANVAS_WIDTH-(SCALE*2),
                (SCALE*3.2),
                SCALE*2,
                SCALE*1
                ),
            '#E44','zone',true,function(){
                EDIT.mode = 'zone';
            });
        MENU.add(
            new Area2D(
                CANVAS_WIDTH-(SCALE*3),
                (SCALE*4.2),
                SCALE*.4,
                SCALE*1
                ),
            '#FF2222','',true,function(){
                EDIT.type = 'ruby';
            });
        MENU.add(
            new Area2D(
                CANVAS_WIDTH-(SCALE*3)+(SCALE*.4),
                (SCALE*4.2),
                SCALE*.4,
                SCALE*1
                ),
            '#0044FF','',true,function(){
                EDIT.type = 'saphire';
            });
        MENU.add(
            new Area2D(
                CANVAS_WIDTH-(SCALE*3)+(SCALE*.8),
                (SCALE*4.2),
                SCALE*.4,
                SCALE*1
                ),
            '#00FF00','',true,function(){
                EDIT.type = 'emerald';
            });
        MENU.add(
            new Area2D(
                CANVAS_WIDTH-(SCALE*3)+(SCALE*1.2),
                (SCALE*4.2),
                SCALE*.4,
                SCALE*1
                ),
            '#FFD700','',true,function(){
                EDIT.type = 'topaz';
            });
        MENU.add(
            new Area2D(
                CANVAS_WIDTH-(SCALE*3)+(SCALE*1.6),
                (SCALE*4.2),
                SCALE*.4,
                SCALE*1
                ),
            '#FFA500','',true,function(){
                EDIT.type = 'moonstone';
            });
        MENU.add(
            new Area2D(
                CANVAS_WIDTH-(SCALE*3)+(SCALE*2),
                (SCALE*4.2),
                SCALE*.4,
                SCALE*1
                ),
            '#00DDFF','',true,function(){
                EDIT.type = 'diamond';
            });
        MENU.add(
            new Area2D(
                CANVAS_WIDTH-(SCALE*3)+(SCALE*2.4),
                (SCALE*4.2),
                SCALE*.4,
                SCALE*1
                ),
            '#607080','',true,function(){
                EDIT.type = 'rock';
            });
    };
    
    this.update = function() {
        if (Press && this.active){
            var gridBound = new Area2D(-.5,-.5,11,9);
            var roundTouch = pressTrail[0].scale(1/SCALE).sub(new Vector2D(1,1));
            if (Tap && gridBound.inside(roundTouch)){
                switch (this.mode){
                    case 'gem':
                        if (this.append) {
                            var replaced = false;
                            for(var j in Game.gem) {
                                if (Game.gem[j].point.same(roundTouch)) {
                                    Game.gem[j].type = this.type;
                                    replaced = true;
                                }
                            }
                            if (!replaced) {
                                Game.gem[Game.gems] = new Gem(this.type,new Vector2D(roundTouch.x,roundTouch.y));
                            }
                        } else {
                            for(var j in Game.gem) {
                                if (Game.gem[j].point.same(roundTouch)) {
                                    Game.gems--;
                                    if (Game.gem[j].id !== Game.gems) {
                                        Game.gem[j] = Game.gem[Game.gems];
                                        delete Game.gem[Game.gems];
                                    } else {
                                        delete Game.gem[j];
                                    }
                                }
                            }
                        }
                        break;
                    case 'zone':
                        if (this.append) {
                            var replaced = false;
                            for(var j in Game.zone) {
                                if (Game.zone[j].point.same(roundTouch)) {
                                    Game.zone[j].type = this.type;
                                    replaced = true;
                                }
                            }
                            if (!replaced) {
                                Game.zone[Game.zones] = new Zone(this.type,new Vector2D(roundTouch.x,roundTouch.y));
                            }
                        } else {
                            for(var j in Game.zone) {
                                if (Game.zone[j].point.same(roundTouch)) {
                                    Game.zones--;
                                    if (Game.zone[j].id !== Game.zones) {
                                        Game.zone[j] = Game.zone[Game.zones];
                                        delete Game.zone[Game.zones];
                                    } else {
                                        delete Game.zone[j];
                                    }
                                }
                            }
                        }
                        break;
                    case 'rail':
                        if (!this.append){
                            for(var k in Game.rail){
                                if (Game.rail[k].point.same(roundTouch)){
                                    Game.rails--;
                                    if (Game.rail[k].id !== Game.rails) {
                                        Game.rail[k] = Game.rail[Game.rails];
                                        delete Game.rail[Game.rails];
                                    } else {
                                        delete Game.rail[k];
                                    }
                                }
                            }
                        }
                        break;
                }
            }
        }
    };
    
    this.export = function() {
      /*
      var out = {};
      out.name = 'Gem Jam!';
      out.gem = [];
      out.zone = [];
      out.rail = [];
      for(var l in Game.gem){
          out.gem[l] = {};
          out.gem[l].type = Game.gem[l].type;
          out.gem[l].point = {};
          out.gem[l].point.x = Game.gem[l].point.x;
          out.gem[l].point.y = Game.gem[l].point.y;
      }
      for(var l in Game.zone){
          out.zone[l] = {};
          out.zone[l].type = Game.zone[l].type;
          out.zone[l].point = {};
          out.zone[l].point.x = Game.zone[l].point.x;
          out.zone[l].point.y = Game.zone[l].point.y;
      }
      for(var l in Game.rail){
          out.rail[l] = {};
          out.rail[l].point = {};
          out.rail[l].point.x = Game.rail[l].point.x;
          out.rail[l].point.y = Game.rail[l].point.y;
          out.rail[l].up = Game.rail[l].up;
          out.rail[l].down = Game.rail[l].down;
          out.rail[l].left = Game.rail[l].left;
          out.rail[l].right = Game.rail[l].right;
      }
      */
      
      var out = {};
      out.name = '';
      out.difficulty = 'easy';
      out.size = {};
      out.size.w = 9;
      out.size.h = 9;
      out.gems = [];
      out.goals = [];
      out.paths = [];
      for(var l in Game.gem){
          out.gems[l] = {};
          out.gems[l].type = Game.gem[l].type;
          out.gems[l].x = Game.gem[l].point.x;
          out.gems[l].y = Game.gem[l].point.y;
      }
      for(var l in Game.zone){
          out.goals[l] = {};
          out.goals[l].type = Game.zone[l].type;
          out.goals[l].x = Game.zone[l].point.x;
          out.goals[l].y = Game.zone[l].point.y;
      }
      for(var l in Game.rail) {
        if (Game.rail[l].up) {
          var newPath = {};
          newPath.x1 = Game.rail[l].point.x;
          newPath.y1 = Game.rail[l].point.y;
          newPath.x2 = Game.rail[l].point.x;
          newPath.y2 = Game.rail[l].point.y - 1;
          out.paths[] = newPath;
        }
        if (Game.rail[l].down) {
          var newPath = {};
          newPath.x1 = Game.rail[l].point.x;
          newPath.y1 = Game.rail[l].point.y;
          newPath.x2 = Game.rail[l].point.x;
          newPath.y2 = Game.rail[l].point.y + 1;
          out.paths[] = newPath;
        }
        if (Game.rail[l].left) {
          var newPath = {};
          newPath.x1 = Game.rail[l].point.x;
          newPath.y1 = Game.rail[l].point.y;
          newPath.x2 = Game.rail[l].point.x - 1;
          newPath.y2 = Game.rail[l].point.y;
          out.paths[] = newPath;
        }
        if (Game.rail[l].right) {
          var newPath = {};
          newPath.x1 = Game.rail[l].point.x;
          newPath.y1 = Game.rail[l].point.y;
          newPath.x2 = Game.rail[l].point.x + 1;
          newPath.y2 = Game.rail[l].point.y;
          out.paths[] = newPath;
        }
      }
      
      $('#puzzle').text(JSON.stringify(out));
    };
}
