function posDiff(x1,y1,x2,y2){
    var xdiff = x1 - x2;
    var ydiff = y1 - y2;
    var d = Math.pow((xdiff * xdiff + ydiff * ydiff), 0.5);
    return d;
}

function calcSize(num){
    return 1-50/(num+60);
}

function random(min,max){
    return Math.floor(Math.random() * (max - min) + min);
}
function randomfloat(min,max){
    return Math.random() * (max - min) + min;
}

var balls = [];

function removeFromBalls(id){
    balls=balls.slice(0,id).concat(balls.slice(id+1,balls.length));
}

const TimeEachRound=5;

var timer=0;

var score=0;

var roll=0;

var gameover=false;

var formulas=[
    "X+D",
    "X-D",
    "X*A&+D","X*A&-D",
    "X/A&+D","X/A&-D",
    "Math.sqrt(X)",
    "X*X-D",
    "D*Math.sin(X)"
    ];

var formula = "";

var Ball = cc.Class({
    name: "Ball",
    num: 0,
    targetnum: 0,
    x:0,
    y:0,
    orx:0,
    ory:0,
    drx:0,
    dry:0,
    ballnode : null,
    labelnode: null,
    pnode: null,psf:null,
    getSelfPosInBalls: function(){
        let id=0;
        for(id=0;id<balls.length;id++){
            if(balls[id].x==this.x&&balls[id].y==this.y&&balls[id].num==this.num) break;
        }
        return id;
    },
    getR: function(){
        return this.ballnode.width*calcSize(this.num)/2;
    },
    ctor: function (node,sf) {
        this.pnode=node;
        this.psf=sf;
        this.num = Math.round(Math.random()*19)+1;
        this.targetnum=this.num;
        
        //Set position
        var size = cc.winSize;
        this.x=Math.round(Math.random()*(size.width+1)-size.width/2);
        this.y=Math.round(Math.random()*(size.height+1)-size.height/2);
        
        //Ball
        this.ballnode = new cc.Node('ball');
        var sp = this.ballnode.addComponent(cc.Sprite);
        sp.spriteFrame = sf;
        this.ballnode.parent = node;
        this.ballnode.setPosition(this.x,this.y);
        this.ballnode.scale=calcSize(this.num);
        this.ballnode.color=new cc.Color(Math.floor(Math.random()*256), Math.floor(Math.random()*256), Math.floor(Math.random()*256));
        
        //Label
        this.labelnode = new cc.Node('balllabel');
        var numLabel = this.labelnode.addComponent(cc.Label);
        numLabel.string = this.num.toString();
        this.labelnode.parent = node;
        this.labelnode.setPosition(this.x,this.y);
        
        this.ballnode.on(cc.Node.EventType.TOUCH_START, function ( event ) {
            this.orx=this.x;
            this.ory=this.y;
            this.drx=event.getLocationX()-size.width/2-this.x;
            this.dry=event.getLocationY()-size.height/2-this.y;
        }.bind(this));
        
        //Move
        this.ballnode.on(cc.Node.EventType.TOUCH_MOVE, function ( event ) {
            var size = cc.winSize;
            this.setPos(event.getLocationX()-size.width/2-this.drx,event.getLocationY()-size.height/2-this.dry);
        }.bind(this));

        this.ballnode.on(cc.Node.EventType.TOUCH_END, function ( event ) {
            //碰撞检测，合并
            for(let i=0;i<balls.length;i++){
                let balli=balls[i];
                let ballj=this;
                if(balli.x==ballj.x&&balli.y==ballj.y&&balli.num==ballj.num) continue; 
                if(posDiff(balli.x,balli.y,ballj.x,ballj.y)<ballj.getR()){ 
                    let ball=new Ball(this.pnode, this.psf);
                    ball.setPos(ballj.x,ballj.y);
                    ball.targetnum=balli.num+ballj.num;
                    ball.setNum(ballj.num);
                    balli.rm();
                    ballj.rm();
                    removeFromBalls(i);
                    removeFromBalls(this.getSelfPosInBalls());
                    balls.push(ball);
                    return;
                }
            }
        }.bind(this));
    },
    setPos: function(x,y){
        this.x=x;
        this.y=y;
        this.ballnode.setPositionX(this.x);
        this.ballnode.setPositionY(this.y);
        this.labelnode.setPositionX(this.x);
        this.labelnode.setPositionY(this.y);
    },
    setNum: function(num){
        this.num=num;
        this.labelnode.getComponent(cc.Label).string=this.num.toString();
        this.ballnode.scale=calcSize(this.num);
    },
    rm: function(){
        this.ballnode.removeFromParent();
        this.labelnode.removeFromParent();
    }
});
    
cc.Class({
    extends: cc.Component,

    properties: {
        ballsprite: {
          default: null,
          type: cc.SpriteFrame,
        },
        timerNode: {
            default: null,
            type: cc.Label
        },
        formulaNode: {
            default: null,
            type: cc.Label
        },
        scoreNode:{
            default: null,
            type: cc.Label
        },
    },
    
    numsum:0,
    
    outstart:false,
    
    genFormula: function(){
        let id=Math.floor(Math.random()*formulas.length);
        if(id!=formulas.length - 1&&random(0,100)<roll) id++;
        formula=formulas[id]
        .replace("A&", random(2,5)).replace("A", random(1,5)).replace("B", random(1,100)).replace("C", Math.floor(randomfloat(0,0.1)*this.numsum))
        .replace("D", Math.floor(randomfloat(0.5,0.8)*this.numsum)).replace("E", randomfloat(0,1));
        this.formulaNode.string=formula;
    },
    
    init: function(){
        for(var i=0;i<random(3, 10);i++)
            balls.push(new Ball(this.node, this.ballsprite));
        
        score=0;
        roll=0;
        formula="";
        this.numsum=0;
        for(let i=0;i<balls.length;i++){
            this.numsum+=balls[i].num;
        }
        this.scoreNode.string="Score: " + this.numsum + "/" + score;
        this.genFormula();
        
        this.node.on(cc.Node.EventType.TOUCH_START, function ( event ) {
            let size = cc.winSize;
            let x=event.getLocationX()-size.width/2;
            let y=event.getLocationY()-size.height/2;
            this.outstart=true;
            for(let i=0;i<balls.length;i++){
                if(posDiff(x,y,balls[i].x,balls[i].y)<balls[i].getR()){
                    this.outstart=false;
                    break;
                }
            }
        }.bind(this));

        this.node.on(cc.Node.EventType.TOUCH_END, function ( event ) {
            if(!this.outstart) return;
            
            let size = cc.winSize;
            let x=event.getLocationX()-size.width/2;
            let y=event.getLocationY()-size.height/2;
            for(let i=0;i<balls.length;i++){
                if(balls[i].num>=2&&posDiff(x,y,balls[i].x,balls[i].y)<balls[i].getR()){
                    //平分
                    let ball1=new Ball(this.node, this.ballsprite);
                    let ball2=new Ball(this.node, this.ballsprite);
                    let ball1Num=Math.floor(balls[i].num/2);
                    let ball2Num=balls[i].num - Math.floor(balls[i].num/2);
                    let d=balls[i].ballnode.width*calcSize(balls[i].num/2)*2;
                    ball1.setPos(balls[i].x - 30, balls[i].y);
                    ball1.setNum(ball1Num);
                    ball1.targetnum=ball1Num;
                    ball2.setPos(balls[i].x + 30, balls[i].y);
                    ball2.setNum(ball2Num);
                    ball2.targetnum=ball2Num;
                    balls[i].rm();
                    removeFromBalls(balls[i].getSelfPosInBalls());
                    balls.push(ball1);
                    balls.push(ball2);
                    break;
                }
            }

        }.bind(this));
        
    },
    
    // use this for initialization
    onLoad: function () {
        this.init();
    },

    // called every frame
    update: function (dt) {
        timer+=dt;
        if(gameover){
            if(timer>3){
                this.init();
                gameover=false
                timer=0;
            }else{
                return;
            }
        }
        this.timerNode.string="Timer: "+(TimeEachRound-Math.ceil(timer)).toString();
        
        let test=false;
        for(let i=0;i<balls.length;i++){
            //Test apply formula
            if(parseInt(eval(formula.replace("X", balls[i].targetnum).replace("X", balls[i].targetnum)))>0){
                test=true;
                break;
            }
        }
        if(test) this.formulaNode.node.color=new cc.Color(255,255,255);
        else this.formulaNode.node.color=new cc.Color(255,97,0);
            
        if(timer>=TimeEachRound){
            timer=0;
            roll++;
            
            for(let i=0;i<balls.length;){
                //Apply formula
                balls[i].targetnum=parseInt(eval(formula.replace("X", balls[i].targetnum).replace("X", balls[i].targetnum)));
                if(balls[i].targetnum<=0){
                    balls[i].rm();
                    removeFromBalls(i);
                }else{
                    i++;
                }
            }
            
            this.numsum=0;
            for(let i=0;i<balls.length;i++){
                this.numsum+=balls[i].targetnum;
            }
            if(this.numsum>score) score=this.numsum;
            this.scoreNode.string="Score: " + this.numsum + "/" + score;
            
            if(balls.length==0){
                gameover=true;
                this.formulaNode.string="Game over!";
                this.scoreNode.string="Score: " + score;
                this.timerNode.string="";
                return;
            }
            this.genFormula();
        }
        var size = cc.winSize;
        for(let i=0;i<balls.length;i++){
            //球变大变小动画
            let diff=Math.abs(balls[i].targetnum-balls[i].num);
            let add=balls[i].targetnum>balls[i].num;
            if(diff>0){
                if(diff>5) balls[i].setNum(balls[i].num+(add?1:-1)*Math.floor(diff*0.2));
                else balls[i].setNum(balls[i].targetnum);
            }
            
            /*
            for(let j=0;j<balls.length;j++){
                let x1=balls[i].x;
                let x2=balls[j].x;
                let y1=balls[i].y;
                let y2=balls[j].y;
                if(x1==x2&&y1==y2&&balls[i].num==balls[j].num) continue; 
                let d=posDiff(x1,y1,x2,y2);
                if(d<100){
                    let x3=(x2-x1)*10/d+x2;
                    let y3=(y2-y1)*10/d+y2;
                    balls[i].setPos(x3,y3);
                }
            }
            */
            
            //球超出边界检测
            if(balls[i].x>size.width/2) balls[i].setPos(size.width/2,balls[i].y);
            if(balls[i].x<-size.width/2) balls[i].setPos(-size.width/2,balls[i].y);
            if(balls[i].y>size.height/2) balls[i].setPos(balls[i].x,size.height/2);
            if(balls[i].y<-size.height/2) balls[i].setPos(balls[i].x,-size.height/2);
        }
    },
});
