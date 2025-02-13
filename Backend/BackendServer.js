const express = require("express");
const app = express();
const fs = require("fs");
const { ObjectId } = require("mongodb");
const port = 5000;  
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
const path = require("path");
app.use(express.json({ limit: "1000mb" }));
const User = require('./userSchema')
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");


app.use(bodyParser.json({ limit: "1000mb" }));
app.use(bodyParser.urlencoded({ limit: "1000mb", extended: true }));
app.use(cookieParser());

const mongoose = require("mongoose");
const { log } = require("console");
mongoose.connect("mongodb://127.0.0.1:27017/CodingClubDB");

const Contest = mongoose.model(
  "contest",
  new mongoose.Schema({
    name: String,
    type: String,
    startDate: Date,
    endDate: Date,
    contestLink: String,
    resultLink: String,
    solutionLink: String,
    // time : String
  })
);
app.get("/contest/past", (req, res) => {
  Contest.find({})
    .then((contestinfo) => {
      contestinfo = contestinfo.filter((data) => {
        var d =  new Date();
        return data.endDate.getTime() < d.getTime();
      })
     
      res.send(contestinfo);
    })
    .catch((err) => {
      console.error(err);
    });
});

app.get("/contest/current", (req, res) => {
  Contest.find({})
    .then((contestinfo) => {
      contestinfo = contestinfo.filter((data) => {
        var d =  new Date();
        return (data.startDate.getTime() <= d.getTime() && data.endDate.getTime() > d.getTime());
      })
      res.send(contestinfo);
    })
    .catch((err) => {
      console.error(err);
    });
});

app.get("/contest/upcoming", (req, res) => {
  Contest.find()
    .then((contestinfo) => {
      contestinfo = contestinfo.filter((data) => {
        var d =  new Date();
        return data.startDate.getTime() >= d.getTime();
      })
      res.send(contestinfo);
    })
    .catch((err) => {
      console.error(err);
    });
});

app.post("/registerContest", async (req,res) => {
  const data = req.body;
  // console.log(data);
  var start = new Date(0);
  start.setFullYear(parseInt(data.startDate.substring(0, 4)));
  start.setMonth(parseInt(data.startDate.substring(5, 7)) - 1);
  start.setDate(parseInt(data.startDate.substring(8, 10)));
  start.setHours(parseInt(data.startTime.substring(0, 2)));
  start.setMinutes(parseInt(data.startTime.substring(3, 5)));
  
  var end = new Date(0);
  end.setFullYear(parseInt(data.endDate.substring(0, 4)));
  end.setMonth(parseInt(data.endDate.substring(5, 7)) - 1);
  end.setDate(parseInt(data.endDate.substring(8, 10)));
  end.setHours(parseInt(data.endTime.substring(0, 2)));
  end.setMinutes(parseInt(data.endTime.substring(3, 5)));
  // console.log(start);
  // console.log(end);
  const newContest = Contest({
    name : data.name,
    type : data.type,
    startDate : start,
    endDate : end,
    contestLink : data.cLink,
    resultLink : data.rLink,
    solutionLink : data.sLink
  })

  await newContest.save();
  res.send({message : "Contest Registered successfully!"});
});

const Project = mongoose.model(
  "project",
  new mongoose.Schema({
    projectName: String,
    description: String,
    tags: [],
    contributors: [ObjectId], //Array of UserCollections
    projectLink: String,
    projectInfo: String,
    image: String,
    video: String,
  })
);

app.post("/project", (req, res) => {
  Project.find({})
    .then((projectinfo) => {
      res.send(projectinfo);
    })
    .catch((err) => {
      console.error(err);
    });
});



app.post("/addproject", async (req, res) => {
  const members = req.body.projectteam;
  // console.log("asd");
  var memberDataArray = [];

  for (const memUsername of members) {
    try {
      const userData = await User.find({ username: memUsername });
      if (userData) {
        memberDataArray.push(userData[0]._id);
      }

      res.send({message : "Project uploaded successfully!"});
    } catch (error) {
      console.error(`Error fetching data for userID: ${memUsername}`, error);
      // Handle the error as needed
    }
  }
  // console.log("MemberDataArray:", memberDataArray);

  const newproject = new Project({
    projectName: req.body.projectname,
    description: req.body.projectdescription,
    tags: req.body.projecttags,
    contributors: memberDataArray, //Array of UserCollections
    projectLink: req.body.projectlink,
    projectInfo: req.body.projectinfo,
    image: req.body.projectimage,
    video: req.body.projectvideo,
  });
  await newproject.save();
  // console.log("newproj", newproject);
  res.end();
});

app.post("/deleteproject",async (req,res) => {
  await Project.deleteOne({"projectName": req.body.project_name});
  // console.log( req.body.project_name);
  
  res.send({message : 'Project deleted successfully!'});
})

app.get(`/projectDisplay/userData/`, async (req, res) => {
  try {
    const userID = req.query.userID;
    const admin = await User.findById(userID, 'isAdmin');
    // console.log(admin);
    res.send({ admin: admin.isAdmin });
  } catch (e) {
    // Handle the exception here, for example, log the error or send an error response.
    console.error(e);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});


app.get("/user", (req, res) => {
  User.find({})
    .then((userinfo) => {
      res.send(userinfo);
    })
    .catch((err) => {
      // console.log(err);
    });
});

app.post("/findusername", jsonParser, function (req, res) {
  User.find({ _id: req.body.userID })
    .then((userinfo) => {
      if (userinfo.length > 0) {
        // // // console.log(userinfo[0].username);
        res.send(userinfo);
      }
      // // // console.log("ok");
    })
    .catch((err) => {
      // // console.log(err);
    });
});

const Question = mongoose.model(
  "question",
  mongoose.Schema({
    asker: ObjectId,
    question: String,
    description: String,
    code: String,
    upvotes: Number,
    askDate: Date,
    replies: [],
    tags: [],
  })
);

app.get("/question", (req, res) => {
  Question.find({})
    .then((questioninfo) => {
      res.send(questioninfo);
    })
    .catch((err) => {
      // console.log(err);
    });
});

app.post("/addmyquestion", jsonParser, function (req, res) {
  const newquestion = new Question({
    asker: new ObjectId(req.body.questionasker),
    question: req.body.questiontital,
    description: req.body.questiondescription,
    code: req.body.questioncode,
    upvotes: 0,
    askDate: new Date(),
    replies: [],
    tags: req.body.questiontags,
  });
  // // console.log(req.body);
  newquestion.save();
  res.send({message : "Question uploaded successfully!"});
});

const Resplie = mongoose.model(
  "replie",
  mongoose.Schema({
    replier: ObjectId,
    description: String,
    code: String,
    upvotes: Number,
    replyDate: Date,
  })
);

app.post("/addmyreply", jsonParser, function (req, res) {
  const newreply = new Resplie({
    replier: new ObjectId(req.body.answerreplier),
    description: req.body.answerreply,
    code: req.body.answercode,
    upvotes: 0,
    replyDate: new Date(),
  });

  newreply.save().then((data) => {
    var arr;
    // // console.log(data);
    Question.find({ _id: req.body.answerqid }).then((questioninfo) => {
      // // // console.log(questioninfo);

      arr = questioninfo[0].replies;
      arr.push(data._id);
      // // // console.log(arr);
      Question.findOneAndUpdate(
        { _id: req.body.answerqid },
        { replies: arr },
        { new: true }
      ).then((data) => {
        // // console.log(data);
      });
    });
  });
  res.send({message : "Reply added successfully!"});
});

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000"); // Replace with the origin of your client-side app
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

const forumSchema = mongoose.Schema({
  asker: ObjectId,
  question: String,
  description: String,
  code: String,
  upvotes: Number,
  askDate: Date,
  replies: [],
  tags: [],
});

// const userSchema = mongoose.Schema({
//   profileImg: String,
//   fname: String,
//   lname: String,
//   username: String,
//   about: String,
//   linkedIn: String,
//   programme: String,
//   department: String,
//   year: Number,
//   email: String,
//   password: String,
//   skills: [],
//   questionUpvotes: [ObjectId],
//   repliesUpvotes: [ObjectId],
// });

const replySchema = mongoose.Schema({
  replier: ObjectId,
  description: String,
  code: String,
  upvotes: Number,
  replyDate: Date,
});

const resSchema = mongoose.Schema({
  subject: String,
  logo: String,
  books: [],
  videos: [],
  notes: [],
});

// const Question = mongoose.model('question', forumSchema);
// const Resplie = mongoose.model('replie', replySchema);
// const User = mongoose.model('user', userSchema);
const resModel = mongoose.model("resources", resSchema);

app.get("/resources", async (req, resp) => {
  let docs = await resModel.find();
  docs.forEach((element) => {
    element.books = element.books.length;
    element.videos = element.videos.length;
    element.notes = element.notes.length;
  });
  resp.send(docs);
});

app.post('/addmysubject',(req,res)=>{
  const topic = req.body.subject;
  const logo = req.body.sublogo;

  // console.log(topic);

  const newSub = new resModel({
    subject : topic,
    logo : logo,
  });
  const respons = newSub.save();
  res.send({message : "Subject added successfully!"});
  // console.log(respons);
})

app.post('/addmybook',async (req,res)=>{
  const subject = req.body.sub_id;
  const book = {
    title : req.body.book,
    link:req.body.link,
    author:req.body.author,
    edition:req.body.edition,
    thumbnail:req.body.thumbnail,
  }
  const subObj = await resModel.findById(subject);
  subObj.books.push(book);
  const a = await subObj.save();
  // console.log(a);
  res.send({message : "Book added successfully!"});
})

app.post('/addmynote',async (req,res)=>{
  const subject = req.body.sub_id;
  const note = {
    title : req.body.note,
    link:req.body.link,
  }
  const subObj = await resModel.findById(subject);
  subObj.notes.push(note);
  const a = await subObj.save();
  // console.log(a);
  res.send({message : "Note added successfully!"});
})

app.post('/addmyvideo',async (req,res)=>{
  const subject = req.body.sub_id;
  const video = {
    title : req.body.video,
    link:req.body.link,
    channel:req.body.channel,
    source:req.body.source,
  }
  const subObj = await resModel.findById(subject);
  subObj.videos.push(video);
  const a = await subObj.save();
  // console.log(a);
  res.send({message : "Video added successfully!"});
})


app.delete('/resources/delTopic/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await resModel.deleteOne({ _id: id });

    if (result.deletedCount === 1) {
      return res.json({ message: 'Deleted successfully' });
    } else {
      return res.status(404).json({ error: 'Question not found' });
    }
  } catch (error) {
    console.error('Error deleting question:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/resources/delBook/:sub_id', async (req, res) => {
  try {
      const id = req.params.sub_id;
      const updatedbooks = req.body.updatedbooks;

      console.log("Received request:");
      console.log("ID:", id);
      console.log("Updated books:", updatedbooks);

      const result = await resModel.updateOne({ _id: id }, { $set: { books: updatedbooks } });
      
      console.log("Database update result:", result);

      if (result.nModified === 1) {
          return res.json({ message: 'books updated successfully' });
      } else {
          return res.status(404).json({ error: 'book not found or no changes were made' });
      }
  } catch (error) {
      console.error('Error updating books:', error);
      return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/resources/delVideo/:sub_id', async (req, res) => {
  try {
      const id = req.params.sub_id;
      const updatedvideos = req.body.updatedvideos;

      console.log("Received request:");
      console.log("ID:", id);
      console.log("Updated videos:", updatedvideos);

      const result = await resModel.updateOne({ _id: id }, { $set: { videos: updatedvideos } });
      
      console.log("Database update result:", result);

      if (result.nModified === 1) {
          return res.json({ message: 'videos updated successfully' });
      } else {
          return res.status(404).json({ error: 'video not found or no changes were made' });
      }
  } catch (error) {
      console.error('Error updating videos:', error);
      return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/resources/delNote/:sub_id', async (req, res) => {
  try {
      const id = req.params.sub_id;
      const updatedNotes = req.body.updatednotes;

      console.log("Received request:");
      console.log("ID:", id);
      console.log("Updated Notes:", updatedNotes);

      const result = await resModel.updateOne({ _id: id }, { $set: { notes: updatedNotes } });
      
      console.log("Database update result:", result);

      if (result.nModified === 1) {
          return res.json({ message: 'Notes updated successfully' });
      } else {
          return res.status(404).json({ error: 'Note not found or no changes were made' });
      }
  } catch (error) {
      console.error('Error updating notes:', error);
      return res.status(500).json({ error: 'Internal server error' });
  }
});




// app.post('/resources/content', (req, resp) => {
//   const data = req.body;
//   // console.log(data);
// })

app.get("/asker", async (req, resp) => {
  const asker_id = req.query.askerId;
  const user = await User.findById(asker_id, "_id profileImg username");
  resp.send(user);
});

app.post("/discussion", async (req, resp) => {
  try {
    let ques = await Question.find();
    let m = new Map();

    for (const element of ques) {
      let U = await User.findById(element.asker, "username profileImg");
      m.set(element._id, U);
    }

    // Convert the Map to an array of key-value pairs
    const mArray = Array.from(m);

    resp.json({'ques' : ques, 'mArray' : mArray});
  } catch (error) {
    resp.status(500).json({ error: "An error occurred" });
  }
});

app.get("/discussion/question", async (req, resp) => {
  try {
    const q_id = req.query.q_id;
    const userID = req.query.userID;

    const replierMap = new Map();
    const upvoteMap = new Map();

    // console.log(q_id);
    // console.log("sdfgeragye       :          "+userID);

    const Q_data = await Question.findById(q_id);
    const Asker = await User.findById(Q_data.asker, "username profileImg");
    const Q_upvote = await User.findOne(
      { _id: userID },
      "-_id questionUpvotes"
    ).then((obj) => {
      return obj.questionUpvotes.includes(q_id);
    });

    const R_data = await Resplie.find({ _id: { $in: Q_data.replies } });
    const R_upvotes = await User.findOne(
      { _id: userID },
      "-_id repliesUpvotes"
    ).then((obj) => {
      return obj.repliesUpvotes;
    });
    for (const element of R_data) {
      let bool = R_upvotes.includes(element._id);
      upvoteMap.set(element._id, bool);
    }
    const uArr = Array.from(upvoteMap);

    for (const element of R_data) {
      let U = await User.findById(element.replier, "username profileImg");
      replierMap.set(element._id, U);
    }
    const rArr = Array.from(replierMap);

    // // console.log(Q_upvote);
    // // console.log(uArr);

    resp.send([Q_data, Asker, Q_upvote, R_data, rArr, uArr]);
  } catch (err) {
    console.error(err);
  }
});

app.post("/discussion/question", async (req, resp) => {
  const userID = req.query.userID;
  const type = req.body.type;
  const Id = req.body.Id;
  const state = req.body.state;
  const count = req.body.count;
  // // console.log("THis :" + count);
  // // console.log(state);
  // const Id = req.body.Id;
  // const count = req.body.count;

  const ur = await User.findById(userID, "-_id repliesUpvotes").then((resp) => {
    return resp.repliesUpvotes;
  });
  const uq = await User.findById(userID, "-_id questionUpvotes").then(
    (resp) => {
      return resp.questionUpvotes;
    }
  );

  if (type === "r") {
    const updated = await Resplie.updateOne({ _id: Id }, { upvotes: count });
    // // console.log(updated)
    if (state) {
      ur.push(Id);
    } else {
      // // console.log("Before : " + ur);
      let ind = ur.indexOf(Id);
      ur.splice(ind, 1);
      // // console.log("After : " + ur);
    }
    const UserUps = await User.updateOne(
      { _id: userID },
      { repliesUpvotes: ur }
    );
    // // console.log("user upvote data changed for replies : " + UserUps);
  }

  if (type === "q") {
    // console.log(Id);
    const updated = await Question.updateOne({ _id: Id }, { upvotes: count });
    // // console.log(updated)
    if (state) {
      uq.push(Id);
      // // console.log("Here in if");
    } else {
      // // console.log("Here in else");
      // // console.log("Before : " + uq);
      let ind = uq.indexOf(Id);
      uq.splice(ind, 1);
      // // console.log("After : " + uq);
    }
    const UserUps = await User.updateOne(
      { _id: userID },
      { questionUpvotes: uq }
    );
    // // console.log("user upvote data changed for replies : " + UserUps);
  }
});

app.delete('/discussion/delQue/:q_id', async (req, res) => {
  try {
    const q_id = req.params.q_id;
    const result = await Question.deleteOne({ _id: q_id });

    if (result.deletedCount === 1) {
      // console.log("Successfully deleted");
      return res.json({ message: 'Deleted successfully' });
    } else {
      // console.log("Question not found");
      return res.status(404).json({ error: 'Question not found' });
    }
  } catch (error) {
    console.error('Error deleting question:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/discussion/question/delRep/:r_id', async (req, res) => {
  try {
    const r_id = req.params.r_id;
    const result = await Resplie.deleteOne({ _id: r_id });

    if (result.deletedCount === 1) {
      // console.log("Successfully deleted");
      return res.json({ message: 'Deleted successfully' });
    } else {
      // console.log("reply not found");
      return res.status(404).json({ error: 'reply not found' });
    }
  } catch (error) {
    console.error('Error deleting reply:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// jay fanse

app.post("/adminList", async (req, res) => {
  const adminList = await User.find({isAdmin : true});
  res.send({admins : adminList});
  // console.log(adminList);
});

app.post("/getUserData", async(req,res) => {
  const id = req.query.userID;
  const userData = await User.find({userID : id});

  res.send({userData : userData});
});

app.get("/addAdmin/",async (req,res) => {
  const newAdminUsername = req.query.username;
  
  const userData = await User.findOneAndUpdate({username : newAdminUsername},{isAdmin : true});
  // console.log(userData);
  res.send({user : userData,message : "Admin Registered successfully!"});

});

app.get("/deleteAdmin/", async (req,res) => {
  const deleteUsername = req.query.username;
  await User.findOneAndUpdate({username : deleteUsername},{isAdmin : false});
  res.send({message : `${deleteUsername} is no longer an admin!`});
});

app.get("/navbar/profileImg", async (req, res) => {
  const userID = req.query.userID;
  const userData = await User.find({ _id: userID });
  res.send(userData);
});

app.get("/loginHome/contests", async (req, res) => {
  const contestData = await Contest.find({ type: "upcoming" });
  res.send(contestData);
});

app.post("/resources/rescontent", async (req, res) => {
  try {
    const resData = await resModel.find({});
    res.send(resData);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// app.get("/home/user", async (req, res) => {
//   const userID = req.query.userID;
//   try {
//     const resData = await User.find({ _id: userID });
//     res.send(resData);
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// });

app.get("/home/user/dataset", async (req,res) => {
  const jwt = req.cookies.jwtAuth;
  try {
    const resData = await User.find({'tokens.token' : jwt});
    res.send(resData);
  } catch (err) {
    res.status(500).send(err.message);
  }
});


app.get("/profile/user", async (req, res) => {
  const userID = req.query.userID;
  try {
    const resData = await User.find({ _id: userID });
    // // console.log(resData);
    res.send(resData);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/profile/projects", async (req, res) => {
  const userID = req.query.userID;
  // // console.log(userID);

  const projData = await Project.find({ contributors: { $in: [userID] } });
  // // console.log(projData);
  res.send(projData);
});

app.post("/profile/projects/members", async (req, res) => {
  const members = req.body.contributors;

  const memberDataArray = [];

  for (const memberId of members) {
    try {
      const userData = await User.findById(memberId);
      if (userData) {
        memberDataArray.push(userData);
      }
    } catch (error) {
      // console.error(`Error fetching data for userID: ${memberId}`, error);
      // Handle the error as needed
    }
  }
  // // console.log(memberDataArray);
  res.send(memberDataArray);
});

// app.get("/signin/home", async (req, res) => {
//   try {
//     const userData = await User.find({
//       username: "sohamzdfy610",
//       password: "abc123",
//     });
//     res.send(userData);
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// });

app.get("/editSkillTags/", async (req, res) => {
  const userID = req.query.userID;
  try {
    const resData = await User.find({ _id: userID });
    res.send(resData);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/editprofile/userSkills", async (req, res) => {
  const skills = req.body.userSkills;
  const userID = req.query.userID;

  try {
    const user = await User.findOne({ _id: userID });
    user.skills = skills;

    await user.save();
    res.send(user);
  } catch (err) {
    // console.log(err);
  }
});

app.post("/editprofile/personal", async (req, res) => {
  const personalData = req.body;
  const userID = req.query.userID;
  // // console.log(userID);

  let user = await User.findOne({ _id: userID });
  // // console.log(user);
  user = {
    ...user._doc,
    ...personalData,
  };

  await User.findOneAndUpdate({ _id: userID }, user, {
    new: true,
    runValidators: true,
  });

  // // console.log(user);
  res.send(personalData);
});

app.post("/editprofile/account", async (req, res) => {
  const accountData = req.body;
  const userID = req.query.userID;

  const existingData = await User.findOne({
    $and: [
      { _id: { $ne: userID } }, // Not the current user
      {
        $or: [{ username: accountData.username }, { email: accountData.email }],
      }, // Match either the username or the email
    ],
  });

  // If there is a match, handle the validation error
  if (existingData) {
    return res.status(400).json({ error: "Username or email already exists!" }); // You can handle the error as you prefer
  }

  const updatedData = await User.updateOne(
    { _id: userID },
    {
      username: accountData.username,
      email: accountData.email,
    }
  );
  return res
    .status(200)
    .json({ message: "Account details updated successfully!!" });
});

app.post("/editprofile/password", async (req, res) => {
  try {
    const newPass = req.body.newPass;
    const userID = req.query.userID;


    const updatedUser = await User.findOneAndUpdate(
      { _id: userID },
      { password: newPass }
    );

    res.send({message : "Updated successfully!"});
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).send("Error updating password");
  }
});


app.post("/editprofile/profileImg", async (req, res) => {
  const profileImg = req.body.profileImg;
  const userID = req.query.userID;

  // // console.log(profileImg);
  // // console.log(userID);

  const updatedUser = await User.updateOne(
    { _id: userID },
    { profileImg: profileImg }

  );

  // console.log(updatedUser);
  res.send({body : req.body,message : "Profile image updated sucessfully!"});
});

//kaushal

const projectCollabrationSchema = new mongoose.Schema({
  avtar: {
    type: String,
  },
  collabrationLeader: {
    type: ObjectId,
    ref: "users",
  },
  collabrationPostUsername: {
    type: String,
  },
  collabrationTitle: {
    type: String,
  },
  collabrationTags: [],
  collabrationDescription: {
    type: String,
  },
  contact: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const projectCollabration = mongoose.model(
  "projectCollabrations",
  projectCollabrationSchema
);

// app.get("/projectcollabration", async (req, res) => {
//   const projectCollabData = await projectCollabration.find({});
//   res.send(projectCollabData);
// });

app.post('/projectcollabration', async (req, res) => {
  const projectCollabData = await projectCollabration.find({});

  let realData = new Map();
  
  for(const element of projectCollabData) {
    const realtimeData = await User.findOne({_id: element.collabrationLeader}, 'profileImg username email');
    realData.set(element._id, realtimeData);
  }

  const arr = Array.from(realData);
  res.send([projectCollabData, arr]);
})

// app.post('/addprojectcollabration', async (req, res) => {
//   const data = req.body;

//   const userData = await User.findOne({_id: data.userID})
//   const collabrationData = {collabrationLeader: data.userID, ...data};
//   const addProjectCollab = new projectCollabration(collabrationData);

//   // // console.log(collabrationData)
//   const addDone = await addProjectCollab.save();
//   // res.sendFile("Project_Collabration.js", {root: '../Frontend/src/components/kaushal'})
// })


app.post("/addprojectcollabration", async (req, res) => {
  const data = req.body;

  const userData = await User.findOne({ _id: data.userID });
  const collabrationPostUsername = userData.username;
  const avtar = userData.profileImg;
  const contact = userData.email;
  const collabrationLeader = userData._id;
  const collabrationData = {
    avtar: avtar,
    ...data,
    collabrationPostUsername: collabrationPostUsername,
    contact: contact,
    collabrationLeader: collabrationLeader,
  };
  const addProjectCollab = new projectCollabration(collabrationData);

  // // console.log(collabrationData)
  const addDone = await addProjectCollab.save();
  res.send({message : "Collaboration uploaded successfully!"});
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
  express.static(
    path.join(__dirname, "..", "Frontend", "src", "components", "jay fanse")
  )
);

// app.post('/usersignup', async (req, res) => {

//     try {
//         const userData = req.body;
//         const existingData = await User.findOne({
//           $and: [
//             { $or: [{ username: userData.username }, { email: userData.email }] } // Match either the username or the email
//           ]
//         });

//         // If there is a match, handle the validation error
//         if (existingData) {
//            res.send({ error: "Username or email already exists!" }); // You can handle the error as you prefer
//         }
//         const signupUser = new User (userData)
//         // const token = await User.generateAuthToken();
//         // console.log(signupUser)
//         const signup_done = await signupUser.save();
//         const user = await User.findOne({username: userData.username})
//         res.sendFile("LoginHomePage.js", {root: '../Frontend/src/components/jay fanse'})
//         // return res.status(200).json({userID: user._id})
//         res.send({userID: user._id})
//     }
//     catch (err) {
//         // console.log(err)
//         res.sendStatus(400)
//     }
// })

// app.post("/usersignin", async (req, res) => {
//   try {
//     const loginData = req.body;
//     const userDetail = await User.findOne({
//       username: loginData.username,
//       password: loginData.password,
//     });
//     // // console.log(userDetail)
//     if (userDetail === null) res.send({ message: "Invalid User Credential" });
//     else res.status(200).send({ userID: userDetail._id });
//   } catch (err) {
//     // console.log(err);
//     res.sendStatus(400);
//   }
// });

// app.post("/usersignup", async (req, res) => {
//   try {
//     const userData = req.body;
//     const existingData = await User.findOne({
//       $and: [
//         { $or: [{ username: userData.username }, { email: userData.email }] },
//       ],
//     });

//     if (existingData) {
//       res.status(400).send({ error: "Username or email already exists!" });
//     } else {
//       const signupUser = new User(userData);
//       const signup_done = await signupUser.save();
//       const user = await User.findOne({ username: userData.username });
//       res.status(200).send({ userID: user._id });
//     }
//   } catch (err) {
//     console.error(err);
//     res.status(500).send({ error: "Internal Server Error" });
//   }
// });

app.post('/usersignin', async (req, res) => {

  try {
      const loginData = req.body;

      const userDetail = await User.findOne({username: loginData.username});
      // console.log(userDetail)
      if(userDetail == null)
      {
        res.send({message: "Invalid User Credential"})
      }
      else
      {
        const isSame = await bcrypt.compare(loginData.password, userDetail.password);

        if(!isSame)
          res.send({message: "Invalid User Credential"});
        else
        {
          const token = await userDetail.generateAuthToken();

          res.cookie("jwtAuth", token, {
            expires: new Date(Date.now() + 31536000),
            httpOnly: true
          })

          res.status(200).send({ userID: userDetail._id });
        }
      }
  } catch (err) {
      // console.log(err)
      res.sendStatus(400)
  }
})

app.post('/usersignup', async (req, res) => {
try {
    const userData = req.body;
    const existingData = await User.findOne({
        $and: [
            { $or: [{ username: userData.username }, { email: userData.email }] }
        ]
    });

    if (existingData) {
        res.status(400).send({ error: "Username or email already exists!" });
    } else {
        const signupUser = new User(userData);

        const token = await signupUser.generateAuthToken();

        res.cookie("jwtAuth", token, {
          expires: new Date(Date.now() + 31536000), 
          httpOnly: true
        });

        const signup_done = await signupUser.save();
        const user = await User.findOne({ username: userData.username });

        res.status(200).send({ userID: user._id });
    }
} catch (err) {
    console.error(err);
    res.status(500).send({ error: "Internal Server Error" });
}
});

app.get('/navbar/profileImg/dataset', async (req, res) => {
  const jwt = req.cookies.jwtAuth;
  try {
    const resData = await User.findOne({'tokens.token' : jwt});
    res.send({data : resData});
    // console.log(resData);
  } catch (err) {
    res.status(500).send(err.message);
  }
});


app.get('/remove/user/auth', async (req, res) => {
res.cookie("jwtAuth", '', { expires: new Date(0) });
// res.sendFile(__dirname, '..', '/Frontend/src/Components/kaushal/Home_page_before_login.js');
res.redirect('/');
});


app.get('/checkUser', async (req, res) => {
try {
  const jwt = req.cookies.jwtAuth;

  // console.log("TOKEN : "+jwt);

  res.status(200).send({ Token: jwt });
}
catch(err)
{
  console.error(err);
  res.status(500).send({ error: "Token is not found..." });
}
})

app.post('/check/current/password', async (req, res) => {
try {
  const jwt = req.cookies.jwtAuth;
  const userDetail = await User.findOne({'tokens.token': jwt});

  const currentPwd = req.body.currentPassword;
  const isSame = await bcrypt.compare(currentPwd, userDetail.password);
  
  console.log(isSame);

  if(!isSame)
    res.send({message: "Wrong Current Password..."});
  else
    res.send({message : ""});
}
catch(err)
{
  res.status(500).send({ message: "Server Error, Please try some time later..." });
}
})

app.post('/getUser/whoUpload', async (req, res) => {
const jwt = req.cookies.jwtAuth;
const userDetail = await User.findOne({'tokens.token': jwt});

res.send({username: userDetail.username,userData : userDetail});
})

app.post('/delete/projectCollabration/data', async (req, res) => {
const data = req.body;

const done = await projectCollabration.deleteOne({
 _id: data.projectCollabrationCardId
});

res.send();
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
