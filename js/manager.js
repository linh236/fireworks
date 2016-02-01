'use strict';
import {getFireworkPoints} from './fireworkpoints';
import FIREWORK2_PROPERTIES from './fireworkproperties';

export function FireworkManager(){
    this.firework1s=[];//firework1陣列
    this.firework2s=[];//firework2陣列
    this.rocketOrNot=true;//是否有煙火炷
    this.saveRecord1=[];//
    this.saveRecord2=[];
    this.curPos=new vector(-1000,0);//滑鼠位置
    this.endTime;//統計總時間
    this.time=0;
    this.$canvas;
    this.ctx;
    this.alphabetBuffer=[];//在暫停模式下，儲存的煙火
    this.building=new Image();
    this.building.src='img/building2.png';
    this.atmosphere=new Image();
    this.atmosphere.src='img/atmosphere-blue.png';
    this.atmosphereType=0;
    this.dot=0;
    this.DOTMAX=8000;
    
    this.changeAtmosphere=function(type){
        switch(type){
        case 0:
            this.atmosphere.src='img/atmosphere-blue.png';//#0066FF
            break;
        case 1:
            this.atmosphere.src='img/atmosphere-pink.png';//#FF6464
            break;
        case 2:
            this.atmosphere.src='img/atmosphere-purple.png';//#9955FF
            break;
        }
        this.atmosphereType=type;
    };

    this.init=function(replay){
        this.time+=1000/window.fps; //直接用黑幕蓋掉原本的畫面，因為有透明，所以會留有之前煙火的視覺暫留
        this.ctx.fillStyle='rgba(0,0,0,0.15)';//會透明
        this.ctx.beginPath();
        this.ctx.fillRect(0,0,this.$canvas.width(),this.$canvas.height());
        this.ctx.closePath();
        for(let i=0;i<this.alphabetBuffer.length;i++){//如果alphabet buffer有東西的話，代表剛從暫停模式回來
            this.alphabetBuffer[i].startTime=this.time;
            this.firework1s.push(this.alphabetBuffer[i]);
            this.saveRecord1.push(this.alphabetBuffer[i]);
        }
        this.alphabetBuffer=[];
        for(var i=0;i<this.firework1s.length;i++){
            var fire=this.firework1s[i];
            if(fire.update() && fire.rocketOrNot)//如果還要繼續畫的話
                fire.draw();
            else{//移除第一段火箭，並新增第二段煙火
                if(!replay){
                    let newFire= new Firework2(fire.endPos.x,fire.endPos.y,fire.type,this.ctx,this.time);
                    newFire.init();
                    this.firework2s.push(newFire);
                    this.saveRecord2.push(newFire);
                    if(this.light<120)
                        this.light+=60;
                }
                this.firework1s.splice(i,1);//移除已經畫完的
                i--;
            }
        }
        for(i=0;i<this.firework2s.length;i++){
            if(!this.firework2s[i].checkDark() && this.firework2s[i].checkStart()){
                this.ctx.drawImage(this.atmosphere,0,this.$canvas.height()-this.$canvas.width()*13/30,this.$canvas.width(),this.$canvas.width()*13/30);
                break;
            }
        }
        for(i=0;i<this.firework2s.length;i++){
            fire=this.firework2s[i];
            if(fire.checkFinish()){//移除畫完的
                this.dot-=FIREWORK2_PROPERTIES[fire.type].NUM;
                this.firework2s.splice(i,1);
                i--;
            }
            else{
                fire.update();
                fire.draw();
            }
        }
        this.ctx.drawImage(this.building,0,this.$canvas.height()-this.$canvas.width()/3,this.$canvas.width(),this.$canvas.width()/3);
    };

    this.shoot=function(type,ascii,fireworktype,pause){//0 don't buffer
        if(this.dot+FIREWORK2_PROPERTIES[type].NUM<=this.DOTMAX){
            this.dot+=FIREWORK2_PROPERTIES[type].NUM;
            if(!pause){//如果不是暫停模式的話
                let newFire=new Firework1(this.curPos.x,this.curPos.y,type,this.rocketOrNot,this.ctx, this.time);
                this.saveRecord1.push(newFire);
                this.firework1s.push(newFire);
            }
            else{
                this.alphabetBuffer.push(new Firework1(this.curPos.x,this.curPos.y,type,this.rocketOrNot,this.ctx, this.time));
                this.ctx.font='200 40px Verdana';
                if(fireworktype===0)
                    this.ctx.fillStyle='rgba(255,255,255,0.8)';
                else
                    this.ctx.fillStyle='rgba(255,0,0,0.8)';
                this.ctx.textAlign='center';
                this.ctx.beginPath();
                this.ctx.fillText(String.fromCharCode(ascii),this.curPos.x,this.curPos.y);
            }
        }
    };

    this.switchRocket=function(){this.rocketOrNot=!this.rocketOrNot;};
}

function vector(x,y){
    this.x=x;
    this.y=y;
    this.setVector=function(x,y){
        this.x=x;
        this.y=y;
    };
}

function Firework1(x,y,type,rocketOrNot,ctx,startTime){
    this.type=type;//哪一種煙火
    this.startPos=new vector(x,$(window).height());//開始的位置
    this.endPos=new vector(x,y);
    this.curPos=new vector(this.startPos.x,this.startPos.y);//目前位置
    this.time=Math.random()*480/window.fps+480/window.fps;//在空中發射的時間
    this.velocity=new vector( (this.endPos.x-this.startPos.x)/this.time , (this.endPos.y-this.startPos.y)/this.time);
    this.color='#FFFFFF';
    this.rocketOrNot=rocketOrNot;//是否有火箭，如果沒有，就隱形
    this.startTime=startTime;//開始的時間
    this.update=function(){
        if(this.curPos.y>this.endPos.y){
            this.curPos.x+=this.velocity.x;
            this.curPos.y+=this.velocity.y;
            return true;
        }
        else
            return false;
    };

    this.draw=function(){
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.curPos.x,this.curPos.y);
        ctx.lineTo(this.curPos.x-0.8*this.velocity.x,this.curPos.y-0.8*this.velocity.y);
        ctx.stroke();
        ctx.closePath();

        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.strokeStyle = '#FFE0A4';
        ctx.moveTo(this.curPos.x-0.8*this.velocity.x,this.curPos.y-0.8*this.velocity.y);
        ctx.lineTo(this.curPos.x-2*this.velocity.x,this.curPos.y-2*this.velocity.y);
        ctx.stroke();
        ctx.closePath();

        ctx.lineWidth = 1;
        ctx.beginPath();
        for(var i=0;i<5;i++){
            ctx.strokeStyle = '#CE7A38';
            ctx.moveTo(this.curPos.x-(2+0.4*i)*this.velocity.x,this.curPos.y-(2+0.4*i)*this.velocity.y);
            ctx.lineTo(this.curPos.x-(2.2+0.4*i)*this.velocity.x,this.curPos.y-(2.2+0.4*i)*this.velocity.y);
        }
        ctx.stroke();
        ctx.closePath();
    };
    this.reset=function(){
        this.curPos=new vector(this.startPos.x,this.startPos.y);
    };
}
function Firework2(x,y,type,ctx,time){
    this.startPos=new vector(x,y);
    this.fireworkPoints=[];
    this.startTime=time;
    this.type=type;
    this.firstPoint=0;//第一個開始發亮的點，用來判斷要不要亮背景
    this.init=function(){
        var tmp=getFireworkPoints(this.startPos.x,this.startPos.y,this.type,ctx);
        let color=tmp[0].color;
        let trueState=true;
        while(trueState==true){
            color=tmp[0].color;
            for(let i=0;i<tmp.length;i++)
                if(tmp[i].color==color){
                    this.fireworkPoints.push(tmp[i]);
                    tmp.splice(i,1);
                    i--;
                }
            if(tmp.length==0){
                break;
            }
        }
        let fire=this.fireworkPoints;
        for(let i=0;i<this.fireworkPoints.length;i++){
            if(fire[i].delay+fire[i].invisibleTime<fire[this.firstPoint].delay+fire[this.firstPoint].invisibleTime){
                this.firstPoint=i;
                if(fire[i].delay+fire[i].invisibleTime===0)
                    break;
            }
        }
    };
    this.checkStart=function(){//檢查是否開始畫
        if(this.fireworkPoints[0] && this.fireworkPoints[this.firstPoint].delayPtr<=0 && this.fireworkPoints[this.firstPoint].invisibleTimePtr<=0)
            return true;
        else
            return false;
    };
    this.checkDark=function(){//檢查是否暗掉
        if(this.fireworkPoints[0] && this.fireworkPoints[0].time>=FIREWORK2_PROPERTIES[this.type].TIME+50)
            return true;
        else
            return false;
    };
    this.checkFinish=function(){//檢查是否結束
        if(FIREWORK2_PROPERTIES[this.type].FINISH_TIME && this.fireworkPoints[0] && this.fireworkPoints[0].time>=FIREWORK2_PROPERTIES[this.type].FINISH_TIME+100)//if finish_time !== undefined
            return true;
        else if(!FIREWORK2_PROPERTIES[this.type].FINISH_TIME && this.fireworkPoints[0] && this.fireworkPoints[0].time>=FIREWORK2_PROPERTIES[this.type].TIME+100)//if finish_time === undefined
            return true;
        else
            return false;
    };
    this.update=function(){
        for(let i=0;i<this.fireworkPoints.length;i++){
            this.fireworkPoints[i].update();
        }
    };
    this.draw=function(){
        ctx.beginPath();
        ctx.fillStyle='#000000';
        let ptr=0;
        for(let i=0;i<this.fireworkPoints.length;i++){
            if(this.fireworkPoints[i].drawable()){
                if(ctx.fillStyle=='#000000'){
                    ctx.fillStyle=this.fireworkPoints[i].color;
                    ptr=i;
                }
                else if(this.fireworkPoints[i].color!==this.fireworkPoints[ptr].color){
                    ctx.fill();
                    ctx.closePath();
                    ctx.beginPath();
                    ctx.fillStyle=this.fireworkPoints[i].color;
                    ptr=i;
                }
                this.fireworkPoints[i].draw();
            }
        }
        ctx.fill();
        ctx.closePath();
    };
    this.reset=function(){//reset fireworkpoint會隨時間而改變的值
        for(let i=0;i<this.fireworkPoints.length;i++){
            let fire=this.fireworkPoints[i];
            fire.time=0;
            fire.delayPtr=fire.delay;
            fire.curPos.x=fire.startPos.x;
            fire.curPos.y=fire.startPos.y;
            fire.speed.x=fire.startSpeed.x;
            fire.speed.y=fire.startSpeed.y;
            fire.invisibleTimePtr=fire.invisibleTime;
        }
    };
}
export function FireworkPoint(x,y,speed,angle,color,radius,timeMax,delay,acceler,ctx,invisibleTime,friction){//每一個煙火點
    this.startPos=new vector(x,y);
    this.curPos=new vector(x,y);//目前點的位置
    this.startSpeed=new vector(speed*Math.cos(angle),speed*Math.sin(angle));
    this.speed=new vector(speed*Math.cos(angle),speed*Math.sin(angle));//目前速度
    this.time=0;
    this.delay=delay;//延遲
    this.delayPtr=this.delay;//延遲的指標，會隨時間而減少
    this.invisibleTime=invisibleTime;//隱形的時間
    this.invisibleTimePtr=this.invisibleTime;//隱形時間的指標
    this.timeInterval=400/window.fps;//間隔
    this.color=color;

    this.update=function(){
        if(this.delayPtr>0)
            this.delayPtr-=this.timeInterval;
        else{
            this.curPos.x=this.curPos.x+this.speed.x*this.timeInterval;//改變位置
            this.curPos.y=this.curPos.y+this.speed.y*this.timeInterval;
            this.time+=this.timeInterval;
            if( (this.speed.x>0 && this.speed.x<friction*this.speed.x*this.timeInterval) || (this.speed.x<0 && this.speed.x>friction*this.speed.x*this.timeInterval) || this.speed.x==0 )
                this.speed.x=0;//速度變0
            else
                this.speed.x-=friction*this.speed.x*this.timeInterval;//改變速度
            if(friction*this.speed.y<acceler*2)//尚未達到終端速度
                this.speed.y=this.speed.y-friction*this.speed.y*10+acceler*2*this.timeInterval;
            if(this.invisibleTimePtr>0)
                this.invisibleTimePtr-=this.timeInterval;
        }
    };
    this.draw=function(){
        ctx.moveTo(this.curPos.x,this.curPos.y);
        ctx.arc(this.curPos.x,this.curPos.y,radius,0,Math.PI*2,true);
    };
    this.drawable=function(){
        return !(this.time>=timeMax || this.delayPtr>0 || this.invisibleTimePtr>0);
    };
}

export function WordManager(ctx){
    var FADEOUTTIME=2500;//淡出的時間

    this.ctx=ctx;
    this.words=[];
    this.wordTime=[];
    this.ptr=0;
    this.opacity=0;
    this.timeCounter=0;
    this.size=40;
    this.x=$(window).width()/2;
    this.y=$(window).height()*0.9;
    this.color;
    this.$canvas;
    this.init=function(){
        if(!this.checkfinish()){
            this.update();
            this.draw();
        }
    };

    this.draw=function(){
        this.color='rgba'+'(255,255,255,'+this.opacity+')';
        this.ctx.font='300 '+this.size+'px Ubuntu';
        this.ctx.fillStyle=this.color;
        this.ctx.textAlign='center';
        this.ctx.beginPath();
        this.ctx.fillText(this.words[this.ptr],this.x,this.y);
    };

    this.update=function(){
        this.timeCounter+=25;
        if(this.timeCounter<=500)
            this.opacity+=0.05;
        else if(this.timeCounter>=this.wordTime[this.ptr] && this.timeCounter<this.wordTime[this.ptr]+500)
            this.opacity-=0.05;
        else if(this.timeCounter===this.wordTime[this.ptr]+FADEOUTTIME){
            this.ptr=this.ptr+1;
            this.timeCounter=0;
        }
    };

    this.checkfinish=function(){
        if(this.ptr==this.words.length)
            return true;
        else 
            return false;
    };

    this.getEachTime=function(){
        for(let i=0;i<this.words.length;i++){
            this.wordTime[i]=2500;
            for(let j=0;j<this.words[i].length;j++){
                if(this.words[i][j].match(/[^\x00-\xff]/ig) != null)
                    this.wordTime[i]+=250;
                else if(this.words[i][j]==' ')
                    this.wordTime[i]+=350;
            }
            if(this.wordTime[i]>=5000)
                this.wordTime[i]=5000;
        }
    };
}



