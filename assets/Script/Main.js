function posDiff(x1,y1,x2,y2){
    var xdiff = x1 - x2;
    var ydiff = y1 - y2;
    var d = Math.pow((xdiff * xdiff + ydiff * ydiff), 0.5);
    return d;
}

var balls = [];

var TimeEachRound=10;

var timer=0;

var score=0;

var formulas=[
    "+n",
    "-n",
    "*n",
    "/n"
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
    pnode: null,
    psf:null,
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
        this.ballnode.scale=this.num/30;
        
        //Label
        this.labelnode = new cc.Node('balllabel');
        var numLabel = this.labelnode.addComponent(cc.Label);
        numLabel.string = this.num.toString();
        this.labelnode.parent = node;
        this.labelnode.setPosition(this.x,this.y);
        
        //Move
        this.ballnode.on(cc.Node.EventType.TOUCH_MOVE , function ( event ) {
            var size = cc.winSize;
            this.setPos(event.getLocationX()-size.width/2,event.getLocationY()-size.height/2);
            //Fly
            if(this.num>=5&&timer-this.ortimer<2&&posDiff(this.x,this.y,this.orx,this.ory)>100){
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
                let id=0;
                for(id=0;id<balls.length;id++){
                    if(balls[id].x==this.x&&balls[id].y==this.y) break;
                }
                balls=balls.slice(0,id).concat(balls.slice(id+1,balls.length));
            }
        }.bind(this));
        
        //Split
        this.ballnode.on(cc.Node.EventType.TOUCH_END, function ( event ) {
            //Hit check
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
                    balls=balls.slice(0,i).concat(balls.slice(i+1,balls.length));
                    let j=0;
                    for(;j<balls.length;j++){
                        if(balls[j].x==this.x&&balls[j].y==this.y) break;
                    }
                    balls=balls.slice(0,j).concat(balls.slice(j+1,balls.length));
                    balls.push(ball);
                    break;
                }
            }
            
            if(this.num>=2&&timer-this.ortimer<1&&posDiff(this.x,this.y,this.orx,this.ory)<10){
                let ball1=new Ball(this.pnode, this.psf);
                let ball2=new Ball(this.pnode, this.psf);
                ball1.setPos(this.x - 15,this.y);
                ball1.setNum(Math.floor(this.num/2));
                ball2.setPos(this.x + 15,this.y);
                ball2.setNum(Math.floor(this.num/2));
                this.rm();
                let i=0;
                for(;i<balls.length;i++){
                    if(balls[i].x==this.x&&balls[i].y==this.y) break;
                }
                balls=balls.slice(0,i).concat(balls.slice(i+1,balls.length));
                balls.push(ball1);
                balls.push(ball2);
            }
            this.orx=this.x;
            this.ory=this.y;
            this.ortimer=timer;
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
        this.ballnode.scale=this.num/30;
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
    
    // use this for initialization
    onLoad: function () {
        for(var i=0;i<Math.round(Math.random()*10);i++)
            balls.push(new Ball(this.node, this.ballsprite));
        
        formula=formulas[Math.floor(Math.random()*formulas.length)].replace("n", Math.floor(Math.random()*10));
        this.formulaNode.string=formula;
    },

    // called every frame
    update: function (dt) {
        timer+=dt;
        this.timerNode.string="Timer: "+(TimeEachRound-Math.ceil(timer)).toString();
        var sumnum=0;
        for(let i=0;i<balls.length;i++){
            sumnum+=balls[i].num;
        }
        if(sumnum>score) score=sumnum;
        this.scoreNode.string="Score: " + sumnum + "/" + score;
        
        if(timer>=TimeEachRound){
            timer=0;
            for(let i=0;i<balls.length;i++){
                //apply formula
                balls[i].setNum(parseInt(eval(balls[i].num.toString()+formula)));
                if(balls[i].num==0){
                    balls[i].rm();
                    balls=balls.slice(0,i).concat(balls.slice(i+1,balls.length));
                }
            }
            formula=formulas[Math.floor(Math.random()*formulas.length)].replace("n", Math.floor(Math.random()*10));
            this.formulaNode.string=formula;
        }
    },
});
