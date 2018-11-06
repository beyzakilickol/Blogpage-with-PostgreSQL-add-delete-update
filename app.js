const express = require('express')
const mustacheExpress = require('mustache-express')
const bodyParser = require('body-parser')
const app = express()
var session = require('express-session')
// import the pg-promise library which is used to connect and execute SQL on a postgres database
const pgp = require('pg-promise')()
// connection string which is used to specify the location of the database
const connectionString = "postgres://localhost:5432/blogdb"
// creating a new database object which will allow us to interact with the database
const db = pgp(connectionString)
const POST = require('./models/post')
const COMMENT = require('./models/comments')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('css'))

app.engine('mustache',mustacheExpress())
app.set('views','./views')
app.set('view engine','mustache')
app.use(session({
  secret: 'cat',
  resave: false,
  saveUninitialized: false
}))
app.listen(3011,function(req,res){
  console.log("Server has started...")
})
//------------------------------------------------------------
//------------------------Middleware------------------------------------
// let authenticateLogin = function(req,res,next) {
//
//   // check if the user is authenticated
//   if(req.session.username) {
//     next()
//   } else {
//     res.redirect("/")
//   }
//
// }
// app.all("/user/*",authenticateLogin,function(req,res,next){
//     next()
// })
//-----------------------------------------------------------
app.get('/comment/:postid',function(req,res){
  let postId = req.params.postid

  res.render("add_comment",{postid:postId})
})
app.post('/comment/:postid', function(req,res){
  let postId = req.params.postid
  let commentBody = req.body.commentBody
  let commentPostDate = new Date().toLocaleString()
  db.none('INSERT INTO comments(commentposteddate,body,postid) VALUES($1,$2,$3)',[commentPostDate,commentBody,postId]).then(function(){
   res.redirect('/')
  }).catch(function(error){
    console.log(error)
  })

})
let posts =[]
app.get('/',function(req,res){

  posts = []

  db.any('SELECT u.postid,u.username,u.posteddate,u.title,u.description,c.commentposteddate,c.body,c.commentid from userposts u LEFT JOIN comments c on u.postid = c.postid ').then(function(result){
    result.forEach(function(item){
      let existingPost = posts.find(function(post){
        return post.postid == item.postid
      })

if(existingPost ==null){

     let post = new POST(item.postid,item.username,item.posteddate,item.title,item.description)
     let comment = new COMMENT(item.commentid,item.commentposteddate,item.body)
     post.comments.push(comment)
     posts.push(post)
} else{

  let comment = new COMMENT(item.commentid,item.commentposteddate,item.body)
  existingPost.comments.push(comment)
}


})
if(req.session.username){
res.render('index',{posts:posts,username : req.session.username})
} else {
  res.render('index',{posts:posts})
}
  }).catch(function(error){
    console.log(error)
  })
  console.log(posts)

})

app.get('/add_post', function(req,res){
  res.render('add_post')
})
app.post('/', function(req,res){
  let postDate = new Date().toLocaleString()
  let username = req.body.username
  let title= req.body.title
  let description = req.body.description

db.none('INSERT INTO userposts(username,postedDate,title,description) VALUES($1,$2,$3,$4)',[username,postDate,title,description]).then(function(){
  res.redirect('/')
}).catch(function(error){
  console.log(error)
})

})
app.post("/remove_post", function(req,res){
  let postId = req.body.postId
    db.none('DELETE FROM comments WHERE postid=$1;',[postId]).then(function(){
      db.none('DELETE FROM userposts WHERE postid=$1;',[postId]).then(function(){
        res.redirect('/')
    })

  }).catch(function(error){
    res.send(error)
  })
})
app.get('/update_post/:postid',function(req,res){
  let postId = req.params.postid
  db.one('SELECT postid,username,posteddate,title,description FROM userposts WHERE postid=$1',[postId]).then(function(result){
    console.log(result)
    res.render('update_post',{result})
  }).catch(function(error){
    console.log(error)
  })

})
app.post("/update_post",function(req,res){
  let username = req.body.username
  let title= req.body.title
  let description = req.body.description
  let postId = req.body.postId
  let postedDate = new Date().toLocaleString()
  db.none('UPDATE userposts SET username = $1, posteddate=$2,title = $3, description=$4 WHERE postid=$5',[username,postedDate, title,description,postId]).then(function(){
    res.redirect('/')
  }).catch(function(error){
    console.log(error)
  })
})
//----------user authentication-----------
app.get('/login', function(req,res){
  res.render('login')
})
app.get('/register',function(req,res){
  res.render('register')
})
app.post('/add_user_db',function(req,res){
  let username = req.body.username
  let email = req.body.email
  let password = req.body.password
  db.none('INSERT INTO users(username,password,email) VALUES($1,$2,$3)',[username,password,email]).then(function(){
    console.log("User is registered...")
    res.redirect('/login')
  }).catch(function(error){
    console.log(error)
  })
})
app.post('/login',function(req,res){
  let username = req.body.username
  let password = req.body.password
  db.one('SELECT username,password FROM users WHERE username =$1 and password = $2',[username,password]).then(function(result){
    if(result != null){
      req.session.username = result.username
      res.redirect('/')
    } else {
      res.redirect('/register')
    }
  }).catch(function(error){
    console.log(error)
  })

})
app.get('/logout',function(req,res){
  if(req.session.username){
    req.session.destroy()
    res.redirect('/')
  } else {
    res.redirect('/login')
  }
})
