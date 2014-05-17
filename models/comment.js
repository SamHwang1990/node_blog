/**
 * Created by Sam on 14-5-17.
 * Comment Model
 */

var mongodb = require('./db');

function Comment(name, day, title, email, webSite, time, content){
    this.name = name;
    this.day = day;
    this.title = title;
    this.email = email;
    this.webSite = webSite;
    this.time = time;
    this.content = content;
}

module.exports = Comment;

//存储一条留言信息
Comment.prototype.save = function(callback){
    var name = this.name,
        day = this.day,
        title = this.title,
        comment = {
            name:this.name,
            email:this.email,
            webSite:this.webSite,
            time:this.time,
            content:this.content
        };
    //打开数据库
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection('posts',function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //通过用户名、时间及标题查找文档，并把一条留言对象添加到该文档的comments数组里
            collection.update({
                "name": name,
                "time.day":day,
                "title":title
            },{
                $push:{'comments':comment}
            }, function(err){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            })
        })
    })
}
