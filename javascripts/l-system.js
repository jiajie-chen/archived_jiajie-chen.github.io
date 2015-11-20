//Jiajie Chen 2014
var canvas = document.getElementById('canvas');

if (canvas.getContext) {
    var cntx = canvas.getContext('2d');
    var A = parseInt(canvas.getAttribute('width'), 10);
    var B = parseInt(canvas.getAttribute('height'), 10);
    
    var Xmin = -300;
    var Xmax = 300;
    var Ymin = -300;
    var Ymax = 300;
    var startX = 0;
    var startY = -250;
    
    var TO_RAD = Math.PI/180;
    var DELAY = 2* 1000;
    var debugOn = false;
    
    var skip = 0;
    var speed = 1;
    var dSX;
    var dSY;
    var dAngle;
    var dLength;
    var dWidth;
    
    var requestAnimationFrame =  
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        function(callback) {
            return setTimeout(callback, 16);
        };
    
    var debug = function(msg) {
        if (debugOn) {
            cntx.clearRect(0, B-15, A, 15);
            cntx.fillText(msg, 5, B-5);
        }
    };
    
    var newLine = function(x, y, dx, dy, length, width, fill) {
        return {
            'x': x,
            'y': y,
            'dx': dx,
            'dy': dy,
            'length': length,
            'width': width,
            'fill': fill
        };
    };
    
    var drawLine = function(cx1, cy1, cx2, cy2, width, fill) {
        var x1 = (cx1 - Xmin) * A/(Xmax - Xmin);
        var x2 = (cx2 - Xmin) * A/(Xmax - Xmin);
        var y1 = (cy1 - Ymax) * -B/(Ymax - Ymin);
        var y2 = (cy2 - Ymax) * -B/(Ymax - Ymin);
        cntx.beginPath();
        cntx.lineWidth = width;
        cntx.lineCap = 'round';
        cntx.lineJoin = 'miter';
        cntx.miterLimit = 1;
        cntx.moveTo(x1, y1);
        cntx.lineTo(x2, y2);
        cntx.strokeStyle = fill;
        cntx.stroke();
    };
    
    var drawLineSlow = function(ln, callback) {
        if (ln.length > (0+skip)) {
            var spd = Math.min(ln.length-skip, speed);
            
            var dLn = function() {
                drawLine(ln.x, ln.y,
                         ln.x+(ln.dx*spd), ln.y+(ln.dy*spd),
                         ln.width, ln.fill);
                drawLineSlow(newLine(ln.x+(ln.dx*spd), ln.y+(ln.dy*spd),
                                     ln.dx, ln.dy,
                                     ln.length-spd,
                                     ln.width, ln.fill),
                            callback);
            };
            requestAnimationFrame(dLn);
        } else {
            return callback();
        }
    };
    
    var splitSystem = function(sx, sy, fill1, fill2, angle, length, width, rules, callback, stack, splitRule) {
        if (rules === "") {
            return function() {
                drawSystem(sx, sy, fill1, fill2, angle,
                           dLength(length), dWidth(width),
                           splitRule, callback)();
            };
        }
        
        var a = rules.substring(0, 1);
        var newRules = rules.substring(1);
        var newStack = stack;
        var newSplit = splitRule;
        
        if (a === "]") {
            if (stack > 0) {
                newStack -= 1;
            } else {
                return function() {
                    if (newSplit.length > newRules.length) {
                        drawSystem(sx, sy, fill1, fill2, angle,
                                   dLength(length), dWidth(width),
                                   newSplit, callback)();
                        drawSystem(sx, sy, fill1, fill2, angle,
                                   dLength(length), dWidth(width),
                                   newRules)();
                    } else {
                        drawSystem(sx, sy, fill1, fill2, angle,
                                   dLength(length), dWidth(width),
                                   newSplit)();
                        drawSystem(sx, sy, fill1, fill2, angle,
                                   dLength(length), dWidth(width),
                                   newRules, callback)();
                    }
                };
            }
        } else if (a === "[") {
            newStack += 1;
        }
        newSplit += a;
        
        return splitSystem(sx, sy, fill1, fill2, angle, length, width,
                           newRules, callback, newStack, newSplit);
    };
    
    var drawSystem = function(sx, sy, fill1, fill2, angle, length, width, rules, callback) {
        var fn;
        
        if (rules === "") {
            return function(){
                debug("end");
                if (callback && typeof(callback) === "function") {
                    callback();
                }
            };
        }
        
        var a = rules.substring(0, 1);
        var newRules = rules.substring(1);
        
        if (a === "[") {
            fn = splitSystem(sx, sy, fill1, fill2, angle, length, width, newRules, callback, 0, "");
        } else if (a === "F") {
            var fdx = dSX(sx, angle);
            var fdy = dSY(sy, angle);
            fn = function() {
                drawLineSlow(newLine(sx, sy, fdx, fdy, length, width, fill1),
                             drawSystem(sx+(fdx*length), sy+(fdy*length),
                                        fill1, fill2, angle, length, width,
                                        newRules, callback));
            };
        } else if (a === "G") {
            var gdx = dSX(sx, angle);
            var gdy = dSY(sy, angle);
            fn = function() {
                drawLineSlow(newLine(sx, sy, gdx, gdy, length, width, fill2),
                             drawSystem(sx+(gdx*length), sy+(gdy*length),
                                        fill1, fill2, angle, length, width,
                                        newRules, callback));
            };
        } else if (a === "+") {
            fn = function() {
                drawSystem(sx, sy, fill1, fill2, dAngle(angle, true), length, width, newRules, callback)();
            };
        } else if (a === "-" || a === "−") {
            fn = function() {
                drawSystem(sx, sy, fill1, fill2, dAngle(angle, false), length, width, newRules, callback)();
            };
        } else {
            fn = function() {
                drawSystem(sx, sy, fill1, fill2, angle, length, width, newRules, callback)();
            };
        }
        
        //return function() { requestAnimationFrame(fn); };
        return fn;
    };
    
    var makeSystem = function(start, rules, iterations) {
        if (iterations < 1) {
            return start;
        }
        var newStart = "";
        
        var nextStart = start;
        while (nextStart !== "") {
            var a = nextStart.substring(0, 1);
            var tail = nextStart.substring(1);
            
            var rule = rules[a];
            if (rule) {
                newStart += rule;
            } else {
                newStart += a;
            }
            
            nextStart = tail;
        }
        
        return makeSystem(newStart, rules, iterations-1);
    };
    
    var startSystem = function(sx, sy, fill1, fill2, sa, length, width,
                               axiom, rules, iter, da,
                               skp, spd, ds, dl, dw,
                               callback) {
        var r = makeSystem(axiom, rules, iter);
        
        return setTimeout(function() {
            skip = skp;
            speed = spd;
            dSX = function(sx, angle) {
                return Math.cos(angle * TO_RAD) * ds;
            };
            dSY = function(sy, angle) {
                return Math.sin(angle * TO_RAD) * ds;
            };
            dAngle = function(angle, plus) {
                if (plus) {
                    return angle + da;
                } else {
                    return angle - da;
                }
            };
            dLength = function(length) {
                return length*dl;
            };
            dWidth = function(width) {
                return Math.max(width*dw, 1);
            };
            
            cntx.clearRect(0, 0, A, B);
            drawSystem(sx, sy, fill1, fill2, sa, length, width, r, callback)();
        }, DELAY);
    };
    
    var s1 = function() { //tree
        startSystem(0, Ymin, '#aa5522', '#00aa00', 90, 4, 5,
                    "G", {'F':'FF', 'G':'F[+G]-G'}, 8, 45,
                    0, 2, 0.5, 1.15, 0.75, s2)();
    };
    var s2 = function() { //plant
        startSystem(Xmin, Ymin, '#33aa44', '#446633', 60, 8, 2,
                    "X", {'X':'G-[[X]+X]+G[+GX]-X', 'F':'FF', 'G':'FG'}, 5, -25,
                    0, 1, 1, 1, 1, s3)();
    };
    var s3 = function() { //wispy tree
        startSystem(0, Ymin, '#883322', '#11aa22', 90, 15, 1,
                    "F", {'F':'FF-[-F+G+G]+[+F-G-G]', 'G':'FF-[-F+G+G]+[+F-G-G]'}, 4, 22,
                    0, 1, 0.66, 1, 1, s4)();
    };
    var s4 = function() { //koch
        startSystem(Xmin-5, Ymin, '#000000', '#000000', 0, 5, 1,
                    "F", {'F':'F+G−F−G+F', 'G':'G+F−G−F+G'}, 4, 90,
                    0, 2, 1.5, 1, 1, s5)();
    };
    var s5 = function() { //triangle
        startSystem(Xmin, Ymin, '#ee0000', '#662222', 0, 8, 1,
                    "F−G−G", {'F':'F−G+F+G−F', 'G':'GG'}, 5, -120,
                    0, 2, 2, 1, 1, s6)();
    };
    var s6 = function() { //dragon
        startSystem(Xmin+132, Ymin+265, '#000000', '#9999ff', -108, 5, 1,
                    "XF", {'F':'F+GX', 'G':'XF-G'}, 11, 90,
                    0, 5, 2, 1, 1, s7)();
    };
    var s7 = function() { //levy c
        startSystem(Xmin+155, 100, '#000000', '#aa0000', 0, 4, 1,
                    "F", {'F':'+F--G+', 'G':'+G--F+'}, 11, -45,
                    0, 5, 1.6, 1, 1, s8)();
    };
    var s8 = function() { //?
        startSystem(Xmin, Ymax, '#000000', '#ffaaaa', 0, 5, 2,
                    "F", {'F':'-GX+FXF+XG-', 'G':'+FX-GXG-XF+'}, 5, 90,
                    0, 5, 2, 1, 1, s9)();
    };
    var s9 = function() { //hilbert
        startSystem(Xmin, Ymax, '#000000', '#ff5555', 0, 5, 2,
                    "X", {'X':'-YF+XGX+FY-', 'Y':'+XF-YGY-FX+'}, 6, 90,
                    0, 5, 2, 1, 1, s10)();
    };
    
    var s10 = function() { //island
        startSystem(0, 0, '#000000', '#ff5555', 0, 5, 1,
                    "F+F+F+F", {'F':'F+F-F-FF+F+F-F'}, 6, 90,
                    0, 2, 1, 1, 1, s1)();
    };
    
    var s11 = function() { //tree
        startSystem(0, Ymin, '#000000', '#ff5555', 90, 10, 1,
                    "F", {'F':'F[-F]F[+F][F]'}, 4, 33,
                    0, 2, 2, 1, 1, null)();
    };
    var s12 = function() { //tree
        startSystem(0, Ymin, '#aa5522', '#00aa00', 90, 3, 5,
                    "G", {'F':'FF', 'G':'F[+G]-FG'}, 8, 45,
                    0, 2, 0.5, 1, 0.95, s1)();
    };
    
    var s13 = function() { //island
        startSystem(0, 0, '#000000', '#ff5555', 0, 10, 2,
                    "F+F+F+F", {'F':'FF+F+F+F+F+F-G', 'G':'FF+F+F+F+F+F-G'}, 3, 90,
                    0, 5, 1, 1, 1, null)();
    };
    var s14 = function() { //island
        startSystem(Xmin, Ymin, '#000000', '#ff5555', 0, 6, 2,
                    "F+F+F+F", {'F':'FF+F++F+F'}, 4, 90,
                    0, 5, 1, 1, 1, null)();
    };
    var s15 = function() { //island
        startSystem(Xmin, Ymin, '#0000aa', '#dd5500', 0, 10, 2,
                    "F+F+F+F", {'F':'FF+G+F+G+FF', 'G':'FF+G+F+G+FF'}, 3, 90,
                    0, 5, 1, 1, 1, null)();
    };
    s1();
}

