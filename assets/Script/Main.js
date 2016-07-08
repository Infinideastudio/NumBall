function posDiff(x1,y1,x2,y2){
    var xdiff = x1 - x2;
    var ydiff = y1 - y2;
    var d = Math.pow((xdiff * xdiff + ydiff * ydiff), 0.5);
    return d;
}

function calcSize(num){
    return 1.5-50/(num+35);
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

var gameover=false;

var formulas=[
    "X+d",
    "X-d",
    "X*a+d","X*a-d",
    "X/a","X/a-d"
    ];

var formula = "";

var Ball = cc.Class({
    name: "Ball",
    num: 0,
    x:0,
    y:0,
    orx:0,
    ory:0,
    ortimer:0,
    ballnode : null,
    labelnode: null,
    pnode: null,psf:null,
    tow:false,toa:false,tod:false,tos:false,
    getSelfPosInBalls: function(){
        let id=0;
        for(id=0;id<balls.length;id++){
            if(balls[id].x==this.x&&balls[id].y==this.y&&balls[id].num==this.num) break;
        }
        return id;
    },
    
    ctor: function (node,sf) {
        this.pnode=node;
        this.psf=sf;
        this.num = Math.round(Math.random()*19)+1;
        
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
            this.ortimer=timer;
            this.tow=false;
            this.toa=false;
            this.tod=false;
            this.tos=false;
        }.bind(this));
        
        //Move
        this.ballnode.on(cc.Node.EventType.TOUCH_MOVE, function ( event ) {
            var size = cc.winSize;
            this.setPos(event.getLocationX()-size.width/2,event.getLocationY()-size.height/2);
            if(this.x-this.orx>50) this.tow=true;
            if(this.x-this.orx<-50) this.tos=true;
            if(this.y-this.ory>50) this.tod=true;
            if(this.y-this.ory<-50)this.toa=true;
            //Throw
            if(this.num>=5&&(this.tow&&this.tos)||(this.tod&&this.toa)){
                let ballNum=Math.round(Math.random()*8)+2;
                let allNum=this.num;
                for(let i=0;i<ballNum;i++){
                    let xd=Math.round(Math.random()*38)+12;
                    let yd=Math.round(Math.random()*38)+12;
                    if(Math.random()>0.5) xd=-xd;
                    if(Math.random()>0.5) yd=-yd;
                    let takeNum=i!=ballNum-1?Math.floor(Math.random()*allNum):allNum;
                    if(takeNum===0) break;
                    let ball=new Ball(this.pnode, this.psf);
                    ball.setPos(this.x + xd,this.y +yd);
                    ball.setNum(takeNum);
                    allNum-=takeNum;
                    balls.push(ball);
                }
                this.rm();
                removeFromBalls(this.getSelfPosInBalls());
            }
        }.bind(this));
        

        this.ballnode.on(cc.Node.EventType.TOUCH_END, function ( event ) {
            //碰撞检测，合并
            for(let i=0;i<balls.length;i++){
                let balli=balls[i];
                let ballj=this;
                if(balli.x==ballj.x&&balli.y==ballj.y) continue; 
                if(posDiff(balli.x,balli.y,ballj.x,ballj.y)<20){ 
                    let ball=new Ball(this.pnode, this.psf);
                    ball.setPos(ballj.x,ballj.y);
                    ball.setNum(balli.num+ballj.num);
                    balli.rm();
                    ballj.rm();
                    removeFromBalls(i);
                    removeFromBalls(this.getSelfPosInBalls());
                    balls.push(ball);
                    return;
                }
            }
            
            //平分
            if(this.num>=2&&timer-this.ortimer<1&&posDiff(this.x,this.y,this.orx,this.ory)<10){
                let ball1=new Ball(this.pnode, this.psf);
                let ball2=new Ball(this.pnode, this.psf);
                ball1.setPos(this.x - 15, this.y);
                ball1.setNum(Math.floor(this.num/2));
                ball2.setPos(this.x + 15, this.y);
                ball2.setNum(this.num - Math.floor(this.num/2));
                this.rm();
                removeFromBalls(this.getSelfPosInBalls());
                balls.push(ball1);
                balls.push(ball2);
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
    
    genFormula: function(){
        formula=formulas[Math.floor(Math.random()*formulas.length)]
        .replace("a", random(1,5)).replace("a!", random(2,5)).replace("b", random(1,100)).replace("c", Math.floor(randomfloat(0,0.1)*this.numsum))
        .replace("d", Math.floor(randomfloat(0.5,0.8)*this.numsum)).replace("e", randomfloat(0,1));
        this.formulaNode.string=formula;
    },
    
    init: function(){
        for(var i=0;i<random(3, 10);i++)
            balls.push(new Ball(this.node, this.ballsprite));
        
        score=0;
        formula="";
        this.numsum=0;
        for(let i=0;i<balls.length;i++){
            this.numsum+=balls[i].num;
        }
        this.scoreNode.string="Score: " + this.numsum + "/" + score;
        this.genFormula();
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
        
        if(timer>=TimeEachRound){
            timer=0;
            
            for(let i=0;i<balls.length;){
                //Apply formula
                balls[i].setNum(parseInt(eval(formula.replace("X", balls[i].num))));
                if(balls[i].num<=0){
                    balls[i].rm();
                    balls=balls.slice(0,i).concat(balls.slice(i+1,balls.length));
                }else{
                    i++;
                }
            }
            
            this.numsum=0;
            for(let i=0;i<balls.length;i++){
                this.numsum+=balls[i].num;
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
            if(balls[i].x>size.width/2) balls[i].setPos(size.width/2,balls[i].y);
            if(balls[i].x<-size.width/2) balls[i].setPos(-size.width/2,balls[i].y);
            if(balls[i].y>size.height/2) balls[i].setPos(balls[i].x,size.height/2);
            if(balls[i].y<-size.height/2) balls[i].setPos(balls[i].x,-size.height/2);
        }
    },
});
