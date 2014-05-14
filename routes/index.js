var express = require('express');
var router = express.Router();

module.exports = function(app){
    app.get('/',function(req,res){
        res.render('index',{title:'主页'});
    });
    app.route('/reg')
        .get(function(req,res){
            res.render('reg',{title:'注册'});
        })
        .post(function(req,res){

        });
    app.route('/login')
        .get(function(req,res){
            res.render('login',{title:'登录'});
        })
        .post(function(req,res){

        });
    app.route('/post')
        .get(function(req,res){
            res.render('post',{title:'发表'});
        })
        .post(function(req,res){

        });
    app.get('/logout',function(req,res){

    });
};
