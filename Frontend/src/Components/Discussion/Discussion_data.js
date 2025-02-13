import Discussion_block from "./Discussion_block.js";
import { useEffect, useState, React } from "react";
// import {Link} from 'react-router-dom'
// import "./Discussion_Forums.css"
import useUser from "../../store/userContext.js";
import ToastComponent from "../Toast/toastComponent.js";

function ForumGenerator() {
  const [ques, setQues] = useState([]);
  const [m, setM] = useState(new Map());
	const [changeImage, setChangeImage] = useState('true');

  const [toastVisible,setToastVisible] = useState(false);
    const [toastMessage,setToastMessage] = useState("");
    const [toastType,setToastType] = useState("");
  
  const { user }= useUser();

  useEffect(() => {
    fetch('/discussion', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setQues(data.ques);

        const mArray = data.mArray;
        const map = new Map(mArray);
        setM(map);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }, []);

  function deleteQuestionFromList(key)
  {
    const newQues = ques.filter(question => question._id !== key);
    setQues(newQues);
    setToastVisible(true);
          setToastMessage("Question deleted successfully!");
          setToastType("success");
          setTimeout(() => {
            setToastVisible(false)
          }, 4000);
  }

  return (
    <>
  
      {toastVisible ? <ToastComponent message={toastMessage} type={toastType} /> : null}

      <hr style={{width: '85%', height: '2.5px', backgroundColor: 'white', margin: '0px 0px 2.5vh'}}/>
			
      {ques.length!==0 ? 

      ques.map((disc, idx) => (
          <Discussion_block
          key={idx}
          pfp={m.get(disc._id).profileImg}
          asker_username={m.get(disc._id).username}
          asker_id={m.get(disc._id)._id}
          question={disc.question}
          tags={disc.tags}
          date={disc.askDate}
          _id={disc.asker}
          q_id={disc._id}
          deleteQuestionFromList={deleteQuestionFromList}
        />
      ))
    
      :
      <div className="discussionNullContent">

        <div className="nullContentInfo">No Discussions for now :)
        <br></br>Why not start one!?</div>
        
      </div>
      }
    </>
  );
}


export default ForumGenerator