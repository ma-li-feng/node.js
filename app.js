'use strict';
// 1:引入express对象
const express = require('express');
// 2:创建服务器
let app = express();
// 3:开启服务器监听端口
app.listen(9999,()=>{
    console.log('34期服务器启动在9999端口');
});
// 引入数据库操作db对象
const db = require('./models/db');

const bodyParser = require('body-parser');
//引入session
const session = require('express-session');
//引入解析文件上传
const formidable = require('formidable');

//引入path
const path = require('path')
//配置模板引擎
app.engine('html', require('express-art-template') );


// 4:处理请求
//配置路由规则 开始
//分析db抽取功能 开始
//分析db抽取功能 结束
//

let router = express.Router();
let yhjk = express.Router()
yhjk.get('/login',(req,res,next) => {
     res.render('login.html');
})

yhjk.get('/index',(req,res,next) => {
    let id = req.session.man.id
    db.q('select * from musics where uid = ?',[id],(err,data) => {
        res.render('index.html',{
            data
        })
    })
})
yhjk.get('/edit',(req,res,next) => {
    let id = req.session.man.id
    db.q('select * from musics where uid = ?',[id],(err,data) => {
        res.render('index.html',{
            data
        })
    })
})



// ----------------------------------------------------------------------------------------
router.get('/test',(req,res,next)=>{
    db.q('select * from users',[],(err,data)=>{
        if(err)return next(err);
        res.render('test.html',{
            text:data[0].dir
        })
    })
})

.post('/api/checkuser',(req,res,next) => {
    let username = req.body.username;
    db.q('select * from users where username = ?',[username],(err,data) => {
       
        if(err) return next(err)
            if(data.length == 0) {
                 res.json({
                         code:'001',
                         msg:'可以注册'
                  })
            }else{
                res.json({
                    code:'002',
                    msg:'用户已存在'
                })
            }
    })
})
// 注册
.post('/api/zhuce',(req,res,next) => {
    let news = req.body
    let username = news.username
    let password = news.password
    let email = news.email

    // 判断用户名与邮箱是否存在
    db.q('select * from users where username = ? or email = ?',[username,email],(err,data) => {
        if(err) return next(err)
        if(data.length != 0) {
            let user = data[0]
            // console.log(data)
            if(user.email == email){
                return res.json({
                    code:'002',
                    msg:'邮箱存在'
                })
            }
            if(user.username == username){
                return res.json({
                    code:'002',
                    msg:'用户已经存在'
                })
            }
        }
        else{
            // 可以注册
           console.log(data)
            db.q('insert into users (username,password,email) value (?,?,?)',[username,password,email],(err,result) =>{
                if(err) return next(err)
                    res.json({
                        code:'001',
                        msg:'注册成功'
                    })
            })
        }
    })
    // 判断
})
// 登录验证
.post('/api/denglu',(req,res,next) => {
    let news = req.body
    let username = news.username
    let password = news.password
    db.q('select * from users where username = ?',[username],(err,data) => {
        if(err) return next(err)
        if(data.length == 0) {return res.json({code:'002',msg:'用户名或密码不正确'})}
            else{
                let user = data[0]
                if(user.password == password) {
                    req.session.man = user;
                    res.json({
                        code:'001',
                        msg:'登录成功'
                    })
                }else{
                    res.json({
                        code:'002',
                        msg:'用户名或密码不正确'
                    })
                }
            }
        
    })
})
// 上传音乐
.post('/api/upMusic',(req,res,next) => {
    if(!req.session.man){
         res.send(`
                 请去首页登录
                 <a href="/user/login">点击</a>
            `);
        return;
    }

    var form = new formidable.IncomingForm();
    form.uploadDir = path.join(__dirname,'public/music');
    form.parse(req,function(err,fields,files){
        if(err) return next(err)
         let arr = [fields.title,fields.singer,fields.time]
         let sql = 'insert into musics (title,singer,time'
         let str = '(?,?,?'
        if(files.file){
            let filename = path.parse(files.file.path).base
            arr.push(`/public/music/${filename}`)
            sql+=',file'
            str+=',?'
        }
        if(files.filelrc){
            let geci = path.parse(files.filelrc.path).base
            arr.push(`/public/music/${geci}`)
            sql+=',filelrc'
            str+=',?'
        }
        sql += ',uid) values ';
        str +=',?)'
        console.log(sql)
         console.log(str)
         console.log(arr)
        arr.push(req.session.man.id)
        db.q(sql+str,arr,(err,data) => {
            if(err) return next(err)
            res.json({
                code:'001',
                msg:'音乐添加成功'
            })
        })

    })

    // 数据库字符串
     
})
//修改音乐
.put('/api/gengxinMusic',(req,res,next) => {
     if(!req.session.man){
         res.send(`
                 请去首页登录
                 <a href="/user/login">点击</a>
            `);
        return;
     }
    var form = new formidable.IncomingForm() 
    form.uploadDir = path.join(__dirname,'public/music')
  form.parse(req,function(err,fields,files){
        if(err) return next(err)
         let arr = [fields.title,fields.singer,fields.time]
         let sql = 'update musics set title=?,singer=?,time=?'
        if(files.file){
            let filename = path.parse(files.file.path).base
            arr.push(`/public/music/${filename}`)
            sql+=',file=?'
        }
        if(files.filelrc){
            let geci = path.parse(files.filelrc.path).base
            arr.push(`/public/music/${geci}`)
            sql+=',filelrc=?'
        }
        sql += ' where id = ?';
        arr.push(fields.id)
        console.log(sql)
        console.log(arr)
        db.q(sql,arr,(err,data) => {
            if(err) return next(err)
            res.json({
                code:'001',
                msg:'音乐修改成功'
            })
        })

    })
})



//配置路由规则 结束
app.use(session({
  secret: 'itcast', //唯一标识，必填
  resave: false, 
  //true强制保存,不管有没有改动session中的数据，依然重新覆盖一次
  saveUninitialized: true,//一访问服务器就分配session
  //如果为false,当你用代码显式操作session的时候才分配
  // cookie: { secure: true // 仅仅在https下使用 }
}));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());


// 暴露views
app.use('/public',express.static('./public'))
// app.use('/views',express.static('./views'))

//中间件配置行为列表
//第一件事: 路由
app.use(router);
app.use('/user',yhjk)
// 第二件事: 错误处理
app.use((err,req,res,next)=>{
    console.log(err);
    res.send(`
        <div style="background-color:yellowgreen;">
            您要访问的页面，暂时去医院了..请稍后再试..
            <a href="/">去首页</a>
        </div>
    `)
});