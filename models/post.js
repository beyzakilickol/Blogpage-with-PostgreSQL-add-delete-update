class POST{
  constructor(postid,username,posteddate,title,description){
    this.postid =postid
    this.username = username
    this.posteddate = posteddate
    this.title = title
    this.description = description
    this.comments = []
  }
}
module.exports = POST
