//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const  _ = require("lodash")
//const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-abhiram:aA111975@cluster0.uulti.mongodb.net/todolistDB");

const itemsSchema = {
  name: String
}
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
})

const defaultItems = [item1, item2]

const listSchema = {
  name : String,
  items : [itemsSchema]
}

const ignore = ["Favicon.ico","Robots.txt", "Humans.txt", "Sitemap.xml", "Ads.txt"]
const List = mongoose.model("list",listSchema);

app.get("/about", function(req, res) {
  res.render("about");
});

app.get("/:customListName",(req,res)=>{
  const customListName = _.capitalize(req.params.customListName);

  if(ignore.includes(customListName))
    return

  List.findOne({name:customListName},(err,foundList)=>{
    if(!foundList){
      //create new documnet
      const list = new List({
        name : customListName,
        items : defaultItems
      })
      list.save();
      res.redirect("/"+customListName)
    //console.log("Exist");
  }
  // else if(foundList.items.length===0){
  //   foundList.items = defaultItems;
  //   foundList.save()
  //   res.redirect("/"+customListName)
  // }
  else{
      //show existing document
      res.render("list", {  listTitle: customListName,newListItems: foundList.items})
    // console.log("Doesn't Exist");
  }
  })

})


app.get("/", function(req, res) {

  Item.find({}, (err, foundItems) => {        //find the documents in the collection and its retrieved on foundItems

    if (foundItems.length == 0) {      //if there is nothing in the collection insert the default items
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err)
        } else {
          console.log("Added Default elements")
        }
      })
      res.redirect('/');

    } else {         //if the collection not empty render the page by passing the collection items to the ejs
      res.render("list", {  listTitle: "Today",newListItems: foundItems})
    }
    //res.render("list", {listTitle: "Today", newListItems: foundItems}) // insted of else and using redirect we can always call res.render
  });

});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  if(itemName===""){
    if(listName=="Today")
      res.redirect("/")
    else
      res.redirect("/"+listName)

      return
  }

  const item = new Item({
    name: itemName
  })

  if(listName==="Today"){
    item.save();  // Add the new item to the the Item collection ie save the item document to collection
    res.redirect("/");  // Render the new item by going to above function
  }else{
    //find the document first in list collection, Then push the item above to the array of the document items which is also of type Item model
    List.findOne({name:listName},(err,foundList)=>{
      if(!err){
        foundList.items.push(item)
        foundList.save(); //save the updated foundList to the collection
        res.redirect("/"+listName)
      }
    })
  }

});

app.post("/delete", (req, res) => {
  const checkItemID = req.body.checkBox   // this will return the value ie id of the document
  const listName = req.body.listName;

  if(listName==="Today"){
    Item.findByIdAndRemove(checkItemID, (err) => {  //delete from collection item using id
      if (!err) {
        console.log("Deleltion Success")
        res.redirect("/")  // redirect to render the updated page
      }
    });
  }else{ //if the list name is not today delete from the array of items of the listname using list id
    //collection.findOneAndUpdate({condition for document},{update},callback)
    // to delete from array use {$pull :{arrayname : {condition to find the array}}}
    List.findOneAndUpdate({name:listName},{ $pull: { items: { _id:checkItemID}}},function(err,foundList){
      if(!err)
        res.redirect("/"+listName)
    });
  }
});



app.listen(3000, function() {
  console.log("Server started on port 3000");
});
