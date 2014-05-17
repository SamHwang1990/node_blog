var crypto = require('crypto'),
    fs = require('fs'),
    busboy = require('connect-busboy'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    Comment = require('../models/comment.js');

function checkLogin(req,res,next){
    if(!req.session.user){
        req.flash('error','未登录');
        res.redirect('/login');
    }
    next();
}

function checkNotLogin(req,res,next){
    if(req.session.user){
        req.flash('error','已登录');
        res.redirect('back');       //返回之前的页面
    }
    next();
}

module.exports = function(app){
    app.get('/',function(req,res){
        Post.getAll(null,function(err, posts){
            if(err){
                posts = [];
            }
            res.render('index',{
                title:'主页',
                user:req.session.user,
                posts:posts,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            });
        });
    });

    app.route('/reg')
        .get(checkNotLogin)
        .get(function(req,res){
            res.render('reg',{
                title:'注册',
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            });
        })
        .post(checkNotLogin)
        .post(function(req,res){
            var name = req.body.name,
                password = req.body.password,
                password_re = req.body['password-repeat'];
            //检验用户两次输入的密码是否一致
            if(password != password_re){
                req.flash('error','两次输入的密码不一致');
                return res.redirect('/reg');    //返回注册页
            }
            //生成密码的md5值
            var md5 = crypto.createHash('md5'),
                password = md5.update(password).digest('hex');
            var newUser = new User({
                name:name,
                password:password,
                email:req.body.email
            });
            //检查用户名是否已存在
            User.get(newUser.name, function(err, user){
                if(user){
                    req.flash('error','用户已存在！');
                    return res.redirect('/reg');    //返回注册页
                }
                //如果不存在则新增用户
                newUser.save(function(err, user){
                    if(err){
                        req.flash('error',err);
                        return res.redirect('/reg');    //返回注册页
                    }
                    req.session.user = user;    //用户信息存入 session
                    req.flash('success', '注册成功');
                    res.redirect('/');          //注册成功后返回主页
                })
            })
        });

    app.route('/login')
        .get(checkNotLogin)
        .get(function(req,res){
            res.render('login',{
                title:'登录',
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            });
        })
        .post(checkNotLogin)
        .post(function(req,res){
            //生成密码的md5 值
            var md5 = crypto.createHash('md5'),
                password = md5.update(req.body.password).digest('hex');
            //检查用户是否存在
            User.get(req.body.name,function(err,user){
                if(!user){
                    req.flash('error','用户不存在')
                    return res.redirect('/login');  //用户不存在则跳转到登录页
                }
                //检查密码是否一致
                if(user.password != password){
                    req.flash('error','密码错误')
                    return res.redirect('/login');  //用户不存在则跳转到登录页
                }
                //用户名密码都匹配后，将用户信息存入session
                req.session.user = user;
                req.flash('success','登录成功');
                res.redirect('/');                  //登录成功后跳转到主页
            });
        });

    app.route('/post')
        .get(checkLogin)
        .get(function(req,res){
            res.render('post',{
                title:'发表',
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            });
        })
        .post(checkLogin)
        .post(function(req,res){
            var currentUser = req.session.user,
                post = new Post(currentUser.name, req.body.title, req.body.post);
            post.save(function(err){
                if(err){
                    req.flash('error',err);
                    return res.redirect('/');
                }
                req.flash('success','发布成功！');
                res.redirect('/');
            })
        });

    app.get('/logout',checkLogin);
    app.get('/logout',function(req,res){
        req.session.user = null;
        req.flash('success','登出成功');
        res.redirect('/');                  //登录成功后跳转到主页
    });

    app.use(busboy());
    app.route('/upload')
        .get(checkLogin)
        .get(function(req,res){
            res.render('upload',{
                title:'文件上传',
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            })
        })
        .post(checkLogin)
        .post(function(req,res){
            /*for(var i in req.files){
                if(req.files[i].size == 0){
                    //使用同步方式删除一个文件
                    fs.unlinkSync(req.files[i].path);
                    console.log('Successfully removed an empty file!');
                } else{
                    var target_path = './public/images/' + req.files[i].name;
                    //使用同步方式重命名一个文件
                    fs.renameSync(req.files[i].path, target_path);
                    console.log('Successfully renamed a file!');
                }
            }*/
            var fstream;
            req.pipe(req.busboy);
            req.busboy.on('file', function (fieldname, file, filename) {
                console.log("Uploading: " + filename);
                fstream = fs.createWriteStream(__dirname + '/public/images/' + filename);
                file.pipe(fstream);
                fstream.on('close', function () {
                    res.redirect('back');
                });
            });
            req.flash('success','文件上传成功！');
            res.redirect('/upload');
        });

    app.get('/u/:name',function(req,res){
        //检查用户是否存在
        User.get(req.params.name, function(err, user){
            if(!user){
                req.flash('error','用户不存在！');
                return res.redirect('/');
            }
            Post.getAll(user.name, function(err, posts){
                if(err){
                    req.flash('error',err);
                    return res.redirect('/');
                }
                res.render('user',{
                    title:user.name,
                    posts:posts,
                    user:req.session.user,
                    success:req.flash('success').toString(),
                    error:req.flash('error').toString()
                });
            });
        });
    });
    app.get('/u/:name/:day/:title',function(req,res){
        Post.getOne(req.params.name, req.params.day, req.params.title, function(err, post){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('article',{
                title:req.params.title,
                post:post,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            })
        })
    })
    app.post('/u/:name/:day/:title',function(req,res){
        var date = new Date(),
            time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" +
                date.getDate() + " " + date.getHours() + ":" +
                (date.getMinutes() <10 ? '0' + date.getMinutes() :date.getMinutes());

        var newComment = new Comment(req.params.name,req.params.day,req.params.title,req.body.email,req.body.website,time,req.body.content);
        newComment.save(function(err){
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            req.flash('success','留言成功');
            res.redirect('back');
        })
    })

    app.route('/edit/:name/:day/:title')
        .get(checkLogin)
        .get(function(req,res){
            var currentUser = req.session.user;
            Post.edit(currentUser.name, req.params.day, req.params.title, function(err, post){
                if(err){
                    req.flash('error',err);
                    return res.redirect('back');
                }
                res.render('edit',{
                    title:'编辑',
                    post:post,
                    user:req.session.user,
                    success:req.flash('success').toString(),
                    error:req.flash('error').toString()
                })
            })
        })
        .post(checkLogin)
        .post(function(req,res){
            var currentUser = req.session.user;
            Post.update(currentUser.name, req.params.day, req.params.title, req.body.post,function(err){
                var url = '/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title;
                if(err){
                    req.flash('error',err);
                    return res.redirect(url);
                }
                req.flash('success','修改成功');
                res.redirect(url);
            })
        })


    app.route('/remove/:name/:day/:title')
        .get(checkLogin)
        .get(function(req, res){
            var currentUser = req.session.user;
            Post.remove(currentUser.name, req.params.day, req.params.title,function(err){
                if(err){
                    req.flash('error',err);
                    return res.redirect('back');
                }
                req.flash('success','删除成功');
                res.redirect('/');
            })
        })
};
